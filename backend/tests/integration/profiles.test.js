const request = require('supertest');

jest.mock('../../src/db', () => ({
  query: jest.fn(),
}));

const pool = require('../../src/db');
const app = require('../../src/app');

beforeEach(() => {
  pool.query.mockReset();
});

describe('POST /profiles', () => {
  test('saves a valid profile and returns 201', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          profileName: 'My Financial Plan',
          years: 15,
          result: {
            grossSalary: 10000,
            bankNet: 6800,
          },
          createdAt: '2026-06-13T10:00:00.000Z',
        },
      ],
    });

    const response = await request(app)
      .post('/profiles')
      .send({
        profileName: 'My Financial Plan',
        grossSalary: 10000,
        years: 15,
      });

    expect(response.status).toBe(201);
    expect(response.body.id).toBe(1);
    expect(response.body.profileName).toBe('My Financial Plan');
  });

  test('returns 400 when profileName is missing', async () => {
    const response = await request(app)
      .post('/profiles')
      .send({
        grossSalary: 10000,
        years: 15,
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/profileName/);
  });

  test('returns 400 for invalid grossSalary', async () => {
    const response = await request(app)
      .post('/profiles')
      .send({
        profileName: 'Invalid Plan',
        grossSalary: -100,
        years: 15,
      });

    expect(response.status).toBe(400);
  });
});

describe('GET /profiles', () => {
  test('returns all saved profiles', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: 2,
          profileName: 'Second Plan',
          years: 10,
          result: {},
        },
        {
          id: 1,
          profileName: 'First Plan',
          years: 15,
          result: {},
        },
      ],
    });

    const response = await request(app).get('/profiles');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].profileName).toBe('Second Plan');
  });
});

describe('GET /profiles/:id', () => {
  test('returns one profile by ID', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          profileName: 'My Plan',
          years: 15,
          result: {
            grossSalary: 10000,
            bankNet: 6800,
          },
        },
      ],
    });

    const response = await request(app).get('/profiles/1');

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(1);
    expect(response.body.profileName).toBe('My Plan');
  });

  test('returns 404 when profile does not exist', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [],
    });

    const response = await request(app).get('/profiles/999');

    expect(response.status).toBe(404);
    expect(response.body.error).toMatch(/not found/i);
  });

  test('returns 400 for invalid profile ID', async () => {
    const response = await request(app).get('/profiles/abc');

    expect(response.status).toBe(400);
  });
});