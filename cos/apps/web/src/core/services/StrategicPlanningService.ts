export interface StrategicObjective {
  id: string
  title: string
  category: "growth" | "efficiency" | "risk" | "innovation"
  currentValue: number
  targetValue: number
  deadline: Date
}

export interface StrategicPlan {
  objectives: StrategicObjective[]
  progress: number
  timeline: { phase: string; objectives: string[]; dueDate: Date }[]
  gaps: { objective: string; gap: number; recommendedAction: string }[]
}

export class StrategicPlanningService {
  analyzePlan(objectives: StrategicObjective[]): StrategicPlan {
    const now = new Date()
    const progress = objectives.length > 0
      ? Math.round(objectives.reduce((sum, o) => {
          const ratio = o.targetValue > 0 ? o.currentValue / o.targetValue : 0
          return sum + Math.min(1, ratio)
        }, 0) / objectives.length * 100)
      : 0

    const gaps = objectives
      .filter((o) => o.currentValue < o.targetValue)
      .map((o) => ({
        objective: o.title,
        gap: o.targetValue - o.currentValue,
        recommendedAction: `Implementar plan de acción para cerrar brecha de ${o.targetValue - o.currentValue} en ${o.category}`,
      }))

    const timeline = [
      { phase: "Corto Plazo (0-3 meses)", objectives: objectives.filter((o) => {
        const months = (o.deadline.getTime() - now.getTime()) / (30 * 24 * 60 * 60 * 1000)
        return months <= 3
      }).map((o) => o.title), dueDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) },
      { phase: "Mediano Plazo (3-12 meses)", objectives: objectives.filter((o) => {
        const months = (o.deadline.getTime() - now.getTime()) / (30 * 24 * 60 * 60 * 1000)
        return months > 3 && months <= 12
      }).map((o) => o.title), dueDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) },
    ]

    return { objectives, progress, timeline, gaps }
  }
}

export const strategicPlanningService = new StrategicPlanningService()
