import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('redirects to login when not authenticated', async ({ page }) => {
    await page.waitForURL('**/login')
    expect(page.url()).toContain('/login')
  })

  test('login page has required fields', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button:has-text("Sign in")')).toBeVisible()
  })

  test('signup link navigates to signup page', async ({ page }) => {
    await page.goto('/login')
    await page.click('text=Sign up')
    await expect(page).toHaveURL(/.*signup/)
  })

  test('signup page has required fields', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.locator('input[placeholder="Email address"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button:has-text("Create account")')).toBeVisible()
  })
})
