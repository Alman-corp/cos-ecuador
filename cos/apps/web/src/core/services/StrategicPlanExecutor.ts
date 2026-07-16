import { prisma } from "@/lib/db/prisma"
import type { StrategicObjective } from "./StrategicPlanningService"

export interface ExecutablePlan {
  projectId: string
  objectives: ExecutableObjective[]
  totalTasks: number
  totalKeyResults: number
}

export interface ExecutableObjective {
  objectiveId: string
  title: string
  keyResults: { id: string; title: string; targetValue: number; unit: string }[]
  tasks: { id: string; title: string; assigneeId?: string; dueDate?: string }[]
}

export async function executeStrategicPlan(
  companyId: string,
  clientId: string,
  userId: string,
  objectives: StrategicObjective[],
): Promise<ExecutablePlan> {
  const project = await prisma.project.create({
    data: {
      companyId,
      clientId,
      name: "Plan Estratégico Integral",
      description: `Plan generado automáticamente con ${objectives.length} objetivos estratégicos`,
      projectType: "strategic_planning",
      methodology: "okr",
      startDate: new Date(),
      createdBy: userId,
    },
  })

  const executable: ExecutableObjective[] = []

  for (const obj of objectives) {
    const clientObjective = await prisma.clientObjective.create({
      data: {
        clientId,
        title: obj.title,
        description: `Categoría: ${obj.category}. Valor actual: ${obj.currentValue}, Meta: ${obj.targetValue}`,
        objectiveType: obj.category,
        startDate: new Date(),
        targetDate: obj.deadline ? new Date(obj.deadline) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        progress: obj.currentValue && obj.targetValue
          ? Math.min(Math.round((obj.currentValue / obj.targetValue) * 100), 100)
          : 0,
        createdBy: userId,
      },
    })

    const kr = await prisma.keyResult.create({
      data: {
        objectiveId: clientObjective.id,
        title: `Alcanzar ${obj.targetValue} (actual: ${obj.currentValue})`,
        startValue: obj.currentValue || 0,
        currentValue: obj.currentValue || 0,
        targetValue: obj.targetValue || 100,
        unit: "%",
      },
    })

    // Create action tasks based on category
    const actionTasks = getTasksForObjective(obj, clientObjective.id, project.id, userId, companyId)
    const createdTasks = []
    for (const task of actionTasks) {
      const t = await prisma.task.create({ data: task })
      createdTasks.push({ id: t.id, title: t.title, assigneeId: t.assignedTo || undefined, dueDate: t.dueDate?.toISOString() })
    }

    executable.push({
      objectiveId: clientObjective.id,
      title: obj.title,
      keyResults: [{ id: kr.id, title: kr.title, targetValue: obj.targetValue || 100, unit: "%" }],
      tasks: createdTasks,
    })
  }

  return {
    projectId: project.id,
    objectives: executable,
    totalTasks: executable.reduce((s, o) => s + o.tasks.length, 0),
    totalKeyResults: executable.reduce((s, o) => s + o.keyResults.length, 0),
  }
}

function getTasksForObjective(
  obj: StrategicObjective,
  _objectiveId: string,
  projectId: string,
  _userId: string,
  _companyId: string,
) {
  const tasks: { projectId: string; title: string; status: string; priority: string; dueDate: Date }[] = []
  const now = new Date()
  const due30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const due60 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
  const due90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

  if (obj.category === "growth") {
    tasks.push({ projectId, title: "Análisis de mercado y competencia", status: "todo", priority: "high", dueDate: due30 })
    tasks.push({ projectId, title: "Definir estrategia de crecimiento", status: "todo", priority: "high", dueDate: due30 })
    tasks.push({ projectId, title: "Implementar plan de captación de clientes", status: "todo", priority: "medium", dueDate: due60 })
  } else if (obj.category === "efficiency") {
    tasks.push({ projectId, title: "Auditoría de procesos operativos", status: "todo", priority: "high", dueDate: due30 })
    tasks.push({ projectId, title: "Identificar cuellos de botella", status: "todo", priority: "high", dueDate: due30 })
    tasks.push({ projectId, title: "Implementar mejoras de eficiencia", status: "todo", priority: "medium", dueDate: due90 })
  } else if (obj.category === "risk") {
    tasks.push({ projectId, title: "Evaluar riesgos financieros actuales", status: "todo", priority: "high", dueDate: due30 })
    tasks.push({ projectId, title: "Desarrollar plan de mitigación", status: "todo", priority: "high", dueDate: due60 })
    tasks.push({ projectId, title: "Implementar controles y monitoreo", status: "todo", priority: "medium", dueDate: due90 })
  } else if (obj.category === "innovation") {
    tasks.push({ projectId, title: "Investigación de nuevas tecnologías", status: "todo", priority: "medium", dueDate: due60 })
    tasks.push({ projectId, title: "Evaluar ROI de innovación", status: "todo", priority: "medium", dueDate: due60 })
    tasks.push({ projectId, title: "Implementar piloto", status: "todo", priority: "low", dueDate: due90 })
  } else {
    tasks.push({ projectId, title: `Ejecutar objetivo: ${obj.title}`, status: "todo", priority: "medium", dueDate: due60 })
  }

  return tasks
}
