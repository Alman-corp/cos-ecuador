import { test, expect } from "@playwright/test"

test.describe("Dashboard page", () => {
  test("dashboard loads with title and KPIs", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page.locator("h1")).toContainText("Tesla")
    await expect(page.locator("h1")).toContainText("Dashboard Financiero")
  })

  test("dashboard has KPI cards", async ({ page }) => {
    await page.goto("/dashboard")
    const kpiCards = page.locator("text=Revenue (TTM),EBITDA,Free Cash Flow,Cash & Investments")
    await expect(kpiCards.first()).toBeVisible()
  })

  test("dashboard navigation sidebar is present", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page.locator("nav")).toBeVisible()
  })
})
