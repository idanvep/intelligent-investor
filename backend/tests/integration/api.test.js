const request = require('supertest');

// Mock the database before importing the app.
// This makes the API tests run without Docker/PostgreSQL.
jest.mock('../../src/db', () => ({
  query: jest.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }),
}));

const app = require('../../src/app');

describe('GET /health', () => {
  test('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('connected');
  });
});

describe('POST /calculate', () => {
  test('valid input returns 200 with correct shape', async () => {
    const res = await request(app)
      .post('/calculate')
      .send({ grossSalary: 10000, years: 5 });

    expect(res.status).toBe(200);
    expect(res.body.grossSalary).toBe(10000);
    expect(res.body.bankNet).toBe(6800);
    expect(res.body).toHaveProperty('fixedCosts');
    expect(res.body).toHaveProperty('savingsGoals');
    expect(res.body).toHaveProperty('activeInvestments');
    expect(res.body).toHaveProperty('guiltFreeSpending');
    expect(res.body).toHaveProperty('wealthProjection');
    expect(res.body.wealthProjection).toHaveLength(5);
  });

  test('missing grossSalary returns 400', async () => {
    const res = await request(app)
      .post('/calculate')
      .send({ years: 5 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/grossSalary/);
  });

  test('negative grossSalary returns 400', async () => {
    const res = await request(app)
      .post('/calculate')
      .send({ grossSalary: -500, years: 5 });

    expect(res.status).toBe(400);
  });

  test('years above 15 returns 400', async () => {
    const res = await request(app)
      .post('/calculate')
      .send({ grossSalary: 10000, years: 20 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/years/);
  });

  test('years defaults to 15 when omitted', async () => {
    const res = await request(app)
      .post('/calculate')
      .send({ grossSalary: 10000 });

    expect(res.status).toBe(200);
    expect(res.body.wealthProjection).toHaveLength(15);
  });

  test('explicit bankNet overrides auto calculation', async () => {
    const res = await request(app)
      .post('/calculate')
      .send({ grossSalary: 10000, bankNet: 5000, years: 3 });

    expect(res.status).toBe(200);
    expect(res.body.bankNet).toBe(5000);
    expect(res.body.wealthProjection).toHaveLength(3);
  });
});