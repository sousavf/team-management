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
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getCurrentUser,
  changePassword,
  createUserValidation,
  updateUserValidation,
  changePasswordValidation
} from '../controllers/userController';

const router = express.Router();

router.get('/me', authenticate, getCurrentUser);
router.post('/change-password', authenticate, changePasswordValidation, changePassword);
router.get('/', authenticate, getUsers);
router.get('/:id', authenticate, getUser);
router.post('/', authenticate, authorize('ADMIN', 'MANAGER', 'QA_MANAGER'), createUserValidation, createUser);
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER', 'QA_MANAGER'), updateUserValidation, updateUser);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteUser);

export default router;