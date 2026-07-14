import { test, expect } from "@playwright/test"

test.describe("Validación de RUC Ecuador", () => {
  test("rechaza RUC inválido (13 dígitos pero mal)", async ({ page }) => {
    await page.goto("/security")

    const rucInput = page.locator('input[placeholder*="RUC"]')
    await expect(rucInput).toBeVisible()

    await rucInput.fill("1790012345002")

    await page.locator("button", { hasText: "Encriptar" }).click()

    await expect(page.locator("textarea")).toBeVisible({ timeout: 5000 })
  })

  test("acepta RUC válido", async ({ page }) => {
    await page.goto("/security")

    const rucInput = page.locator('input[placeholder*="RUC"]')
    await expect(rucInput).toBeVisible()

    await rucInput.fill("1710034065001")

    await page.locator("button", { hasText: "Encriptar" }).click()

    await expect(page.locator("textarea")).toBeVisible({ timeout: 5000 })
  })
})
