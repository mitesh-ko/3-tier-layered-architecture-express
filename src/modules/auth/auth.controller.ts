import { Request, Response } from 'express';
import { authService, AuthService } from './auth.service.js';
import { ApiResponse } from '#shared/utils/api-response.js';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  ResendVerificationDto,
} from './auth.schema.js';
import { HttpStatus } from '#constants/http-status.js';

export class AuthController {
  private authService: AuthService;

  constructor(service = authService) {
    this.authService = service;
  }

  /**
   * POST /api/v1/auth/register
   * Creates a new user account and dispatches an asynchronous email verification link.
   */
  public register = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.register(req.body as RegisterDto);
    ApiResponse.success(
      res,
      'User registered successfully. A verification link has been sent to your email address.',
      result,
      HttpStatus.CREATED
    );
  };

  /**
   * POST /api/v1/auth/login
   * Authenticates user credentials and issues JWT access and refresh token pair.
   */
  public login = async (req: Request, res: Response): Promise<void> => {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip;
    const result = await this.authService.login(req.body as LoginDto, clientIp);
    ApiResponse.success(res, 'Logged in successfully', result, HttpStatus.OK);
  };

  /**
   * POST /api/v1/auth/verify-email
   * Validates one-time verification token and marks account email as verified.
   */
  public verifyEmail = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.verifyEmail(req.body as VerifyEmailDto);
    ApiResponse.success(res, result.message, result, HttpStatus.OK);
  };

  /**
   * POST /api/v1/auth/resend-verification
   * Dispatches a fresh email verification link with anti-user enumeration protection.
   */
  public resendVerification = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.resendVerificationEmail(
      req.body as ResendVerificationDto
    );
    ApiResponse.success(res, result.message, result, HttpStatus.OK);
  };

  /**
   * POST /api/v1/auth/forgot-password
   * Generates secure reset token and sends password reset link with anti-enumeration protection.
   */
  public forgotPassword = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.forgotPassword(req.body as ForgotPasswordDto);
    ApiResponse.success(res, result.message, result, HttpStatus.OK);
  };

  /**
   * POST /api/v1/auth/reset-password
   * Resets user password via verified one-time token and invalidates active sessions.
   */
  public resetPassword = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.resetPassword(req.body as ResetPasswordDto);
    ApiResponse.success(res, result.message, result, HttpStatus.OK);
  };

  /**
   * POST /api/v1/auth/refresh
   * Rotates JWT tokens using a valid refresh token; checks for session revocation.
   */
  public refreshToken = async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body as RefreshTokenDto;
    const tokens = await this.authService.refreshTokens(refreshToken);
    ApiResponse.success(res, 'Tokens refreshed successfully', tokens, HttpStatus.OK);
  };

  /**
   * GET /api/v1/auth/me
   * Retrieves profile payload of the currently authenticated user from request context.
   */
  public getMe = async (req: Request, res: Response): Promise<void> => {
    ApiResponse.success(res, 'Current user retrieved', req.user);
  };
}

export const authController = new AuthController();
