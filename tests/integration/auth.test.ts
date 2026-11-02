import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '#src/app.js';


describe('Auth Validation & Middleware Integration Tests', () => {
  const app = createApp();

  it('POST /api/v1/auth/register should reject weak password with 422', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'John',
      email: 'john@example.com',
      password: 'weak',
      confirmPassword: 'weak',
    });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
    expect(res.body.errors).toBeDefined();
  });

  it('POST /api/v1/auth/register should reject missing firstName or name with 422', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'john@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });

  it('POST /api/v1/auth/register should reject password mismatch with 422', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password123!',
      confirmPassword: 'Password456!',
    });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });

  it('POST /api/v1/auth/login should reject invalid email format with 422', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'not-an-email',
      password: 'anypassword',
    });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });

  it('GET /api/v1/users should reject request without Authorization header with 401', async () => {
    const res = await request(app).get('/api/v1/users');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('MISSING_BEARER_TOKEN');
  });

  it('POST /api/v1/auth/forgot-password should reject invalid email with 422', async () => {
    const res = await request(app).post('/api/v1/auth/forgot-password').send({
      email: 'not-valid-email',
    });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });

  it('POST /api/v1/auth/reset-password should reject password mismatch with 422', async () => {
    const res = await request(app).post('/api/v1/auth/reset-password').send({
      token: 'some-token',
      password: 'Password123!',
      confirmPassword: 'MismatchPassword123!',
    });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });

  it('POST /api/v1/auth/verify-email should reject missing token with 422', async () => {
    const res = await request(app).post('/api/v1/auth/verify-email').send({});

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });

  it('POST /api/v1/auth/resend-verification should reject invalid email with 422', async () => {
    const res = await request(app).post('/api/v1/auth/resend-verification').send({
      email: 'not-an-email',
    });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });
});
