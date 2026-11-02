import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '#src/app.js';
import { TokenService } from '#shared/services/token.service.js';
import { JobDispatcher } from '#shared/jobs/index.js';

describe('Job Status API Integration Tests', () => {
  const app = createApp();

  const userTokens = TokenService.generateTokens({
    userId: '64e72f3bb6dc7b001f2a8c12',
    email: 'user@example.com',
  });

  it('GET /api/v1/jobs/:id should return 401 Unauthorized without token', async () => {
    const res = await request(app).get('/api/v1/jobs/test-job-id');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/jobs/:id should return 404 when job does not exist', async () => {
    const res = await request(app)
      .get('/api/v1/jobs/non-existent-job-id-999')
      .set('Authorization', `Bearer ${userTokens.accessToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('NOT_FOUND');
  });

  it('GET /api/v1/jobs/:id should return job status when job exists', async () => {
    const jobId = await JobDispatcher.dispatch('email:send-welcome', {
      to: 'customer@example.com',
      name: 'Customer',
      userId: '64e72f3bb6dc7b001f2a8c12',
    });

    const res = await request(app)
      .get(`/api/v1/jobs/${jobId}`)
      .set('Authorization', `Bearer ${userTokens.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(jobId);
    expect(res.body.data.name).toBe('email:send-welcome');
  });
});
