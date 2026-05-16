import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function resetDemo(page) {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
}

async function expectNoA11yViolations(page) {
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
}

test('core demo workflows render and navigate without accessibility violations', async ({ page }) => {
  await resetDemo(page);

  await expect(page.getByRole('heading', { name: /Blue Badge/i })).toBeVisible();
  await expect(page.getByText(/Demo only: authentication/i)).toBeVisible();
  await expectNoA11yViolations(page);

  await page.getByRole('button', { name: /Officer/i }).click();
  await expect(page.getByText(/Detected badge ID lookup/i)).toBeVisible();
  await page.getByRole('button', { name: /Verify/i }).click();
  await expect(page.getByText(/Verification result/i)).toBeVisible();
  await expectNoA11yViolations(page);

  await page.getByRole('button', { name: /Admin/i }).click();
  await page.getByRole('button', { name: 'BB-CAM-550912 Grace Patel', exact: true }).click();
  await expect(page.getByRole('tab', { name: /Cases/i })).toBeFocused();
  await expect(page.getByText(/Cases for Grace Patel/i)).toBeVisible();
  await page.getByRole('tab', { name: /Overview/i }).click();
  await page.getByRole('tab', { name: /Overview/i }).press('ArrowRight');
  await expect(page.getByRole('tab', { name: /Cases/i })).toBeFocused();
  await expect(page.getByRole('heading', { name: /Case management/i })).toBeVisible();
  await expectNoA11yViolations(page);
});

test('holder can end and start a locked session', async ({ page }) => {
  await resetDemo(page);

  await page.getByRole('button', { name: /End session/i }).click();
  await expect(page.getByText(/Session ended/i)).toBeVisible();

  await page.getByLabel(/Parking location/i).fill('Marylebone High Street W1U');
  await page.getByRole('button', { name: /Start session/i }).click();

  await expect(page.getByText(/Session started and locked/i)).toBeVisible();
  await expect(page.getByText(/Marylebone High Street W1U/i)).toBeVisible();
});

test('officer can scan a mismatch and open an enforcement case', async ({ page }) => {
  await resetDemo(page);

  await page.getByRole('button', { name: /Officer/i }).click();
  await page.getByLabel(/Observed vehicle/i).fill('WR64 BAD');
  await page.getByRole('button', { name: /Verify/i }).click();

  await expect(page.getByText(/Suspicious|Invalid/i)).toBeVisible();
  await expect(page.getByText('Badge used with unregistered vehicle: +45 points')).toBeVisible();

  await page.getByRole('button', { name: /Open case/i }).click();
  await expect(page.getByText(/Enforcement case CASE-/i)).toBeVisible();
});

test('officer gets a specific reason for an untrusted QR token', async ({ page }) => {
  await resetDemo(page);

  await page.getByRole('button', { name: /Officer/i }).click();
  await page.getByLabel(/QR code badge ID or vehicle registration/i).fill('bluebadge://verify/not-a-real-token');
  await expect(page.getByText(/Detected signed QR verification token/i)).toBeVisible();
  await page.getByRole('button', { name: /Verify/i }).click();

  await expect(page.getByText(/QR token could not be trusted/i)).toBeVisible();
});

test('admin risk rule validation rejects inverted thresholds', async ({ page }) => {
  await resetDemo(page);

  await page.getByRole('button', { name: /Admin/i }).click();
  await page.getByRole('tab', { name: /Risk rules/i }).click();
  await page.getByLabel(/Review threshold/i).fill('95');

  await expect(page.getByText(/Risk rule not updated/i)).toBeVisible();
});
