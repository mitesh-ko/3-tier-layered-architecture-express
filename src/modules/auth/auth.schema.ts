import { z } from 'zod';

const passwordRule = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const RegisterSchema = z
  .object({
    firstName: z.string().trim().min(1, 'First name must be at least 1 character').max(50).optional(),
    lastName: z.string().trim().max(50).optional(),
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
    email: z.string().trim().email('Invalid email address').toLowerCase(),
    phone: z.string().trim().optional(),
    password: passwordRule,
    confirmPassword: z.string(),
  })
  .refine((data) => Boolean(data.firstName || data.name), {
    message: 'Either firstName or name is required',
    path: ['firstName'],
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const LoginSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
});

export const ResetPasswordSchema = z
  .object({
    token: z.string().trim().min(1, 'Reset token is required'),
    password: passwordRule,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const VerifyEmailSchema = z.object({
  token: z.string().trim().min(1, 'Verification token is required'),
});

export const ResendVerificationSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>;
export type ForgotPasswordDto = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>;
export type VerifyEmailDto = z.infer<typeof VerifyEmailSchema>;
export type ResendVerificationDto = z.infer<typeof ResendVerificationSchema>;
