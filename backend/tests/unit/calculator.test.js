const {
  estimateBankNet,
  calculateBuckets,
  calculateWealthProjection,
  calculate,
} = require('../../src/calculator');

describe('estimateBankNet', () => {
  test('10000 gross -> 6800 net', () => {
    expect(estimateBankNet(10000)).toBe(6800);
  });

  test('gross 0 -> 0', () => {
    expect(estimateBankNet(0)).toBe(0);
  });

  test('rounds to 2 decimal places', () => {
    expect(estimateBankNet(9999)).toBe(parseFloat((9999 * 0.68).toFixed(2)));
  });
});

describe('calculateBuckets', () => {
  test('buckets sum to 100% of bankNet', () => {
    const buckets = calculateBuckets(6800);

    const sum =
      buckets.fixedCosts +
      buckets.savingsGoals +
      buckets.activeInvestments +
      buckets.guiltFreeSpending;

    expect(sum).toBeCloseTo(6800, 1);
  });

  test('fixedCosts is 52.5%', () => {
    expect(calculateBuckets(10000).fixedCosts).toBe(5250);
  });

  test('savingsGoals is 10%', () => {
    expect(calculateBuckets(10000).savingsGoals).toBe(1000);
  });

  test('activeInvestments is 10%', () => {
    expect(calculateBuckets(10000).activeInvestments).toBe(1000);
  });

  test('guiltFreeSpending is 27.5%', () => {
    expect(calculateBuckets(10000).guiltFreeSpending).toBe(2750);
  });
});

describe('calculateWealthProjection', () => {
  test('returns array with correct length', () => {
    expect(calculateWealthProjection(500, 10)).toHaveLength(10);
    expect(calculateWealthProjection(500, 15)).toHaveLength(15);
  });

  test('values grow over time', () => {
    const projection = calculateWealthProjection(1000, 5);

    for (let i = 1; i < projection.length; i++) {
      expect(projection[i]).toBeGreaterThan(projection[i - 1]);
    }
  });

  test('zero investment returns zeros', () => {
    const projection = calculateWealthProjection(0, 5);

    projection.forEach((value) => {
      expect(value).toBe(0);
    });
  });
});

describe('calculate', () => {
  test('returns correct result shape', () => {
    const result = calculate(10000);

    expect(result).toHaveProperty('grossSalary');
    expect(result).toHaveProperty('bankNet');
    expect(result).toHaveProperty('fixedCosts');
    expect(result).toHaveProperty('savingsGoals');
    expect(result).toHaveProperty('activeInvestments');
    expect(result).toHaveProperty('guiltFreeSpending');
    expect(result).toHaveProperty('wealthProjection');

    expect(Array.isArray(result.wealthProjection)).toBe(true);
  });

  test('auto-calculates bankNet from grossSalary', () => {
    expect(calculate(10000).bankNet).toBe(6800);
  });

  test('accepts explicit bankNet override', () => {
    expect(calculate(10000, 5000).bankNet).toBe(5000);
  });

  test('defaults to 15 years', () => {
    expect(calculate(10000).wealthProjection).toHaveLength(15);
  });

  test('clamps years above 15 to 15', () => {
    expect(calculate(10000, null, 20).wealthProjection).toHaveLength(15);
  });

  test('clamps years below 1 to 1', () => {
    expect(calculate(10000, null, 0).wealthProjection).toHaveLength(1);
  });
});