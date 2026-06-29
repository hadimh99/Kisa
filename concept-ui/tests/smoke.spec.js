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
  await expect(page.getByRole('button', { name: 'Sign in' }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Toggle navigation menu' })).toBeVisible();
});

test('header Sign in opens the auth modal', async ({ page }) => {
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
  await expect(page.getByPlaceholder('Search the platform…')).toBeVisible();
  await page.getByRole('button', { name: 'Knowledge Graph' }).click();
  await expect(page.getByPlaceholder('Deep search hadith…')).toBeVisible();
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

// --- Search results view (backend mocked so the extracted SearchResults can be
// verified without the live HF/Pinecone API) ---

test('search results render the returned clusters', async ({ page }) => {
  await page.route('**/api/explore', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        total_results: 2,
        clusters: [
          { theme_label: 'Relating to patience', items: [{ id: 't1', english_text: 'Test narration one.', arabic_text: '', book: 'al-Kafi', volume: '1', sub_book: 'x', chapter: 'y', hadith_number: '1', similarity_score: 1, vector: [] }] },
          { theme_label: 'Relating to gratitude', items: [{ id: 't2', english_text: 'Test narration two.', arabic_text: '', book: 'al-Kafi', volume: '1', sub_book: 'x', chapter: 'y', hadith_number: '2', similarity_score: 1, vector: [] }] },
        ],
      }),
    })
  );

  await page.getByRole('button', { name: 'Open search' }).click();
  await page.getByRole('button', { name: 'Knowledge Graph' }).click();
  const input = page.getByPlaceholder('Deep search hadith…');
  await input.fill('patience');
  await input.press('Enter');

  await expect(page).toHaveURL(/\/search/);
  await expect(page.getByText('Relating to patience')).toBeVisible();
  await expect(page.getByText('Relating to gratitude')).toBeVisible();

  // Clicking a result cluster opens the cluster-detail modal with its narrations.
  await page.getByText('Relating to patience').click();
  await expect(page.getByText('Length:')).toBeVisible();
  await expect(page.getByText('Test narration one.')).toBeVisible();
});
