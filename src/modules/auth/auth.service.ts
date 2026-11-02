import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { userRepository, UserRepository } from '#modules/user/user.repository.js';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  ResendVerificationDto,
} from './auth.schema.js';
import { ConflictError, UnauthorizedError, BadRequestError } from '#errors/index.js';
import { TokenService, TokenPair } from '#shared/services/token.service.js';
import { env } from '#config/env.config.js';
import { JobDispatcher } from '#shared/jobs/index.js';
import { DateUtil, addHours, addMinutes, isBefore, fromUnixTime } from '#shared/utils/date.util.js';

export interface AuthResponse {
  user: Record<string, unknown>;
  tokens: TokenPair;
}

export interface AuthMessageResponse {
  message: string;
  isEmailVerified?: boolean;
}

export class AuthService {
  private userRepo: UserRepository;

  constructor(userRepo = userRepository) {
    this.userRepo = userRepo;
  }

  /**
   * Hashes raw one-time tokens using SHA-256 for secure database storage.
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Register a new user, generate email verification token, and dispatch verification email.
   */
  public async register(dto: RegisterDto): Promise<AuthResponse> {
    const exists = await this.userRepo.existsByEmail(dto.email);
    if (exists) {
      throw new ConflictError('An account with this email address already exists');
    }

    if (dto.phone) {
      const phoneExists = await this.userRepo.findByPhone(dto.phone);
      if (phoneExists) {
        throw new ConflictError('An account with this phone number already exists');
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, env.BCRYPT_SALT_ROUNDS);

    // Generate cryptographic 32-byte email verification token
    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = this.hashToken(rawVerificationToken);
    const verificationExpires = addHours(DateUtil.nowUTC(), 24); // 24 hours via date-fns

    const firstName = dto.firstName || (dto.name ? dto.name.trim().split(/\s+/)[0] : '');
    const lastName =
      dto.lastName !== undefined
        ? dto.lastName
        : dto.name
        ? dto.name.trim().split(/\s+/).slice(1).join(' ')
        : '';

    const user = await this.userRepo.create({
      firstName,
      lastName,
      email: dto.email,
      phone: dto.phone || null,
      phoneVerifiedAt: null,
      password: hashedPassword,
      status: 'active',
      authProvider: 'local',
      emailVerifiedAt: null,
      emailVerificationToken: hashedVerificationToken,
      emailVerificationExpires: verificationExpires,
      profile: {},
      addresses: [],
      failedLoginAttempts: 0,
    });

    const tokens = TokenService.generateTokens({
      userId: user._id.toString(),
      email: user.email,
    });

    const displayName = user.fullName || user.firstName || 'Valued User';

    // Dispatch background verification email with verification link
    const verificationUrl = `${env.CLIENT_URL}/verify-email?token=${rawVerificationToken}`;
    void JobDispatcher.dispatch('email:send-verification', {
      to: user.email,
      name: displayName,
      verificationUrl,
    });

    // Dispatch welcome email (non-blocking)
    void JobDispatcher.dispatch('email:send-welcome', {
      to: user.email,
      name: displayName,
      userId: user._id.toString(),
    });

    return {
      user: user.toSafeObject(),
      tokens,
    };
  }

  /**
   * Verify user's email using the one-time token from verification link.
   */
  public async verifyEmail(dto: VerifyEmailDto): Promise<AuthMessageResponse> {
    const hashedToken = this.hashToken(dto.token);
    const user = await this.userRepo.findByEmailVerificationToken(hashedToken);

    if (!user) {
      throw new BadRequestError(
        'Invalid or expired email verification link. Please request a new one.',
        'INVALID_VERIFICATION_TOKEN'
      );
    }

    user.emailVerifiedAt = DateUtil.nowUTC();
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    if (typeof user.save === 'function') {
      await user.save();
    }

    return {
      message: 'Email address verified successfully. Your account is now fully active.',
      isEmailVerified: true,
    };
  }

  /**
   * Resend email verification link with anti-enumeration protection.
   */
  public async resendVerificationEmail(dto: ResendVerificationDto): Promise<AuthMessageResponse> {
    const genericResponse: AuthMessageResponse = {
      message:
        'If an unverified account exists with that email address, a verification link has been sent.',
    };

    const user = await this.userRepo.findByEmail(dto.email);
    if (!user || user.isEmailVerified) {
      return genericResponse;
    }

    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = this.hashToken(rawVerificationToken);
    user.emailVerificationExpires = addHours(DateUtil.nowUTC(), 24);
    await user.save();

    const verificationUrl = `${env.CLIENT_URL}/verify-email?token=${rawVerificationToken}`;
    const displayName = user.fullName || user.firstName || 'Valued User';
    void JobDispatcher.dispatch('email:send-verification', {
      to: user.email,
      name: displayName,
      verificationUrl,
    });

    return genericResponse;
  }

  /**
   * Authenticate user with email and password, enforcing lockout protection and audit tracking.
   */
  public async login(dto: LoginDto, clientIp?: string): Promise<AuthResponse> {
    const user = await this.userRepo.findByEmailWithPassword(dto.email);

    if (!user || !user.password) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.deletedAt) {
      throw new UnauthorizedError('This account has been deleted.', 'ACCOUNT_DELETED');
    }

    // Check temporary account lockout
    if (user.lockUntil && isBefore(DateUtil.nowUTC(), user.lockUntil)) {
      throw new UnauthorizedError(
        'Account is temporarily locked due to excessive failed login attempts. Please try again later.',
        'ACCOUNT_LOCKED'
      );
    }

    if (user.status !== 'active') {
      if (user.status === 'suspended') {
        throw new UnauthorizedError('This account has been suspended. Please contact customer support.', 'ACCOUNT_SUSPENDED');
      }
      if (user.status === 'banned') {
        throw new UnauthorizedError('This account has been permanently banned.', 'ACCOUNT_BANNED');
      }
      if (user.status === 'pending_approval') {
        throw new UnauthorizedError('This account is awaiting administrative approval.', 'ACCOUNT_PENDING');
      }
      throw new UnauthorizedError('This account has been deactivated. Please contact support.', 'ACCOUNT_INACTIVE');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = addMinutes(DateUtil.nowUTC(), 15); // 15-minute lockout via date-fns
      }
      if (typeof user.save === 'function') {
        await user.save();
      }
      throw new UnauthorizedError('Invalid email or password');
    }

    // Reset failed login attempts and record login audit metadata
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    user.lastLoginAt = DateUtil.nowUTC();
    if (clientIp) {
      user.lastLoginIp = clientIp;
    }
    if (typeof user.save === 'function') {
      await user.save();
    }

    const tokens = TokenService.generateTokens({
      userId: user._id.toString(),
      email: user.email,
    });

    return {
      user: user.toSafeObject(),
      tokens,
    };
  }

  /**
   * Send password reset link to user's email with anti-enumeration security.
   */
  public async forgotPassword(dto: ForgotPasswordDto): Promise<AuthMessageResponse> {
    const genericResponse: AuthMessageResponse = {
      message:
        'If an account exists with that email address, a password reset link has been dispatched to your inbox.',
    };

    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) {
      return genericResponse;
    }

    const rawResetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = this.hashToken(rawResetToken);
    user.passwordResetExpires = addHours(DateUtil.nowUTC(), 1); // 1 hour validity via date-fns
    await user.save();

    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${rawResetToken}`;
    const displayName = user.fullName || user.firstName || 'Valued User';
    void JobDispatcher.dispatch('email:send-password-reset', {
      to: user.email,
      name: displayName,
      resetUrl,
    });

    return genericResponse;
  }

  /**
   * Reset user password using verified reset token and invalidate previous sessions.
   */
  public async resetPassword(dto: ResetPasswordDto): Promise<AuthMessageResponse> {
    const hashedToken = this.hashToken(dto.token);
    const user = await this.userRepo.findByPasswordResetToken(hashedToken);

    if (!user) {
      throw new BadRequestError(
        'Invalid or expired password reset link. Please submit a new password reset request.',
        'INVALID_RESET_TOKEN'
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, env.BCRYPT_SALT_ROUNDS);

    user.password = hashedPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.passwordChangedAt = DateUtil.nowUTC();
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    return {
      message: 'Password has been reset successfully. You may now log in with your new password.',
    };
  }

  /**
   * Refresh expired access token using valid refresh token with rotation.
   */
  public async refreshTokens(refreshTokenString: string): Promise<TokenPair> {
    const payload = TokenService.verifyRefreshToken(refreshTokenString);
    const user = await this.userRepo.findById(payload.userId);

    if (!user || user.status !== 'active' || user.deletedAt) {
      throw new UnauthorizedError('User account not found or deactivated');
    }

    // Invalidate if password changed after refresh token was created (via date-fns isBefore)
    if (user.passwordChangedAt && payload.iat) {
      const tokenIssuedAt = fromUnixTime(payload.iat);
      if (isBefore(tokenIssuedAt, user.passwordChangedAt)) {
        throw new UnauthorizedError(
          'Password was recently changed. Please log in again.',
          'PASSWORD_CHANGED'
        );
      }
    }

    // Token rotation
    return TokenService.generateTokens({
      userId: user._id.toString(),
      email: user.email,
    });
  }
}

export const authService = new AuthService();
