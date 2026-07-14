import { test, expect } from "@playwright/test"

test.describe("Login flow", () => {
  test("login page loads with email and password fields", async ({ page }) => {
    await page.goto("/auth/login")
    await expect(page.locator("h1")).toContainText("Command Center")
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/auth/login")
    await page.fill('input[type="email"]', "wrong@example.com")
    await page.fill('input[type="password"]', "badpassword")
    await page.click('button[type="submit"]')
    await expect(page.locator("text=Invalid")).toBeVisible({ timeout: 10000 })
  })

  test("switches to magic link mode", async ({ page }) => {
    await page.goto("/auth/login")
    await page.click("text=Prefiero usar un enlace mágico")
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toContainText("Enviar enlace mágico")
  })
})
