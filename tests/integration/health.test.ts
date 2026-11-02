import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '#src/app.js';
import { Database } from '#config/database.config.js';


describe('Health & App Integration Tests', () => {
  const app = createApp();

  it('GET /healthz should return 200 with service status', async () => {
    vi.spyOn(Database, 'isHealthy').mockResolvedValue(true);

    const res = await request(app).get('/healthz');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('GET /livez should return 200 with alive status', async () => {
    const res = await request(app).get('/livez');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('alive');
  });

  it('GET /api/v1/invalid-route should return 404 with standard error envelope', async () => {
    const res = await request(app).get('/api/v1/invalid-route');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('NOT_FOUND');
  });

  it('GET /openapi.yaml should serve raw OpenAPI specification with 200', async () => {
    const res = await request(app).get('/openapi.yaml');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/yaml');
    expect(res.text).toContain('openapi: 3.0.0');
  });

  it('GET /docs should serve Stoplight Elements HTML portal with 200', async () => {
    const res = await request(app).get('/docs');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('<elements-api');
    expect(res.text).toContain('@stoplight/elements');
  });

  it('GET /api-docs should serve Stoplight Elements HTML portal with 200', async () => {
    const res = await request(app).get('/api-docs');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('<elements-api');
    expect(res.text).toContain('@stoplight/elements');
  });
});
