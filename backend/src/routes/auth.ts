import express from 'express';
import {
  login,
  loginValidation,
  forgotPassword,
  resetPassword,
  forgotPasswordValidation,
  resetPasswordValidation
} from '../controllers/authController';
import rateLimit from 'express-rate-limit';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs (allows ~20 developers from same IP)
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', authLimiter, loginValidation, login);
router.post('/forgot-password', authLimiter, forgotPasswordValidation, forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordValidation, resetPassword);

export default router;