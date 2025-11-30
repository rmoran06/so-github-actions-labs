const request = require('supertest');
const app = require('../src/server');

describe('SO CI/CD App - Endpoints', () => {
  test('GET / debe responder 200 y contener el título', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('SO - CI/CD App');
  });

  test('GET /env debe responder con JSON y contener nodeEnv y appVersion', async () => {
    const res = await request(app).get('/env');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('nodeEnv');
    expect(res.body).toHaveProperty('appVersion');
  });

  test('GET /health debe responder con status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});
