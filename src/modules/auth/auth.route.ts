import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validate } from '#middlewares/validate.middleware.js';
import { authRateLimiter } from '#middlewares/rate-limiter.middleware.js';
import { authenticate } from '#middlewares/auth.middleware.js';
import { asyncHandler } from '#shared/utils/async-handler.js';
import {
  RegisterSchema,
  LoginSchema,
  RefreshTokenSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  VerifyEmailSchema,
  ResendVerificationSchema,
} from './auth.schema.js';

const router = Router();

/**
 * @route POST /api/v1/auth/register
 * @desc Register a new user
 */
router.post(
  '/register',
  authRateLimiter,
  validate({ body: RegisterSchema }),
  asyncHandler(authController.register)
);

/**
 * @route POST /api/v1/auth/login
 * @desc Login user & return tokens
 */
router.post(
  '/login',
  authRateLimiter,
  validate({ body: LoginSchema }),
  asyncHandler(authController.login)
);

/**
 * @route POST /api/v1/auth/verify-email
 * @desc Verify user email via token link
 */
router.post(
  '/verify-email',
  authRateLimiter,
  validate({ body: VerifyEmailSchema }),
  asyncHandler(authController.verifyEmail)
);

/**
 * @route POST /api/v1/auth/resend-verification
 * @desc Resend email verification link
 */
router.post(
  '/resend-verification',
  authRateLimiter,
  validate({ body: ResendVerificationSchema }),
  asyncHandler(authController.resendVerification)
);

/**
 * @route POST /api/v1/auth/forgot-password
 * @desc Dispatch password reset link to user email
 */
router.post(
  '/forgot-password',
  authRateLimiter,
  validate({ body: ForgotPasswordSchema }),
  asyncHandler(authController.forgotPassword)
);

/**
 * @route POST /api/v1/auth/reset-password
 * @desc Reset user password with token
 */
router.post(
  '/reset-password',
  authRateLimiter,
  validate({ body: ResetPasswordSchema }),
  asyncHandler(authController.resetPassword)
);

/**
 * @route POST /api/v1/auth/refresh
 * @desc Refresh expired access token with valid refresh token
 */
router.post(
  '/refresh',
  validate({ body: RefreshTokenSchema }),
  asyncHandler(authController.refreshToken)
);

/**
 * @route GET /api/v1/auth/me
 * @desc Get currently authenticated user profile
 */
router.get('/me', authenticate, asyncHandler(authController.getMe));

export default router;
