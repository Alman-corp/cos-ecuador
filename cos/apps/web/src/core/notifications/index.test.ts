import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { notificationService } from "./index"

describe("NotificationService", () => {
  describe("notify", () => {
    it("sends a notification and returns it", async () => {
      const result = await notificationService.notify(
        "company-1", "in_app", "alert", "high",
        "Test alert", "This is a test",
      )
      expect(result).toHaveProperty("id")
      expect(result.companyId).toBe("company-1")
      expect(result.title).toBe("Test alert")
    })
  })

  describe("getTemplate", () => {
    it("returns a known template", () => {
      const tpl = notificationService.getTemplate("alert_kpi_critical")
      expect(tpl).toBeDefined()
      expect(tpl!.name).toBe("Alerta KPI Crítica")
    })
  })

  describe("getAllTemplates", () => {
    it("returns all templates", () => {
      const templates = notificationService.getAllTemplates()
      expect(templates.length).toBeGreaterThanOrEqual(4)
    })
  })
})
