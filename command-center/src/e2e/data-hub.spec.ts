import { test, expect } from "@playwright/test"
import path from "path"

test.describe("Data Hub", () => {
  test("data hub page loads with upload area", async ({ page }) => {
    await page.goto("/data-hub")
    await expect(page.locator("h1")).toContainText("Data Hub")
    await expect(page.locator("text=Importa datos financieros")).toBeVisible()
  })

  test("shows error for unsupported file format", async ({ page }) => {
    await page.goto("/data-hub")
    const fileChooserPromise = page.waitForEvent("filechooser")
    await page.click("text=Arrastra tu archivo")
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles({
      name: "test.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("a,b,c\n1,2,3"),
    })
    await expect(page.locator("text=no soportado")).toBeVisible({ timeout: 5000 })
  })

  test("accepts CSV file and shows preview", async ({ page }) => {
    await page.goto("/data-hub")
    const fileChooserPromise = page.waitForEvent("filechooser")
    await page.click("text=Arrastra tu archivo")
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles({
      name: "data.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("date,amount,description\n2025-01-01,1000,Venta mensual\n2025-01-02,500,Pago proveedor"),
    })
    await expect(page.locator("text=Mapeo de Columnas")).toBeVisible({ timeout: 5000 })
    await expect(page.locator("text=Vista Previa")).toBeVisible()
  })
})
