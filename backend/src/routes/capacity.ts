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
import { authenticate, authorize } from '../middleware/auth';
import {
  getAllocations,
  updateAllocation,
  getTeamCapacityOverview,
  copyFromPreviousWeek,
  getJiraTickets,
  getTodoCapacityAggregation,
  extractHistoricalCapacity,
  exportHistoricalCapacityToExcel
} from '../controllers/capacityController';

const router = express.Router();

router.get('/allocations', authenticate, getAllocations);
router.get('/team-overview', getTeamCapacityOverview); // Public access for dashboard
router.get('/todo-capacity', authenticate, getTodoCapacityAggregation);
router.get('/jira-tickets', authenticate, getJiraTickets);
router.get('/extract-historical', authenticate, authorize('ADMIN', 'MANAGER', 'VIEW_ONLY'), extractHistoricalCapacity);
router.get('/export-excel', authenticate, authorize('ADMIN', 'MANAGER', 'VIEW_ONLY'), exportHistoricalCapacityToExcel);
router.put('/allocations/:userId/:weekStart', authenticate, authorize('ADMIN', 'MANAGER'), updateAllocation);
router.post('/copy-from-previous-week', authenticate, authorize('ADMIN', 'MANAGER'), copyFromPreviousWeek);

export default router;