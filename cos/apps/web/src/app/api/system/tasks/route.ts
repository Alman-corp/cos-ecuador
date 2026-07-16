import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { withTenant } from "@/lib/db/with-tenant"
import { getSessionFromRequest } from "@/lib/auth/token"
import { validateBody } from "@/lib/validate"
import { UpdateTaskSchema } from "@/lib/api-schemas"

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")
  const status = searchParams.get("status")

  const tasks = await withTenant(session.companyId, async (tx) => {
    const where: any = {}
    if (projectId) where.projectId = projectId
    if (status) where.status = status

    return tx.task.findMany({
      where,
      include: { project: { select: { name: true, clientId: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    })
  })

  return NextResponse.json(tasks)
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await req.json()
  const { data, errors } = validateBody(UpdateTaskSchema, body)
  if (errors) return NextResponse.json({ error: errors }, { status: 400 })

  const task = await withTenant(session.companyId, (tx) =>
    tx.task.findFirst({ where: { id: data.taskId } })
  )
  if (!task) return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 })

  const update: any = {}
  if (data.status) update.status = data.status
  if (data.assignedTo) update.assignedTo = data.assignedTo
  if (data.completedAt) update.completedAt = new Date(data.completedAt)

  const updated = await withTenant(session.companyId, (tx) =>
    tx.task.update({ where: { id: data.taskId }, data: update })
  )
  return NextResponse.json(updated)
}
