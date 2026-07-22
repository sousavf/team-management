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

// Public calendar endpoint - approved absences for the logged-out calendar.
// Exposes only who is away and when: no leave type, reason, or email.
router.get('/calendar/public', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const whereClause: any = { status: 'APPROVED' };

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
      select: {
        id: true,
        userId: true,
        startDate: true,
        endDate: true,
        status: true,
        user: { select: { id: true, name: true, role: true } }
      },
      orderBy: { startDate: 'asc' }
    });

    res.json(requests);
  } catch (error) {
    console.error(error);
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
router.post('/admin/create-holiday', authenticate, authorize('ADMIN', 'MANAGER', 'QA_MANAGER'), createAdminHolidayValidation, createAdminHoliday);
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER', 'QA_MANAGER'), updateTimeOffRequest);
router.post('/:id/cancel', authenticate, cancelTimeOffRequest);
router.delete('/:id', authenticate, deleteTimeOffRequest);

export default router;