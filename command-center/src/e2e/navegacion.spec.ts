import { test, expect } from "@playwright/test"

test.describe("Navegación y 404", () => {
  test("navegación sidebar: dashboard → data-hub → vuelta a dashboard", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page.locator("h1")).toContainText("Dashboard")

    const nav = page.locator("nav")
    await expect(nav).toBeVisible()

    const dataHubLink = nav.locator("a", { hasText: "Data Hub" })
    await expect(dataHubLink).toBeVisible()
    await dataHubLink.click()
    await page.waitForURL("/data-hub")
    await expect(page.locator("h1")).toContainText("Data Hub")

    const dashboardLink = nav.locator("a", { hasText: "Dashboard" })
    await expect(dashboardLink).toBeVisible()
    await dashboardLink.click()
    await page.waitForURL("/dashboard")
    await expect(page.locator("h1")).toContainText("Dashboard")
  })

  test("error 404 muestra UI amigable al visitar ruta inexistente", async ({ page }) => {
    await page.goto("/ruta-inexistente")

    await expect(page.locator("h1")).toContainText("Página no encontrada")
    await expect(page.locator("text=La página que buscas no existe o ha sido movida.")).toBeVisible()

    const volverLink = page.locator("a", { hasText: "Volver al Dashboard" })
    await expect(volverLink).toBeVisible()

    await volverLink.click()
    await page.waitForURL("/dashboard")
  })
})
