import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    events: [
      { name: "invoice.authorized", description: "Factura electrónica autorizada por SRI" },
      { name: "invoice.rejected", description: "Factura rechazada por SRI" },
      { name: "obligation.due", description: "Obligación tributaria próxima a vencer" },
      { name: "obligation.overdue", description: "Obligación vencida" },
      { name: "document.uploaded", description: "Nuevo documento subido" },
      { name: "client.created", description: "Nuevo cliente registrado" },
      { name: "project.completed", description: "Proyecto marcado como completado" },
      { name: "kpi.alert", description: "KPI cruzó umbral configurado" },
      { name: "workflow.completed", description: "Workflow automatizado completado" },
      { name: "user.invited", description: "Nuevo usuario invitado al tenant" },
    ],
  })
}
