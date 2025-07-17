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

import express from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import {
  getTimeOffRequests,
  createTimeOffRequest,
  updateTimeOffRequest,
  deleteTimeOffRequest,
  cancelTimeOffRequest,
  createAdminHoliday,
  createTimeOffRequestValidation,
  createAdminHolidayValidation
} from '../controllers/timeOffController';

const router = express.Router();
const prisma = new PrismaClient();

// Public endpoint for dashboard - returns only pending count
router.get('/dashboard/pending-count', async (req, res) => {
  try {
    const pendingCount = await prisma.timeOffRequest.count({
      where: { status: 'PENDING' }
    });
    res.json({ count: pendingCount });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Calendar endpoint - returns all approved time off requests for holiday calendar
router.get('/calendar', authenticate, async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const whereClause: any = {
      status: 'APPROVED'
    };
    
    if (startDate || endDate) {
      whereClause.OR = [
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
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Filter out sensitive information for non-admin users
    const isAdmin = req.user?.role === 'ADMIN';
    const filteredRequests = requests.map(request => {
      if (isAdmin) {
        return request;
      } else {
        // Remove type field for non-admin users
        const { type, ...requestWithoutType } = request;
        return requestWithoutType;
      }
    });

    res.json(filteredRequests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', authenticate, getTimeOffRequests);
router.post('/', authenticate, createTimeOffRequestValidation, createTimeOffRequest);
router.post('/admin/create-holiday', authenticate, authorize('ADMIN'), createAdminHolidayValidation, createAdminHoliday);
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER'), updateTimeOffRequest);
router.post('/:id/cancel', authenticate, cancelTimeOffRequest);
router.delete('/:id', authenticate, deleteTimeOffRequest);

export default router;