import { test, expect } from "@playwright/test"

test("/api/health returns 200 and expected body", async ({ request }) => {
  const response = await request.get("/api/health")
  expect(response.status()).toBe(200)

  const body = await response.json()
  expect(body).toHaveProperty("status", "ok")
  expect(body).toHaveProperty("version")
  expect(body).toHaveProperty("timestamp")
  expect(body).toHaveProperty("uptime")
  expect(body.checks).toHaveProperty("api")
  expect(body.checks).toHaveProperty("auth")
})

test("security headers are present on /api/health", async ({ request }) => {
  const response = await request.get("/api/health")
  const headers = response.headers()

  expect(headers).toHaveProperty("x-content-type-options")
  expect(headers["x-content-type-options"]).toBe("nosniff")
})

test("security headers are present on main page", async ({ page }) => {
  const response = await page.goto("/")
  if (!response) throw new Error("No response")
  const headers = response.headers()

  expect(headers["x-content-type-options"]).toBe("nosniff")
  expect(headers["x-frame-options"]).toBe("DENY")
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin")
})
