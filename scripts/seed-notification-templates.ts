import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TABLE = "notification_templates"

interface TemplateSeed {
  template_type: string
  channel: string
  name: string
  subject: string | null
  body: string
  variables: { key: string; label: string; type: string; required: boolean; defaultValue?: unknown }[]
  is_system: boolean
}

const TEMPLATES: TemplateSeed[] = [
  {
    template_type: "obligation_due_soon",
    channel: "email",
    name: "Obligación por vencer",
    subject: "⏰ Recordatorio: {{obligationName}} vence el {{dueDate formatDate 'short'}}",
    body: `<h2>Estimado/a {{userName}},</h2>
<p>Le recordamos que la siguiente obligación tributaria está próxima a vencer:</p>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse">
  <tr><td><strong>Obligación</strong></td><td>{{obligationName}}</td></tr>
  <tr><td><strong>Fecha de vencimiento</strong></td><td>{{dueDate}}</td></tr>
  <tr><td><strong>Período</strong></td><td>{{period}}</td></tr>
  <tr><td><strong>Monto estimado</strong></td><td>{{estimatedAmount formatCurrency}}</td></tr>
</table>
<p>Por favor, prepare la declaración con anticipación para evitar recargos.</p>
<p>Atentamente,<br>Sistema COS Ecuador</p>`,
    variables: [
      { key: "userName", label: "Nombre del usuario", type: "string", required: true },
      { key: "obligationName", label: "Nombre de la obligación", type: "string", required: true },
      { key: "dueDate", label: "Fecha de vencimiento", type: "date", required: true },
      { key: "period", label: "Período fiscal", type: "string", required: true },
      { key: "estimatedAmount", label: "Monto estimado", type: "number", required: false, defaultValue: 0 },
    ],
    is_system: true,
  },
  {
    template_type: "obligation_due_soon",
    channel: "whatsapp",
    name: "Obligación por vencer (WhatsApp)",
    subject: null,
    body: `⏰ *Recordatorio Tributario*

Estimado/a {{userName}},

La obligación *{{obligationName}}* vence el *{{dueDate}}*.

Período: {{period}}
Monto estimado: ${{estimatedAmount}}

Prepare su declaración con anticipación.

-COS Ecuador`,
    variables: [
      { key: "userName", label: "Nombre del usuario", type: "string", required: true },
      { key: "obligationName", label: "Nombre de la obligación", type: "string", required: true },
      { key: "dueDate", label: "Fecha de vencimiento", type: "date", required: true },
      { key: "period", label: "Período fiscal", type: "string", required: true },
      { key: "estimatedAmount", label: "Monto estimado", type: "number", required: false, defaultValue: 0 },
    ],
    is_system: true,
  },
  {
    template_type: "obligation_due_soon",
    channel: "in_app",
    name: "Obligación por vencer (In-App)",
    subject: "⏰ Recordatorio: {{obligationName}}",
    body: "La obligación **{{obligationName}}** del período {{period}} vence el **{{dueDate}}**. Monto estimado: ${{estimatedAmount}}.",
    variables: [
      { key: "obligationName", label: "Nombre de la obligación", type: "string", required: true },
      { key: "dueDate", label: "Fecha de vencimiento", type: "date", required: true },
      { key: "period", label: "Período fiscal", type: "string", required: true },
      { key: "estimatedAmount", label: "Monto estimado", type: "number", required: false, defaultValue: 0 },
    ],
    is_system: true,
  },
  {
    template_type: "obligation_overdue",
    channel: "email",
    name: "Obligación vencida",
    subject: "⚠️ {{obligationName}} — VENCIDA desde el {{dueDate formatDate 'short'}}",
    body: `<h2>Estimado/a {{userName}},</h2>
<p style="color:red"><strong>La siguiente obligación tributaria se encuentra VENCIDA:</strong></p>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse">
  <tr><td><strong>Obligación</strong></td><td>{{obligationName}}</td></tr>
  <tr><td><strong>Vencimiento</strong></td><td>{{dueDate}}</td></tr>
  <tr><td><strong>Días de retraso</strong></td><td>{{daysOverdue}}</td></tr>
  <tr><td><strong>Multa estimada</strong></td><td>{{estimatedPenalty formatCurrency}}</td></tr>
</table>
<p>Le recomendamos regularizar su situación a la brevedad para evitar mayores recargos e intereses.</p>
<p>Atentamente,<br>Sistema COS Ecuador</p>`,
    variables: [
      { key: "userName", label: "Nombre del usuario", type: "string", required: true },
      { key: "obligationName", label: "Nombre de la obligación", type: "string", required: true },
      { key: "dueDate", label: "Fecha de vencimiento", type: "date", required: true },
      { key: "daysOverdue", label: "Días de retraso", type: "number", required: true },
      { key: "estimatedPenalty", label: "Multa estimada", type: "number", required: false, defaultValue: 0 },
    ],
    is_system: true,
  },
  {
    template_type: "obligation_overdue",
    channel: "in_app",
    name: "Obligación vencida (In-App)",
    subject: "⚠️ {{obligationName}} — VENCIDA",
    body: "La obligación **{{obligationName}}** venció el **{{dueDate}}** ({{daysOverdue}} días de retraso). Multa estimada: ${{estimatedPenalty}}.",
    variables: [
      { key: "obligationName", label: "Nombre de la obligación", type: "string", required: true },
      { key: "dueDate", label: "Fecha de vencimiento", type: "date", required: true },
      { key: "daysOverdue", label: "Días de retraso", type: "number", required: true },
      { key: "estimatedPenalty", label: "Multa estimada", type: "number", required: false, defaultValue: 0 },
    ],
    is_system: true,
  },
  {
    template_type: "payment_confirmed",
    channel: "in_app",
    name: "Pago confirmado",
    subject: "✅ Pago confirmado: {{obligationName}}",
    body: "El pago de **{{obligationName}}** por **{{amount formatCurrency}}** ha sido confirmado el **{{paymentDate}}**.",
    variables: [
      { key: "obligationName", label: "Nombre de la obligación", type: "string", required: true },
      { key: "amount", label: "Monto pagado", type: "number", required: true },
      { key: "paymentDate", label: "Fecha de pago", type: "date", required: true },
    ],
    is_system: true,
  },
  {
    template_type: "payment_failed",
    channel: "email",
    name: "Pago fallido",
    subject: "❌ Error en el pago de {{obligationName}}",
    body: `<h2>Estimado/a {{userName}},</h2>
<p>El pago de <strong>{{obligationName}}</strong> por <strong>{{amount formatCurrency}}</strong> no pudo ser procesado.</p>
<p><strong>Motivo:</strong> {{failureReason}}</p>
<p>Por favor, intente nuevamente desde la plataforma o contacte a su banco.</p>
<p>Atentamente,<br>Sistema COS Ecuador</p>`,
    variables: [
      { key: "userName", label: "Nombre del usuario", type: "string", required: true },
      { key: "obligationName", label: "Nombre de la obligación", type: "string", required: true },
      { key: "amount", label: "Monto", type: "number", required: true },
      { key: "failureReason", label: "Motivo del fallo", type: "string", required: true },
    ],
    is_system: true,
  },
  {
    template_type: "sri_invoice_received",
    channel: "in_app",
    name: "Factura SRI recibida",
    subject: "📄 Factura {{invoiceNumber}} recibida del SRI",
    body: "La factura **{{invoiceNumber}}** por **{{amount formatCurrency}}** ha sido recibida y autorizada por el SRI. Emisor: **{{issuerName}}**.",
    variables: [
      { key: "invoiceNumber", label: "Número de factura", type: "string", required: true },
      { key: "amount", label: "Monto", type: "number", required: true },
      { key: "issuerName", label: "Nombre del emisor", type: "string", required: true },
    ],
    is_system: true,
  },
  {
    template_type: "sri_invoice_rejected",
    channel: "email",
    name: "Factura SRI rechazada",
    subject: "❌ Factura {{invoiceNumber}} RECHAZADA por el SRI",
    body: `<h2>Estimado/a {{userName}},</h2>
<p>La factura <strong>{{invoiceNumber}}</strong> ha sido <strong style="color:red">RECHAZADA</strong> por el SRI.</p>
<p><strong>Motivo:</strong> {{rejectionReason}}</p>
<p><strong>Fecha:</strong> {{rejectionDate}}</p>
<p>Por favor, corrija los errores y vuelva a enviar.</p>
<p>Atentamente,<br>Sistema COS Ecuador</p>`,
    variables: [
      { key: "userName", label: "Nombre del usuario", type: "string", required: true },
      { key: "invoiceNumber", label: "Número de factura", type: "string", required: true },
      { key: "rejectionReason", label: "Motivo del rechazo", type: "string", required: true },
      { key: "rejectionDate", label: "Fecha de rechazo", type: "date", required: true },
    ],
    is_system: true,
  },
  {
    template_type: "audit_triggered",
    channel: "slack",
    name: "Auditoría activada",
    subject: "🔍 Auditoría activada: {{companyName}}",
    body: `*Auditoría activada para {{companyName}}*

*Tipo:* {{auditType}}
*Período:* {{auditPeriod}}
*Riesgo:* {{riskLevel}}
*Fecha:* {{triggeredDate}}

Asignada a: {{assignedTo}}
<{{auditUrl}}|Ver detalles de la auditoría>`,
    variables: [
      { key: "companyName", label: "Nombre de la compañía", type: "string", required: true },
      { key: "auditType", label: "Tipo de auditoría", type: "string", required: true },
      { key: "auditPeriod", label: "Período de auditoría", type: "string", required: true },
      { key: "riskLevel", label: "Nivel de riesgo", type: "string", required: true },
      { key: "triggeredDate", label: "Fecha de activación", type: "date", required: true },
      { key: "assignedTo", label: "Asignado a", type: "string", required: true },
      { key: "auditUrl", label: "URL de la auditoría", type: "string", required: false },
    ],
    is_system: true,
  },
  {
    template_type: "document_expiring",
    channel: "email",
    name: "Documento por expirar",
    subject: "📋 {{documentName}} expira pronto",
    body: `<h2>Estimado/a {{userName}},</h2>
<p>El documento <strong>{{documentName}}</strong> de <strong>{{companyName}}</strong> expirará el <strong>{{expirationDate}}</strong>.</p>
<p>Tipo: {{documentType}}<br>
Días restantes: {{daysRemaining}}</p>
<p>Por favor, gestione la renovación a la brevedad.</p>
<p>Atentamente,<br>Sistema COS Ecuador</p>`,
    variables: [
      { key: "userName", label: "Nombre del usuario", type: "string", required: true },
      { key: "documentName", label: "Nombre del documento", type: "string", required: true },
      { key: "companyName", label: "Nombre de la compañía", type: "string", required: true },
      { key: "documentType", label: "Tipo de documento", type: "string", required: true },
      { key: "expirationDate", label: "Fecha de expiración", type: "date", required: true },
      { key: "daysRemaining", label: "Días restantes", type: "number", required: true },
    ],
    is_system: true,
  },
  {
    template_type: "system_alert",
    channel: "slack",
    name: "Alerta del sistema",
    subject: "🚨 Alerta del sistema: {{alertTitle}}",
    body: `*🚨 Alerta del Sistema*

*Título:* {{alertTitle}}
*Severidad:* {{severity}}
*Servicio:* {{serviceName}}
*Timestamp:* {{timestamp}}

{{description}}`,
    variables: [
      { key: "alertTitle", label: "Título de la alerta", type: "string", required: true },
      { key: "severity", label: "Severidad", type: "string", required: true },
      { key: "serviceName", label: "Nombre del servicio", type: "string", required: true },
      { key: "timestamp", label: "Timestamp", type: "string", required: true },
      { key: "description", label: "Descripción", type: "string", required: true },
    ],
    is_system: true,
  },
]

async function seed() {
  console.log("Seeding notification templates...")

  for (const t of TEMPLATES) {
    const { error } = await supabase.from(TABLE).upsert(
      {
        company_id: null,
        template_type: t.template_type,
        channel: t.channel,
        name: t.name,
        subject: t.subject,
        body: t.body,
        variables: t.variables,
        is_system: t.is_system,
        version: 1,
      },
      { onConflict: "company_id,template_type,channel" }
    )

    if (error) {
      console.error(`  Failed to seed "${t.name}": ${error.message}`)
    } else {
      console.log(`  Seeded "${t.name}"`)
    }
  }

  console.log("Notification templates seeded successfully!")
}

seed().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
