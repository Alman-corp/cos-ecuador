"use client"

import { useEffect } from "react"
import { recordMetric, log } from "@/lib/otel"

export interface WebVitalMetric {
  name: string
  value: number
  rating: "good" | "needs-improvement" | "poor"
  timestamp: number
}

const vitals: WebVitalMetric[] = []

export function getWebVitals(): WebVitalMetric[] {
  return [...vitals]
}

function getRating(name: string, value: number): WebVitalMetric["rating"] {
  switch (name) {
    case "LCP": return value <= 2500 ? "good" : value <= 4000 ? "needs-improvement" : "poor"
    case "FID": return value <= 100 ? "good" : value <= 300 ? "needs-improvement" : "poor"
    case "CLS": return value <= 0.1 ? "good" : value <= 0.25 ? "needs-improvement" : "poor"
    case "INP": return value <= 200 ? "good" : value <= 500 ? "needs-improvement" : "poor"
    case "TTFB": return value <= 800 ? "good" : value <= 1800 ? "needs-improvement" : "poor"
    default: return "needs-improvement"
  }
}

export function trackVital(name: string, value: number): void {
  const rating = getRating(name, value)
  vitals.push({ name, value, rating, timestamp: Date.now() })
  recordMetric(`web_vital_${name}`, value, "ms", { rating })
  log("info", `Web Vital: ${name}=${value} (${rating})`)
}

export function useRUM(pageName: string): void {
  useEffect(() => {
    recordMetric("page_view", 1, "count", { page: pageName })
    log("info", `Page viewed: ${pageName}`)

    if ("performance" in window) {
      const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming
      if (navEntry) {
        trackVital("TTFB", navEntry.responseStart - navEntry.requestStart)
      }
    }

    if ("webVitals" in navigator === false) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "largest-contentful-paint") {
            trackVital("LCP", entry.startTime)
          }
          if (entry.entryType === "first-input") {
            const fiEntry = entry as PerformanceEventTiming
            trackVital("FID", fiEntry.processingStart - fiEntry.startTime)
          }
          if (entry.entryType === "layout-shift") {
            const lsEntry = entry as unknown as { hadRecentInput: boolean; value: number }
            if (!lsEntry.hadRecentInput) {
              const current = vitals.find((v) => v.name === "CLS")
              const newValue = (current?.value || 0) + lsEntry.value
              if (current) current.value = newValue
              else trackVital("CLS", newValue)
            }
          }
        }
      })
      observer.observe({ type: "largest-contentful-paint", buffered: true })
      observer.observe({ type: "first-input", buffered: true })
      observer.observe({ type: "layout-shift", buffered: true })
      return () => observer.disconnect()
    }
  }, [pageName])
}
