import { test, expect } from '@playwright/test';

// Behaviour safety net for the App.jsx decomposition. These open the leaf
// modals/overlays that are candidates for extraction and assert their content
// renders. NOT covered (require an authenticated session): Study Vault drawer,
// Study History drawer, Sign-Out confirmation. The search overlay is also not
// asserted here.

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // App shell mounted: the header icon buttons are present.
  await expect(page.getByRole('button', { name: 'Open search' })).toBeVisible();
});

test('app boots with header controls', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Open account menu' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Toggle navigation menu' })).toBeVisible();
});

test('account menu opens the auth modal', async ({ page }) => {
  await page.getByRole('button', { name: 'Open account menu' }).click();
  await expect(page.getByText('Your Vault is locked.')).toBeVisible();

  await page.getByRole('button', { name: 'Sign in' }).first().click();
  await expect(page.getByRole('heading', { name: 'Study Vault' })).toBeVisible();
  await expect(page.locator('input[placeholder="name@example.com"]')).toBeVisible();
  await expect(page.locator('input[placeholder="Password (min 6 chars)"]')).toBeVisible();

  // Toggling sign-up mode exercises the isSignUp / setIsSignUp prop wiring.
  await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible();
  await page.getByRole('button', { name: "Don't have an account? Create one" }).click();
  await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
});

test('nav menu opens the Updates Log modal', async ({ page }) => {
  await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
  await page.getByRole('button', { name: 'Updates Log' }).click();
  // Static header + a version entry from APP_UPDATES confirm the modal + import.
  await expect(page.getByText('The Sunday Drop')).toBeVisible();
  await expect(page.getByText('v5.2.0')).toBeVisible();
});

test('nav menu opens the Help & Guide modal', async ({ page }) => {
  await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
  await page.getByRole('button', { name: 'Help & Guide' }).click();
  await expect(page.getByText('How to Use Al-Kisa')).toBeVisible();
});

// --- Search overlay (local interactions only; no live search backend) ---

test('search overlay: toggling mode swaps the input placeholder', async ({ page }) => {
  await page.getByRole('button', { name: 'Open search' }).click();
  await expect(page.getByPlaceholder('Search Quran, Duas, Series, or References...')).toBeVisible();
  await page.getByRole('button', { name: 'Knowledge Graph' }).click();
  await expect(page.getByPlaceholder('Deep search the Hadith corpus...')).toBeVisible();
});

test('search overlay: a quick link navigates to the Quran reader', async ({ page }) => {
  await page.getByRole('button', { name: 'Open search' }).click();
  await page.getByRole('button', { name: 'Quran verse 5:55' }).click();
  await expect(page).toHaveURL(/\/quran/);
});

test('search overlay: glossary shortcut navigates to the glossary', async ({ page }) => {
  await page.getByRole('button', { name: 'Open search' }).click();
  await page.getByRole('button', { name: 'Browse the Theological Glossary' }).click();
  await expect(page).toHaveURL(/\/glossary/);
});
