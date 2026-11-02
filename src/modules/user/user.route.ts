import { Router } from 'express';
import { userController } from './user.controller.js';
import { authenticate } from '#middlewares/auth.middleware.js';
import { validate } from '#middlewares/validate.middleware.js';
import { asyncHandler } from '#shared/utils/async-handler.js';
import { UserIdParamSchema, ListUsersQuerySchema, UpdateUserSchema } from './user.schema.js';

const router = Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @route GET /api/v1/users
 * @desc Get paginated list of users
 */
router.get(
  '/',
  validate({ query: ListUsersQuerySchema }),
  asyncHandler(userController.listAll)
);

/**
 * @route GET /api/v1/users/:id
 * @desc Get user by ID
 */
router.get(
  '/:id',
  validate({ params: UserIdParamSchema }),
  asyncHandler(userController.getById)
);

/**
 * @route PUT /api/v1/users/:id
 * @desc Update user profile (Self)
 */
router.put(
  '/:id',
  validate({ params: UserIdParamSchema, body: UpdateUserSchema }),
  asyncHandler(userController.update)
);

/**
 * @route DELETE /api/v1/users/:id
 * @desc Delete user (Self)
 */
router.delete(
  '/:id',
  validate({ params: UserIdParamSchema }),
  asyncHandler(userController.delete)
);

export default router;
