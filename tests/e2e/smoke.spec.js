import { expect, test } from '@playwright/test';

test('core demo workflows render and navigate', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  await expect(page.getByRole('heading', { name: /Blue Badge/i })).toBeVisible();
  await page.getByRole('button', { name: /Officer/i }).click();
  await page.getByRole('button', { name: /Verify/i }).click();
  await expect(page.getByText(/Verification result/i)).toBeVisible();

  await page.getByRole('button', { name: /Admin/i }).click();
  await page.getByRole('tab', { name: /Cases/i }).click();
  await expect(page.getByRole('heading', { name: /Case management/i })).toBeVisible();
});
