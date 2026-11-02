import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '#modules/auth/auth.service.js';
import { UserRepository } from '#modules/user/user.repository.js';
import { ConflictError, UnauthorizedError } from '#errors/index.js';

import bcrypt from 'bcryptjs';
import { addHours, subMinutes } from '#shared/utils/date.util.js';
import { TokenService } from '#shared/services/token.service.js';

describe('AuthService (Unit Tests)', () => {
  let authService: AuthService;
  let mockUserRepo: Partial<UserRepository>;

  beforeEach(() => {
    mockUserRepo = {
      existsByEmail: vi.fn(),
      create: vi.fn(),
      findByEmailWithPassword: vi.fn(),
      findById: vi.fn(),
    };
    authService = new AuthService(mockUserRepo as UserRepository);
  });

  describe('register', () => {
    it('should throw ConflictError if user already exists', async () => {
      vi.mocked(mockUserRepo.existsByEmail!).mockResolvedValue(true);

      await expect(
        authService.register({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        })
      ).rejects.toThrow(ConflictError);
    });

    it('should register a new user and return tokens', async () => {
      vi.mocked(mockUserRepo.existsByEmail!).mockResolvedValue(false);

      const mockUser = {
        _id: '64e72f3bb6dc7b001f2a8c12',
        name: 'John Doe',
        email: 'john@example.com',
        status: 'active' as const,
        toSafeObject: () => ({
          _id: '64e72f3bb6dc7b001f2a8c12',
          name: 'John Doe',
          email: 'john@example.com',
          status: 'active' as const,
        }),
      };

      vi.mocked(mockUserRepo.create!).mockResolvedValue(mockUser as any);

      const result = await authService.register({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

      expect(result.user.email).toBe('john@example.com');
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedError when user is not found', async () => {
      vi.mocked(mockUserRepo.findByEmailWithPassword!).mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'notfound@example.com',
          password: 'Password123!',
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError when password does not match', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword123!', 10);
      const mockUser = {
        _id: '64e72f3bb6dc7b001f2a8c12',
        email: 'john@example.com',
        password: hashedPassword,
        status: 'active',
        toSafeObject: vi.fn(),
      };
      vi.mocked(mockUserRepo.findByEmailWithPassword!).mockResolvedValue(mockUser as any);

      await expect(
        authService.login({
          email: 'john@example.com',
          password: 'WrongPassword123!',
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should log in successfully with correct credentials', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      const mockUser = {
        _id: '64e72f3bb6dc7b001f2a8c12',
        email: 'john@example.com',
        password: hashedPassword,
        status: 'active',
        failedLoginAttempts: 0,
        lastLoginIp: null as string | null,
        toSafeObject: () => ({
          _id: '64e72f3bb6dc7b001f2a8c12',
          email: 'john@example.com',
          status: 'active',
        }),
      };
      vi.mocked(mockUserRepo.findByEmailWithPassword!).mockResolvedValue(mockUser as any);

      const result = await authService.login(
        {
          email: 'john@example.com',
          password: 'Password123!',
        },
        '192.168.1.100'
      );

      expect(result.tokens.accessToken).toBeDefined();
      expect(result.user.email).toBe('john@example.com');
      expect(mockUser.lastLoginIp).toBe('192.168.1.100');
      expect(mockUser.failedLoginAttempts).toBe(0);
    });

    it('should lock account after 5 consecutive failed attempts', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword123!', 10);
      const mockUser = {
        _id: '64e72f3bb6dc7b001f2a8c12',
        email: 'john@example.com',
        password: hashedPassword,
        status: 'active',
        failedLoginAttempts: 4,
        lockUntil: null as Date | null,
        save: vi.fn(),
      };
      vi.mocked(mockUserRepo.findByEmailWithPassword!).mockResolvedValue(mockUser as any);

      await expect(
        authService.login({
          email: 'john@example.com',
          password: 'WrongPassword123!',
        })
      ).rejects.toThrow(UnauthorizedError);

      expect(mockUser.failedLoginAttempts).toBe(5);
      expect(mockUser.lockUntil).toBeDefined();
    });

    it('should reject login if account is currently locked', async () => {
      const mockUser = {
        _id: '64e72f3bb6dc7b001f2a8c12',
        email: 'john@example.com',
        password: 'hashed-password',
        status: 'active',
        lockUntil: addHours(new Date(), 1), // 1 hour in the future
      };
      vi.mocked(mockUserRepo.findByEmailWithPassword!).mockResolvedValue(mockUser as any);

      await expect(
        authService.login({
          email: 'john@example.com',
          password: 'Password123!',
        })
      ).rejects.toThrow('Account is temporarily locked');
    });

    it('should reject login if user account is suspended or banned', async () => {
      const mockUser = {
        _id: '64e72f3bb6dc7b001f2a8c12',
        email: 'john@example.com',
        password: 'hashed-password',
        status: 'suspended',
      };
      vi.mocked(mockUserRepo.findByEmailWithPassword!).mockResolvedValue(mockUser as any);

      await expect(
        authService.login({
          email: 'john@example.com',
          password: 'Password123!',
        })
      ).rejects.toThrow('suspended');
    });

    it('should reject login if account has been soft-deleted', async () => {
      const mockUser = {
        _id: '64e72f3bb6dc7b001f2a8c12',
        email: 'john@example.com',
        password: 'hashed-password',
        status: 'active',
        deletedAt: new Date(),
      };
      vi.mocked(mockUserRepo.findByEmailWithPassword!).mockResolvedValue(mockUser as any);

      await expect(
        authService.login({
          email: 'john@example.com',
          password: 'Password123!',
        })
      ).rejects.toThrow('deleted');
    });
  });

  describe('verifyEmail', () => {
    it('should throw BadRequestError if token is invalid or expired', async () => {
      mockUserRepo.findByEmailVerificationToken = vi.fn().mockResolvedValue(null);

      await expect(
        authService.verifyEmail({ token: 'invalid-or-expired-token' })
      ).rejects.toThrow();
    });

    it('should verify email and set isEmailVerified to true for valid token', async () => {
      const mockUser = {
        _id: '64e72f3bb6dc7b001f2a8c12',
        email: 'john@example.com',
        emailVerifiedAt: null as Date | null,
        emailVerificationToken: 'some-hash',
        emailVerificationExpires: addHours(new Date(), 24),
        save: vi.fn().mockResolvedValue(true),
      };

      mockUserRepo.findByEmailVerificationToken = vi.fn().mockResolvedValue(mockUser as any);

      const result = await authService.verifyEmail({ token: 'valid-token' });

      expect(mockUser.emailVerifiedAt).toBeDefined();
      expect(mockUser.emailVerificationToken).toBeNull();
      expect(mockUser.save).toHaveBeenCalled();
      expect(result.isEmailVerified).toBe(true);
    });
  });

  describe('resendVerificationEmail', () => {
    it('should return generic safe response if user does not exist', async () => {
      mockUserRepo.findByEmail = vi.fn().mockResolvedValue(null);

      const result = await authService.resendVerificationEmail({ email: 'unknown@example.com' });

      expect(result.message).toContain('verification link has been sent');
    });

    it('should generate new token and return message if user is unverified', async () => {
      const mockUser = {
        _id: '64e72f3bb6dc7b001f2a8c12',
        email: 'john@example.com',
        isEmailVerified: false,
        save: vi.fn().mockResolvedValue(true),
      };

      mockUserRepo.findByEmail = vi.fn().mockResolvedValue(mockUser as any);

      const result = await authService.resendVerificationEmail({ email: 'john@example.com' });

      expect(mockUser.save).toHaveBeenCalled();
      expect(result.message).toContain('verification link has been sent');
    });
  });

  describe('forgotPassword', () => {
    it('should return generic safe response if user does not exist', async () => {
      mockUserRepo.findByEmail = vi.fn().mockResolvedValue(null);

      const result = await authService.forgotPassword({ email: 'notfound@example.com' });

      expect(result.message).toContain('password reset link has been dispatched');
    });

    it('should set reset token and return safe response when user exists', async () => {
      const mockUser = {
        _id: '64e72f3bb6dc7b001f2a8c12',
        email: 'john@example.com',
        passwordResetToken: null,
        passwordResetExpires: null,
        save: vi.fn().mockResolvedValue(true),
      };

      mockUserRepo.findByEmail = vi.fn().mockResolvedValue(mockUser as any);

      const result = await authService.forgotPassword({ email: 'john@example.com' });

      expect(mockUser.save).toHaveBeenCalled();
      expect(mockUser.passwordResetToken).toBeDefined();
      expect(mockUser.passwordResetExpires).toBeDefined();
      expect(result.message).toContain('password reset link has been dispatched');
    });
  });

  describe('resetPassword', () => {
    it('should throw BadRequestError if reset token is invalid or expired', async () => {
      mockUserRepo.findByPasswordResetToken = vi.fn().mockResolvedValue(null);

      await expect(
        authService.resetPassword({
          token: 'invalid-token',
          password: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        })
      ).rejects.toThrow();
    });

    it('should successfully update password and clear reset token when valid', async () => {
      const mockUser = {
        _id: '64e72f3bb6dc7b001f2a8c12',
        email: 'john@example.com',
        password: 'old-hashed-password',
        passwordResetToken: 'token-hash',
        passwordResetExpires: addHours(new Date(), 1),
        passwordChangedAt: null,
        save: vi.fn().mockResolvedValue(true),
      };

      mockUserRepo.findByPasswordResetToken = vi.fn().mockResolvedValue(mockUser as any);

      const result = await authService.resetPassword({
        token: 'valid-token',
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
      });

      expect(mockUser.password).not.toBe('old-hashed-password');
      expect(mockUser.passwordResetToken).toBeNull();
      expect(mockUser.passwordResetExpires).toBeNull();
      expect(mockUser.passwordChangedAt).toBeDefined();
      expect(mockUser.save).toHaveBeenCalled();
      expect(result.message).toContain('Password has been reset successfully');
    });
  });

  describe('refreshTokens', () => {
    it('should throw UnauthorizedError if password was changed after token issuance', async () => {
      const now = new Date();
      // Token was issued 10 minutes ago
      const tokenIat = Math.floor(subMinutes(now, 10).getTime() / 1000);
      // Password was changed 5 minutes ago
      const passwordChangedAt = subMinutes(now, 5);

      vi.spyOn(TokenService, 'verifyRefreshToken').mockReturnValue({
        userId: '64e72f3bb6dc7b001f2a8c12',
        email: 'john@example.com',
        iat: tokenIat,
      } as any);

      const mockUser = {
        _id: '64e72f3bb6dc7b001f2a8c12',
        email: 'john@example.com',
        status: 'active',
        passwordChangedAt,
      };

      vi.mocked(mockUserRepo.findById!).mockResolvedValue(mockUser as any);

      await expect(authService.refreshTokens('dummy-token')).rejects.toThrow(
        UnauthorizedError
      );
    });

    it('should rotate tokens if password was not changed after issuance', async () => {
      const now = new Date();
      // Token was issued now
      const tokenIat = Math.floor(now.getTime() / 1000);
      // Password changed 1 hour ago
      const passwordChangedAt = subMinutes(now, 60);

      vi.spyOn(TokenService, 'verifyRefreshToken').mockReturnValue({
        userId: '64e72f3bb6dc7b001f2a8c12',
        email: 'john@example.com',
        iat: tokenIat,
      } as any);

      vi.spyOn(TokenService, 'generateTokens').mockReturnValue({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
        expiresIn: '15m',
      });

      const mockUser = {
        _id: '64e72f3bb6dc7b001f2a8c12',
        email: 'john@example.com',
        status: 'active',
        passwordChangedAt,
      };

      vi.mocked(mockUserRepo.findById!).mockResolvedValue(mockUser as any);

      const tokens = await authService.refreshTokens('dummy-token');
      expect(tokens.accessToken).toBe('new-access');
      expect(tokens.refreshToken).toBe('new-refresh');
    });
  });
});
