import { memoryStore } from "@/core/memory"

export async function autoRecord(type: string, title: string, description: string, companyId: string, clientId?: string, importance: "low" | "medium" | "high" | "critical" = "medium") {
  return memoryStore.store({
    companyId,
    clientId,
    type: type as any,
    title,
    description,
    entities: [clientId, companyId].filter((x): x is string => !!x),
    tags: [type],
    metadata: {},
    userId: "system",
    userName: "AutoPilot",
    importance,
  })
}

export async function onRiskDetected(companyId: string, clientId: string, risk: string, level: string) {
  return autoRecord("risk", `Riesgo detectado: ${risk}`, `Nivel: ${level}. Se requiere atención.`, companyId, clientId, "critical")
}

export async function onDecisionMade(companyId: string, clientId: string, decision: string, details: string) {
  return autoRecord("decision", `Decisión: ${decision}`, details, companyId, clientId, "high")
}

export async function onKPIChange(companyId: string, clientId: string, kpi: string, oldValue: number, newValue: number) {
  const direction = newValue > oldValue ? "mejoró" : "empeoró"
  const importance = Math.abs(newValue - oldValue) > 20 ? "high" : "medium"
  return autoRecord("kpi_change", `KPI ${kpi} ${direction}`, `De ${oldValue} a ${newValue}`, companyId, clientId, importance)
}

export async function onMeetingCompleted(companyId: string, clientId: string, meetingTitle: string, summary: string) {
  return autoRecord("meeting", `Reunión: ${meetingTitle}`, summary, companyId, clientId, "medium")
}
