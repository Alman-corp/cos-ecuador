import { test, expect } from "@playwright/test"

test("landing page loads and shows title", async ({ page }) => {
  await page.goto("/")
  await expect(page.locator("h1")).toBeVisible()
  await expect(page).toHaveTitle(/Command Center|COS|Consulting/)
})

test("login page has form", async ({ page }) => {
  await page.goto("/auth/login")
  await expect(page.locator('input[type="email"]')).toBeVisible()
  await expect(page.locator('button[type="submit"]')).toBeVisible()
})

test("navigation sidebar is present on dashboard", async ({ page }) => {
  await page.goto("/dashboard")
  await expect(page.locator("nav")).toBeVisible()
})
