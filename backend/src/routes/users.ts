import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getUsers,
  getPublicUsers,
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

// Public roster for the logged-out calendar (no auth).
router.get('/public', getPublicUsers);
router.get('/me', authenticate, getCurrentUser);
router.post('/change-password', authenticate, changePasswordValidation, changePassword);
router.get('/', authenticate, getUsers);
router.get('/:id', authenticate, getUser);
router.post('/', authenticate, authorize('ADMIN', 'MANAGER', 'QA_MANAGER'), createUserValidation, createUser);
router.put('/:id', authenticate, authorize('ADMIN', 'MANAGER', 'QA_MANAGER'), updateUserValidation, updateUser);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteUser);

export default router;