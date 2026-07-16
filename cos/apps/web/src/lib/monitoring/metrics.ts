export interface BusinessMetrics {
  reportsGenerated: number
  companiesAnalyzed: number
  risksDetected: number
  avgHealthScore: number
  errorsLastHour: number
  avgResponseTimeMs: number
  activeUsers: number
  uptimeHours: number
}

let metrics: BusinessMetrics = {
  reportsGenerated: 0,
  companiesAnalyzed: 0,
  risksDetected: 0,
  avgHealthScore: 0,
  errorsLastHour: 0,
  avgResponseTimeMs: 0,
  activeUsers: 0,
  uptimeHours: 0,
}

const startTime = Date.now()

export function getMetrics(): BusinessMetrics {
  return { ...metrics, uptimeHours: Math.round((Date.now() - startTime) / 3600000) }
}

export function incrementReportsGenerated(count = 1) { metrics.reportsGenerated += count }
export function incrementCompaniesAnalyzed(count = 1) { metrics.companiesAnalyzed += count }
export function incrementRisksDetected(count = 1) { metrics.risksDetected += count }
export function setAvgHealthScore(score: number) { metrics.avgHealthScore = score }
export function incrementErrors() { metrics.errorsLastHour += 1 }
export function setAvgResponseTime(ms: number) { metrics.avgResponseTimeMs = ms }
export function setActiveUsers(count: number) { metrics.activeUsers = count }
