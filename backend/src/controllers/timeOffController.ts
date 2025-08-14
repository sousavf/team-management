/*
 * Team Management System
 * Copyright (C) 2025
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';

const prisma = new PrismaClient();

export const createTimeOffRequestValidation = [
  body('startDate').isISO8601().toDate(),
  body('endDate').isISO8601().toDate(),
  body('type').isIn(['VACATION', 'SICK_LEAVE', 'OTHER']),
  body('reason').optional().isString()
];

export const createAdminHolidayValidation = [
  body('userIds').isArray().withMessage('User IDs must be an array'),
  body('userIds.*').isString().withMessage('Each user ID must be a string'),
  body('startDate').isISO8601().toDate(),
  body('endDate').isISO8601().toDate(),
  body('type').isIn(['VACATION', 'SICK_LEAVE', 'OTHER']),
  body('reason').optional().isString()
];

export const getTimeOffRequests = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, status, startDate, endDate } = req.query;
    
    let whereClause: any = {};
    
    // Role-based filtering for time off requests
    if (req.user!.role === 'DEVELOPER' || req.user!.role === 'TESTER') {
      // Developers and testers can only see their own requests
      whereClause.userId = req.user!.id;
    } else if (req.user!.role === 'QA_MANAGER') {
      // QA Managers can only see TESTER requests and their own requests
      const roleFilter = {
        OR: [
          { userId: req.user!.id }, // Their own requests
          { 
            user: { 
              role: 'TESTER' 
            } 
          } // TESTER requests they can approve
        ]
      };
      whereClause = { ...whereClause, ...roleFilter };
    } else if (req.user!.role === 'MANAGER') {
      // MANAGERs can see DEVELOPER requests and their own requests, but NOT TESTER requests
      const roleFilter = {
        OR: [
          { userId: req.user!.id }, // Their own requests
          { 
            user: { 
              role: 'DEVELOPER' 
            } 
          } // DEVELOPER requests they can approve
        ]
      };
      whereClause = { ...whereClause, ...roleFilter };
      
      // If filtering by specific user, ensure it's not overridden
      if (userId) {
        whereClause = {
          AND: [
            roleFilter,
            { userId: userId as string }
          ]
        };
      }
    } else if (req.user!.role === 'ADMIN') {
      // ADMINs can see all requests, optionally filter by specific user
      if (userId) {
        whereClause.userId = userId as string;
      }
    }
    
    // Apply additional filters
    const additionalFilters: any = {};
    
    if (status) {
      additionalFilters.status = status as string;
    }
    
    if (startDate || endDate) {
      additionalFilters.OR = [
        {
          startDate: {
            gte: startDate ? new Date(startDate as string) : undefined,
            lte: endDate ? new Date(endDate as string) : undefined
          }
        },
        {
          endDate: {
            gte: startDate ? new Date(startDate as string) : undefined,
            lte: endDate ? new Date(endDate as string) : undefined
          }
        }
      ];
    }
    
    // Combine role-based filter with additional filters
    if (Object.keys(additionalFilters).length > 0) {
      if (whereClause.OR) {
        // If we already have an OR clause (for QA_MANAGER), wrap everything in AND
        whereClause = {
          AND: [
            whereClause,
            additionalFilters
          ]
        };
      } else {
        // Simple merge for other roles
        whereClause = { ...whereClause, ...additionalFilters };
      }
    }

    const requests = await prisma.timeOffRequest.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        canceller: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Filter out sensitive information for non-admin users
    const isAdmin = req.user!.role === 'ADMIN';
    const filteredRequests = requests.map(request => {
      // Always show type for user's own requests or if user is admin
      if (isAdmin || request.userId === req.user!.id) {
        return request;
      } else {
        // Remove type field for non-admin users viewing other people's requests
        const { type, ...requestWithoutType } = request;
        return requestWithoutType;
      }
    });

    res.json(filteredRequests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const createTimeOffRequest = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user has permission to create time-off requests
    if (req.user!.role === 'VIEW_ONLY') {
      return res.status(403).json({ error: 'View-only users cannot create time-off requests' });
    }

    const { startDate, endDate, type, reason } = req.body;
    const userId = req.user!.id;

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ error: 'Start date cannot be after end date' });
    }

    // Normalize dates for overlap detection
    const checkStartDate = new Date(startDate);
    const checkEndDate = new Date(endDate);
    checkStartDate.setHours(0, 0, 0, 0);
    checkEndDate.setHours(23, 59, 59, 999);

    const overlappingRequest = await prisma.timeOffRequest.findFirst({
      where: {
        userId,
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          {
            startDate: {
              lte: checkEndDate
            },
            endDate: {
              gte: checkStartDate
            }
          }
        ]
      }
    });

    if (overlappingRequest) {
      return res.status(400).json({ error: 'You already have a time-off request for this period' });
    }

    // Normalize dates to avoid timezone issues
    const normalizedStartDate = new Date(startDate);
    const normalizedEndDate = new Date(endDate);
    
    // Set time to noon to avoid timezone boundary issues
    normalizedStartDate.setHours(12, 0, 0, 0);
    normalizedEndDate.setHours(12, 0, 0, 0);

    // Managers and QA_MANAGER auto-approve their own requests
    const isManager = req.user!.role === 'MANAGER' || req.user!.role === 'QA_MANAGER';
    const status = isManager ? 'APPROVED' : 'PENDING';

    const request = await prisma.timeOffRequest.create({
      data: {
        userId,
        startDate: normalizedStartDate,
        endDate: normalizedEndDate,
        type,
        reason,
        status,
        ...(isManager && {
          approvedBy: userId,
          approvedAt: new Date()
        })
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    res.status(201).json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateTimeOffRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const approverId = req.user!.id;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const request = await prisma.timeOffRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            role: true
          }
        }
      }
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: 'Request has already been processed' });
    }

    // Authorization logic for approving requests
    const approverRole = req.user!.role;
    const requestUserRole = request.user.role;

    // Only ADMIN can approve any request
    // QA_MANAGER can only approve TESTER requests
    // MANAGER can approve DEVELOPER requests but NOT TESTER requests
    if (approverRole !== 'ADMIN') {
      if (approverRole === 'QA_MANAGER' && requestUserRole !== 'TESTER') {
        return res.status(403).json({ error: 'QA Managers can only approve tester time-off requests' });
      }
      if (approverRole === 'MANAGER' && requestUserRole === 'TESTER') {
        return res.status(403).json({ error: 'Regular managers cannot approve tester time-off requests. Contact QA Manager.' });
      }
      if (!['MANAGER', 'QA_MANAGER'].includes(approverRole)) {
        return res.status(403).json({ error: 'Not authorized to approve time-off requests' });
      }
    }

    const updatedRequest = await prisma.timeOffRequest.update({
      where: { id },
      data: {
        status,
        approvedBy: approverId,
        approvedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        canceller: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json(updatedRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const cancelTimeOffRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;
    const userId = req.user!.id;

    const request = await prisma.timeOffRequest.findUnique({
      where: { id }
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Only the user who created the request can request cancellation
    if (request.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to cancel this request' });
    }

    // Can only cancel approved requests
    if (request.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Only approved requests can be cancelled' });
    }

    // Update the request to cancelled status
    const updatedRequest = await prisma.timeOffRequest.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledBy: userId,
        cancelledAt: new Date(),
        cancellationReason
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        canceller: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json(updatedRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const createAdminHoliday = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userIds, startDate, endDate, type, reason } = req.body;
    const adminId = req.user!.id;

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ error: 'Start date cannot be after end date' });
    }

    // Role-based user filtering for team holiday creation
    const creatorRole = req.user!.role;
    let userRoleFilter: any;

    if (creatorRole === 'ADMIN') {
      // ADMINs can create holidays for anyone except other ADMINs
      userRoleFilter = { not: 'ADMIN' };
    } else if (creatorRole === 'MANAGER') {
      // MANAGERs can only create holidays for DEVELOPERs
      userRoleFilter = 'DEVELOPER';
    } else if (creatorRole === 'QA_MANAGER') {
      // QA_MANAGERs can only create holidays for TESTERs
      userRoleFilter = 'TESTER';
    } else {
      return res.status(403).json({ error: 'Not authorized to create team holidays' });
    }

    // Verify all userIds exist and match the role restrictions
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        role: userRoleFilter
      }
    });

    if (users.length !== userIds.length) {
      const roleDescription = creatorRole === 'ADMIN' ? 'non-admin users' : 
                             creatorRole === 'MANAGER' ? 'developers' : 'testers';
      return res.status(400).json({ 
        error: `Some users not found or you can only create holidays for ${roleDescription}` 
      });
    }

    const createdRequests = [];

    for (const userId of userIds) {
      // Check for overlapping requests
      const checkStartDate = new Date(startDate);
      const checkEndDate = new Date(endDate);
      checkStartDate.setHours(0, 0, 0, 0);
      checkEndDate.setHours(23, 59, 59, 999);

      const overlappingRequest = await prisma.timeOffRequest.findFirst({
        where: {
          userId,
          status: { in: ['PENDING', 'APPROVED'] },
          OR: [
            {
              startDate: {
                lte: checkEndDate
              },
              endDate: {
                gte: checkStartDate
              }
            }
          ]
        }
      });

      if (overlappingRequest) {
        return res.status(400).json({ 
          error: `User ${users.find(u => u.id === userId)?.name} already has a time-off request for this period` 
        });
      }

      // Normalize dates to avoid timezone issues
      const normalizedStartDate = new Date(startDate);
      const normalizedEndDate = new Date(endDate);
      
      // Set time to noon to avoid timezone boundary issues
      normalizedStartDate.setHours(12, 0, 0, 0);
      normalizedEndDate.setHours(12, 0, 0, 0);

      // Create approved holiday request
      const request = await prisma.timeOffRequest.create({
        data: {
          userId,
          startDate: normalizedStartDate,
          endDate: normalizedEndDate,
          type,
          reason: reason || 'Admin-created holiday',
          status: 'APPROVED',
          isAdminCreated: true,
          createdBy: adminId,
          approvedBy: adminId,
          approvedAt: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      createdRequests.push(request);
    }

    res.status(201).json({
      message: `Created ${createdRequests.length} holiday requests`,
      requests: createdRequests
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteTimeOffRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const request = await prisma.timeOffRequest.findUnique({
      where: { id }
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.userId !== userId && !['ADMIN', 'MANAGER', 'QA_MANAGER'].includes(req.user!.role)) {
      return res.status(403).json({ error: 'Not authorized to delete this request' });
    }

    // Admins can delete approved requests if they are admin-created holidays
    // Managers and QA_MANAGER can delete their own approved requests
    if (request.status === 'APPROVED' && 
        !(req.user!.role === 'ADMIN' && request.isAdminCreated) && 
        !(['MANAGER', 'QA_MANAGER'].includes(req.user!.role) && request.userId === userId)) {
      return res.status(400).json({ error: 'Cannot delete approved requests. Use cancel instead.' });
    }

    await prisma.timeOffRequest.delete({
      where: { id }
    });

    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};