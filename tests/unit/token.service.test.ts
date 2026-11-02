import { describe, it, expect } from 'vitest';
import { TokenService } from '#shared/services/token.service.js';
import { UnauthorizedError } from '#errors/index.js';


describe('TokenService (Unit Tests)', () => {
  const mockPayload = {
    userId: '64e72f3bb6dc7b001f2a8c12',
    email: 'admin@example.com',
  };

  it('should generate valid access and refresh token pair', () => {
    const tokens = TokenService.generateTokens(mockPayload);

    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
    expect(typeof tokens.accessToken).toBe('string');
    expect(typeof tokens.refreshToken).toBe('string');
  });

  it('should verify and decode valid access token', () => {
    const tokens = TokenService.generateTokens(mockPayload);
    const decoded = TokenService.verifyAccessToken(tokens.accessToken);

    expect(decoded.userId).toBe(mockPayload.userId);
    expect(decoded.email).toBe(mockPayload.email);
  });

  it('should verify and decode valid refresh token', () => {
    const tokens = TokenService.generateTokens(mockPayload);
    const decoded = TokenService.verifyRefreshToken(tokens.refreshToken);

    expect(decoded.userId).toBe(mockPayload.userId);
    expect(decoded.email).toBe(mockPayload.email);
  });

  it('should throw UnauthorizedError when verifying corrupted token', () => {
    expect(() => TokenService.verifyAccessToken('invalid.token.string')).toThrow(UnauthorizedError);
  });
});
