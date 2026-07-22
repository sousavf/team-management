import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getAllocations,
  updateAllocation,
  getTeamCapacityOverview,
  copyFromPreviousWeek,
  getTodoCapacityAggregation,
  getNextWeekTodoCapacityAggregation,
  extractHistoricalCapacity,
  exportHistoricalCapacityToExcel
} from '../controllers/capacityController';

const router = express.Router();

router.get('/allocations', authenticate, getAllocations);
router.get('/team-overview', getTeamCapacityOverview); // Public access for dashboard
router.get('/todo-capacity', authenticate, getTodoCapacityAggregation);
router.get('/next-week-todo-capacity', authenticate, getNextWeekTodoCapacityAggregation);
router.get('/extract-historical', authenticate, authorize('ADMIN', 'MANAGER', 'VIEW_ONLY'), extractHistoricalCapacity);
router.get('/export-excel', authenticate, authorize('ADMIN', 'MANAGER', 'VIEW_ONLY'), exportHistoricalCapacityToExcel);
router.put('/allocations/:userId/:weekStart', authenticate, authorize('ADMIN', 'MANAGER'), updateAllocation);
router.post('/copy-from-previous-week', authenticate, authorize('ADMIN', 'MANAGER'), copyFromPreviousWeek);

export default router;