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
import { startOfWeek, addWeeks, format, parseISO, isWithinInterval, addDays } from 'date-fns';
import { jiraService } from '../services/jiraService';

const prisma = new PrismaClient();

const HOURS_PER_DAY = 8;
const WORKING_DAYS_PER_WEEK = 5;
const DEFAULT_PACE_FACTOR = parseFloat(process.env.PACE_FACTOR || '0.8');

// Calculate working days for a user in a given week, accounting for time off
const calculateWorkingDays = async (userId: string, weekStart: Date): Promise<number> => {
  const weekEnd = addDays(weekStart, 6);
  
  // Get approved time off requests for this user during this week
  const timeOffRequests = await prisma.timeOffRequest.findMany({
    where: {
      userId,
      status: 'APPROVED',
      OR: [
        {
          startDate: {
            lte: weekEnd
          },
          endDate: {
            gte: weekStart
          }
        }
      ]
    }
  });

  let workingDays = WORKING_DAYS_PER_WEEK;
  
  // Calculate days off during this week
  for (const request of timeOffRequests) {
    // Normalize dates to avoid timezone issues in calculations
    const requestStartDate = new Date(request.startDate);
    const requestEndDate = new Date(request.endDate);
    
    // Reset time to midnight for consistent day-based calculations
    requestStartDate.setHours(0, 0, 0, 0);
    requestEndDate.setHours(0, 0, 0, 0);
    
    const weekStartNorm = new Date(weekStart);
    const weekEndNorm = new Date(weekEnd);
    weekStartNorm.setHours(0, 0, 0, 0);
    weekEndNorm.setHours(0, 0, 0, 0);
    
    const overlapStart = new Date(Math.max(weekStartNorm.getTime(), requestStartDate.getTime()));
    const overlapEnd = new Date(Math.min(weekEndNorm.getTime(), requestEndDate.getTime()));
    
    // Count working days (Monday to Friday) in the overlap period
    // Both start and end dates are inclusive
    let daysOff = 0;
    let currentDate = new Date(overlapStart);
    
    while (currentDate <= overlapEnd) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
        daysOff++;
      }
      currentDate = addDays(currentDate, 1);
    }
    
    workingDays -= daysOff;
  }
  
  return Math.max(0, workingDays);
};

export const getAllocations = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, weekStart, weeks = 4 } = req.query;
    
    const startDate = weekStart ? parseISO(weekStart as string) : startOfWeek(new Date(), { weekStartsOn: 1 });
    const endDate = addWeeks(startDate, parseInt(weeks as string));

    const whereClause: any = {
      weekStart: {
        gte: startDate,
        lt: endDate
      },
      user: {
        role: {
          notIn: ['ADMIN', 'MANAGER', 'VIEW_ONLY']
        }
      }
    };

    if (userId) {
      whereClause.userId = userId as string;
    }

    const allocations = await prisma.allocation.findMany({
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
      orderBy: [
        { weekStart: 'asc' },
        { user: { name: 'asc' } }
      ]
    });

    const capacityData = await Promise.all(allocations.map(async allocation => {
      const totalAllocation = 
        allocation.backendDevelopment +
        allocation.frontendDevelopment +
        allocation.codeReview +
        allocation.releaseManagement +
        allocation.ux +
        allocation.technicalAnalysis +
        allocation.devSupport;

      const workingDays = await calculateWorkingDays(allocation.userId, allocation.weekStart);
      const maxHours = workingDays * HOURS_PER_DAY * DEFAULT_PACE_FACTOR;
      const allocatedHours = maxHours * (totalAllocation / 100);

      return {
        ...allocation,
        totalAllocation,
        maxHours,
        allocatedHours,
        availableHours: maxHours - allocatedHours,
        workingDays,
        maxWorkingDays: WORKING_DAYS_PER_WEEK, // Theoretical max without holidays
        weekStartFormatted: format(allocation.weekStart, 'yyyy-MM-dd')
      };
    }));

    res.json(capacityData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateAllocation = async (req: AuthRequest, res: Response) => {
  try {
    // Check if user has permission to update allocations
    if (req.user!.role === 'VIEW_ONLY') {
      return res.status(403).json({ error: 'View-only users cannot update allocations' });
    }

    const { userId, weekStart } = req.params;
    const {
      backendDevelopment,
      frontendDevelopment,
      codeReview,
      releaseManagement,
      ux,
      technicalAnalysis,
      devSupport,
      weeklyPriority
    } = req.body;

    const totalAllocation = 
      backendDevelopment + frontendDevelopment + codeReview + 
      releaseManagement + ux + technicalAnalysis + devSupport;

    if (totalAllocation > 100) {
      return res.status(400).json({ error: 'Total allocation cannot exceed 100%' });
    }

    const weekStartDate = parseISO(weekStart);

    const allocation = await prisma.allocation.upsert({
      where: {
        userId_weekStart: {
          userId,
          weekStart: weekStartDate
        }
      },
      update: {
        backendDevelopment,
        frontendDevelopment,
        codeReview,
        releaseManagement,
        ux,
        technicalAnalysis,
        devSupport,
        weeklyPriority
      },
      create: {
        userId,
        weekStart: weekStartDate,
        backendDevelopment,
        frontendDevelopment,
        codeReview,
        releaseManagement,
        ux,
        technicalAnalysis,
        devSupport,
        weeklyPriority
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

    res.json(allocation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const copyFromPreviousWeek = async (req: AuthRequest, res: Response) => {
  try {
    // Check if user has permission to copy allocations
    if (req.user!.role === 'VIEW_ONLY') {
      return res.status(403).json({ error: 'View-only users cannot copy allocations' });
    }

    const { weekStart } = req.body;
    const targetWeekStart = parseISO(weekStart);
    const previousWeekStart = addWeeks(targetWeekStart, -1);

    // Get all allocations from the previous week (excluding admin and view-only users)
    const previousWeekAllocations = await prisma.allocation.findMany({
      where: {
        weekStart: previousWeekStart,
        user: {
          role: {
            notIn: ['ADMIN', 'MANAGER', 'VIEW_ONLY']
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    if (previousWeekAllocations.length === 0) {
      return res.status(404).json({ error: 'No allocations found for the previous week' });
    }

    // Create or update allocations for the target week
    const copiedAllocations = [];
    
    for (const prevAllocation of previousWeekAllocations) {
      const copiedAllocation = await prisma.allocation.upsert({
        where: {
          userId_weekStart: {
            userId: prevAllocation.userId,
            weekStart: targetWeekStart
          }
        },
        update: {
          backendDevelopment: prevAllocation.backendDevelopment,
          frontendDevelopment: prevAllocation.frontendDevelopment,
          codeReview: prevAllocation.codeReview,
          releaseManagement: prevAllocation.releaseManagement,
          ux: prevAllocation.ux,
          technicalAnalysis: prevAllocation.technicalAnalysis,
          devSupport: prevAllocation.devSupport,
          weeklyPriority: prevAllocation.weeklyPriority
        },
        create: {
          userId: prevAllocation.userId,
          weekStart: targetWeekStart,
          backendDevelopment: prevAllocation.backendDevelopment,
          frontendDevelopment: prevAllocation.frontendDevelopment,
          codeReview: prevAllocation.codeReview,
          releaseManagement: prevAllocation.releaseManagement,
          ux: prevAllocation.ux,
          technicalAnalysis: prevAllocation.technicalAnalysis,
          devSupport: prevAllocation.devSupport,
          weeklyPriority: prevAllocation.weeklyPriority
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

      copiedAllocations.push(copiedAllocation);
    }

    res.json({
      message: `Copied ${copiedAllocations.length} allocations from previous week`,
      allocations: copiedAllocations,
      sourceWeek: format(previousWeekStart, 'yyyy-MM-dd'),
      targetWeek: format(targetWeekStart, 'yyyy-MM-dd')
    });
  } catch (error) {
    console.error('Error copying from previous week:', error);
    res.status(500).json({ error: 'Failed to copy allocations from previous week' });
  }
};

export const getTeamCapacityOverview = async (req: AuthRequest, res: Response) => {
  try {
    const { weekStart, weeks = 4 } = req.query;
    
    const startDate = weekStart ? parseISO(weekStart as string) : startOfWeek(new Date(), { weekStartsOn: 1 });
    const endDate = addWeeks(startDate, parseInt(weeks as string));

    const allocations = await prisma.allocation.findMany({
      where: {
        weekStart: {
          gte: startDate,
          lt: endDate
        },
        user: {
          role: {
            notIn: ['ADMIN', 'MANAGER', 'VIEW_ONLY']
          }
        }
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

    const users = await prisma.user.findMany({
      where: {
        role: {
          notIn: ['ADMIN', 'MANAGER', 'VIEW_ONLY']
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    const weeklyOverview = [];
    let currentWeek = startDate;
    
    while (currentWeek < endDate) {
      const weekAllocations = allocations.filter(a => 
        a.weekStart.getTime() === currentWeek.getTime()
      );

      // Calculate total capacity for this week accounting for holidays
      let totalCapacity = 0;
      for (const user of users) {
        const workingDays = await calculateWorkingDays(user.id, currentWeek);
        totalCapacity += workingDays * HOURS_PER_DAY * DEFAULT_PACE_FACTOR;
      }

      const teamCapacity = {
        weekStart: format(currentWeek, 'yyyy-MM-dd'),
        totalTeamMembers: users.length,
        allocatedMembers: weekAllocations.length,
        totalCapacity, // Actual available capacity (accounting for holidays/time off)
        theoreticalMaxCapacity: users.length * WORKING_DAYS_PER_WEEK * HOURS_PER_DAY * DEFAULT_PACE_FACTOR, // Theoretical max if everyone available
        allocatedCapacity: 0,
        categoryBreakdown: {
          backendDevelopment: 0,
          frontendDevelopment: 0,
          codeReview: 0,
          releaseManagement: 0,
          ux: 0,
          technicalAnalysis: 0,
          devSupport: 0
        }
      };

      for (const allocation of weekAllocations) {
        const workingDays = await calculateWorkingDays(allocation.userId, currentWeek);
        const maxHours = workingDays * HOURS_PER_DAY * DEFAULT_PACE_FACTOR;
        const totalAllocation = 
          allocation.backendDevelopment + allocation.frontendDevelopment + 
          allocation.codeReview + allocation.releaseManagement + 
          allocation.ux + allocation.technicalAnalysis + allocation.devSupport;

        teamCapacity.allocatedCapacity += maxHours * (totalAllocation / 100);
        teamCapacity.categoryBreakdown.backendDevelopment += maxHours * (allocation.backendDevelopment / 100);
        teamCapacity.categoryBreakdown.frontendDevelopment += maxHours * (allocation.frontendDevelopment / 100);
        teamCapacity.categoryBreakdown.codeReview += maxHours * (allocation.codeReview / 100);
        teamCapacity.categoryBreakdown.releaseManagement += maxHours * (allocation.releaseManagement / 100);
        teamCapacity.categoryBreakdown.ux += maxHours * (allocation.ux / 100);
        teamCapacity.categoryBreakdown.technicalAnalysis += maxHours * (allocation.technicalAnalysis / 100);
        teamCapacity.categoryBreakdown.devSupport += maxHours * (allocation.devSupport / 100);
      }

      weeklyOverview.push(teamCapacity);
      currentWeek = addWeeks(currentWeek, 1);
    }

    res.json(weeklyOverview);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getJiraTickets = async (req: AuthRequest, res: Response) => {
  try {
    if (!jiraService.isEnabled()) {
      return res.json({ 
        enabled: false, 
        message: 'JIRA integration is not configured',
        userTickets: []
      });
    }

    const users = await prisma.user.findMany({
      where: {
        role: {
          notIn: ['ADMIN', 'MANAGER', 'VIEW_ONLY']
        }
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    const userTickets = users.map(user => ({
      userId: user.id,
      name: user.name,
      email: user.email,
      tickets: jiraService.getTicketsForUser(user.email).map(ticket => ({
        key: ticket.key,
        summary: ticket.summary,
        url: jiraService.getJiraTicketUrl(ticket.key),
        issueType: ticket.issueType
      }))
    }));

    res.json({
      enabled: true,
      userTickets
    });
  } catch (error) {
    console.error('Error getting JIRA tickets:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getTodoCapacityAggregation = async (req: AuthRequest, res: Response) => {
  try {
    // Get current week
    const currentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
    
    // Get all allocations for current week with TODO priorities
    const allocations = await prisma.allocation.findMany({
      where: {
        weekStart: currentWeek,
        weeklyPriority: {
          not: null
        },
        user: {
          role: {
            notIn: ['ADMIN', 'MANAGER', 'VIEW_ONLY']
          }
        }
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

    // Group allocations by TODO priority (case insensitive)
    const todoAggregation = new Map<string, {
      priority: string;
      backendHours: number;
      frontendHours: number;
      totalHours: number;
      userCount: number;
      users: string[];
    }>();

    for (const allocation of allocations) {
      if (!allocation.weeklyPriority?.trim()) continue;
      
      const priority = allocation.weeklyPriority.trim();
      const priorityKey = priority.toLowerCase();
      
      // Calculate working days and hours for this user
      const workingDays = await calculateWorkingDays(allocation.userId, currentWeek);
      const maxHours = workingDays * HOURS_PER_DAY * DEFAULT_PACE_FACTOR;
      
      // Calculate backend and frontend hours
      const backendHours = maxHours * (allocation.backendDevelopment / 100);
      const frontendHours = maxHours * (allocation.frontendDevelopment / 100);
      const totalAllocatedHours = backendHours + frontendHours;

      if (!todoAggregation.has(priorityKey)) {
        todoAggregation.set(priorityKey, {
          priority: priority, // Use original case for display
          backendHours: 0,
          frontendHours: 0,
          totalHours: 0,
          userCount: 0,
          users: []
        });
      }

      const existing = todoAggregation.get(priorityKey)!;
      existing.backendHours += backendHours;
      existing.frontendHours += frontendHours;
      existing.totalHours += totalAllocatedHours;
      
      if (!existing.users.includes(allocation.user.name)) {
        existing.users.push(allocation.user.name);
        existing.userCount++;
      }
    }

    // Convert to array and sort by total hours descending
    const result = Array.from(todoAggregation.values())
      .sort((a, b) => b.totalHours - a.totalHours);

    res.json({
      weekStart: format(currentWeek, 'yyyy-MM-dd'),
      totalAllocations: allocations.length,
      todoCapacities: result
    });
  } catch (error) {
    console.error('Error getting TODO capacity aggregation:', error);
    res.status(500).json({ error: 'Server error' });
  }
};