import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '#src/app.js';
import { TokenService } from '#shared/services/token.service.js';
import { userRepository } from '#modules/user/user.repository.js';


describe('User Module Integration Tests', () => {
  const app = createApp();

  const authTokens = TokenService.generateTokens({
    userId: '64e72f3bb6dc7b001f2a8c12',
    email: 'user@example.com',
  });

  it('GET /api/v1/users should return 401 Unauthorized without token', async () => {
    const res = await request(app).get('/api/v1/users');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/users should allow authenticated user to list users', async () => {
    vi.spyOn(userRepository, 'findPaginated').mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false },
    });

    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${authTokens.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/v1/users/:id should reject invalid ObjectId hex string with 422', async () => {
    const res = await request(app)
      .get('/api/v1/users/not-a-valid-object-id')
      .set('Authorization', `Bearer ${authTokens.accessToken}`);

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });

  it('GET /api/v1/users/:id should return 404 when user is not found in database', async () => {
    vi.spyOn(userRepository, 'findById').mockResolvedValue(null);

    const res = await request(app)
      .get('/api/v1/users/64e72f3bb6dc7b001f2a8c99')
      .set('Authorization', `Bearer ${authTokens.accessToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('NOT_FOUND');
  });
});
