const { test, expect } = require('@playwright/test');

test('user can calculate, save and reload a financial profile', async ({
  page,
}) => {
  const profileName = `E2E Plan ${Date.now()}`;

  await page.goto('/');

  await expect(
    page.getByRole('heading', {
      name: 'Intelligent Investor',
      exact: true,
    })
  ).toBeVisible();

  // Number 10000 must be accepted without browser step validation errors.
  await page.locator('#salary').fill('10000');
  await page.locator('#bank-net').fill('');
  await page.locator('#years').selectOption('5');

  await page
    .getByRole('button', {
      name: 'Calculate financial plan',
    })
    .click();

  await expect(page.locator('#results-section')).toBeVisible();

  await expect(page.locator('#result-bank-net')).toContainText(
    '6,800'
  );

  await expect(page.locator('#result-investment')).toContainText(
    '680'
  );

  await expect(
    page.locator('#save-profile-button')
  ).toBeEnabled();

  await page.locator('#profile-name').fill(profileName);

  await page
    .getByRole('button', {
      name: 'Save current plan',
    })
    .click();

  await expect(page.locator('#profile-message')).toContainText(
    `Profile "${profileName}" was saved.`
  );

  const savedProfile = page.locator('.saved-profile-button', {
    hasText: profileName,
  });

  await expect(savedProfile).toBeVisible();

  // Reload proves that the profile was stored in PostgreSQL,
  // rather than only being kept in browser memory.
  await page.reload();

  const profileAfterReload = page.locator(
    '.saved-profile-button',
    {
      hasText: profileName,
    }
  );

  await expect(profileAfterReload).toBeVisible();

  await profileAfterReload.click();

  await expect(page.locator('#profile-message')).toContainText(
    `Profile "${profileName}" was loaded.`
  );

  await expect(page.locator('#salary')).toHaveValue('10000');
  await expect(page.locator('#bank-net')).toHaveValue('6800');
  await expect(page.locator('#years')).toHaveValue('5');

  await expect(page.locator('#results-section')).toBeVisible();
});