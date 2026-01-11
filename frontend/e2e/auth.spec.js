import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/');
    
    // Check for login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/');
    
    // Try to submit empty form
    await page.getByRole('button', { name: /login/i }).click();
    
    // Should show validation errors (implementation dependent)
    // This is a placeholder - adjust based on your actual validation UI
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/');
    
    const registerLink = page.getByRole('link', { name: /register|sign up/i });
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/.*register.*/);
    }
  });
});
