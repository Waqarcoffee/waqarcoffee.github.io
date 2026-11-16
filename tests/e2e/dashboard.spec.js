import { test, expect } from '@playwright/test';

test('admin can log in and navigate the dashboard', async ({ page }) => {
  await page.goto('/admin');
  await page.getByLabel('البريد الإلكتروني').fill('admin@e2e.invalid');
  await page.getByLabel('كلمة المرور').fill('E2E-Only-Test-Password-2026!');
  await page.getByRole('button', { name: 'دخول آمن' }).click();
  await expect(page.getByText('كل حاجة تحت السيطرة.')).toBeVisible();
  await page.screenshot({ path: 'screenshots/dashboard-overview.png', fullPage: true });
  await page.getByRole('button', { name: 'المنتجات' }).click();
  await expect(page.getByText('المنتجات', { exact: true }).first()).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'screenshots/dashboard-products.png', fullPage: true });
  await page.getByRole('button', { name: 'الإعدادات' }).click();
  await expect(page.getByText('السوشيال واللوجوهات')).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'screenshots/dashboard-settings.png', fullPage: true });
});

test('storefront loads live catalog', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('اختار مزاجك.')).toBeVisible();
  await page.screenshot({ path: 'screenshots/storefront.png', fullPage: false });
});
