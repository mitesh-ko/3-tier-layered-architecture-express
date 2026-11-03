import { z } from 'zod';
import {
  USER_STATUSES,
  ADDRESS_TYPE,
  ADDRESS_TYPES,
  GENDERS,
} from '#constants/user.constant.js';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const UserIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid User ID format. Must be a 24-character hexadecimal string'),
});

export const ListUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum(USER_STATUSES).optional(),
  search: z.string().trim().optional(),
});

export const AddressSchema = z.object({
  type: z.enum(ADDRESS_TYPES).default(ADDRESS_TYPE.HOME),
  isDefault: z.boolean().default(false),
  fullName: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  street: z.string().trim().min(1, 'Street is required'),
  apartment: z.string().trim().optional(),
  city: z.string().trim().min(1, 'City is required'),
  state: z.string().trim().optional(),
  postalCode: z.string().trim().min(1, 'Postal code is required'),
  country: z.string().trim().default('US'),
});

export const ProfileSchema = z.object({
  avatar: z.string().url('Must be a valid URL').optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  dateOfBirth: z.coerce.date().optional().nullable(),
  gender: z.enum(GENDERS).optional().nullable(),
});

export const UpdateUserSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().max(50).optional(),
  name: z.string().min(2).max(100).optional(),
  phone: z.string().trim().optional().nullable(),
  status: z.enum(USER_STATUSES).optional(),
  profile: z
    .union([
      ProfileSchema,
      z.array(
        z.object({
          type: z.string().optional(),
          url: z.string().url('Must be a valid URL'),
        })
      ),
    ])
    .optional(),
  addresses: z.array(AddressSchema).optional(),
});

export type UserIdParam = z.infer<typeof UserIdParamSchema>;
export type ListUsersQuery = z.infer<typeof ListUsersQuerySchema>;
export type AddressDto = z.infer<typeof AddressSchema>;
export type ProfileDto = z.infer<typeof ProfileSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
