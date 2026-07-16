import http from "k6/http"
import { check, sleep } from "k6"
import { Rate, Trend } from "k6/metrics"

const errorRate = new Rate("errors")
const reportTime = new Trend("report_generation_time")
const healthCheckTime = new Trend("health_check_time")

export const options = {
  stages: [
    { duration: "30s", target: 10 },
    { duration: "1m", target: 25 },
    { duration: "30s", target: 50 },
    { duration: "1m", target: 50 },
    { duration: "30s", target: 25 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<5000"],
    errors: ["rate<0.1"],
  },
}

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000"

export default function () {
  // 1. Health check
  const healthRes = http.get(`${BASE_URL}/api/health`)
  healthCheckTime.add(healthRes.timings.duration)
  check(healthRes, {
    "health status is 200": (r) => r.status === 200,
    "health body has status ok": (r) => r.json("status") === "ok",
  })
  errorRate.add(healthRes.status !== 200)

  // 2. Get companies list
  const companiesRes = http.get(`${BASE_URL}/api/due-diligence/companies`)
  check(companiesRes, {
    "companies list is 200": (r) => r.status === 200,
    "companies list has data": (r) => r.json("companies")?.length > 0,
  })
  errorRate.add(companiesRes.status !== 200)

  // 3. Run analysis for each company (50% of virtual users)
  if (__VU % 2 === 0) {
    const companyIds = ["corp-nac-fin", "ind-molinera", "constr-pacifico", "agroexport", "tech-solutions"]
    const companyId = companyIds[__VU % companyIds.length]

    const analyzeRes = http.post(`${BASE_URL}/api/due-diligence/analyze`, JSON.stringify({ companyId }), {
      headers: { "Content-Type": "application/json" },
    })
    reportTime.add(analyzeRes.timings.duration)
    check(analyzeRes, {
      "analysis is 200": (r) => r.status === 200,
      "analysis has report": (r) => r.json("report") !== null,
    })
    errorRate.add(analyzeRes.status !== 200)
  }

  // 4. Get metrics
  const metricsRes = http.get(`${BASE_URL}/api/metrics`)
  check(metricsRes, { "metrics is 200": (r) => r.status === 200 })
  errorRate.add(metricsRes.status !== 200)

  sleep(1)
}
