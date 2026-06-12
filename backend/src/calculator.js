function estimateBankNet(gross) {
  return parseFloat((gross * 0.68).toFixed(2));
}

function calculateBuckets(bankNet) {
  return {
    fixedCosts: parseFloat((bankNet * 0.525).toFixed(2)),
    savingsGoals: parseFloat((bankNet * 0.10).toFixed(2)),
    activeInvestments: parseFloat((bankNet * 0.10).toFixed(2)),
    guiltFreeSpending: parseFloat((bankNet * 0.275).toFixed(2)),
  };
}

function calculateWealthProjection(monthlyInvestment, years = 15) {
  const monthlyRate = 0.07 / 12;
  const projection = [];

  for (let year = 1; year <= years; year++) {
    const months = year * 12;
    const value =
      monthlyInvestment *
      ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);

    projection.push(Number(value.toFixed(2)));
  }

  return projection;
}

function calculate(grossSalary, bankNet = null, years = 15) {
  const resolvedBankNet = bankNet ?? estimateBankNet(grossSalary);
  const buckets = calculateBuckets(resolvedBankNet);

  const y = Number(years);
  const clampedYears = Number.isFinite(y)
    ? Math.min(Math.max(y, 1), 15)
    : 15;

  const wealthProjection = calculateWealthProjection(
    buckets.activeInvestments,
    clampedYears
  );

  return {
    grossSalary,
    bankNet: resolvedBankNet,
    ...buckets,
    wealthProjection,
  };
}

module.exports = {
  estimateBankNet,
  calculateBuckets,
  calculateWealthProjection,
  calculate,
};
