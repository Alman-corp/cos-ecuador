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
  {
    template_type: "DAILY_DIGEST",
    channel: "email",
    name: "Resumen diario COS",
    subject: "📋 Resumen COS del día — {{summary.totalNotifications}} eventos",
    body: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#0f172a;color:#e2e8f0;padding:24px;">
  <div style="max-width:640px;margin:0 auto;background:#1e293b;border-radius:12px;padding:32px;">
    <h1 style="color:#fff;margin:0 0 8px;">☀️ Buenos días, {{userName}}</h1>
    <p style="color:#94a3b8;margin:0 0 32px;">Esto es lo que pasó en tu consultora {{period}}</p>
    
    {{#if summary.upcomingObligations}}
    <div style="background:#7f1d1d;border-left:4px solid #ef4444;padding:16px;border-radius:8px;margin-bottom:24px;">
      <h3 style="color:#fca5a5;margin:0 0 8px;">🚨 {{summary.upcomingObligations}} obligaciones SRI próximas</h3>
      {{#each obligations}}
      <div style="margin-top:8px;">
        <strong>{{fiscal_calendar.obligation_type}}</strong> — Vence {{due_date}}
      </div>
      {{/each}}
    </div>
    {{/if}}
    
    {{#if summary.invoicesIssued}}
    <div style="background:#064e3b;border-left:4px solid #10b981;padding:16px;border-radius:8px;margin-bottom:24px;">
      <h3 style="color:#6ee7b7;margin:0 0 8px;">✅ {{summary.invoicesIssued}} facturas autorizadas</h3>
      <p style="margin:4px 0;color:#d1fae5;">Total facturado: <strong>${{summary.totalAmount}}</strong></p>
    </div>
    {{/if}}
    
    {{#if summary.totalNotifications}}
    <h3 style="color:#fff;">🔔 Otras notificaciones</h3>
    {{#each notifications}}
    <div style="padding:12px;border-bottom:1px solid #334155;">
      <strong>{{title}}</strong>
      <p style="color:#94a3b8;margin:4px 0;font-size:14px;">{{body}}</p>
    </div>
    {{/each}}
    {{/if}}
    
    <div style="text-align:center;margin-top:32px;padding-top:24px;border-top:1px solid #334155;">
      <a href="{{portalUrl}}" style="display:inline-block;padding:12px 32px;background:#3b82f6;color:white;text-decoration:none;border-radius:8px;">Ver en COS →</a>
    </div>
  </div>
</body>
</html>`,
    variables: [
      { key: "userName", label: "Nombre del usuario", type: "string", required: true },
      { key: "period", label: "Período (hoy/esta semana)", type: "string", required: true },
      { key: "summary", label: "Resumen con conteos", type: "string", required: true },
      { key: "notifications", label: "Lista de notificaciones", type: "string", required: false },
      { key: "obligations", label: "Lista de obligaciones", type: "string", required: false },
      { key: "invoices", label: "Lista de facturas", type: "string", required: false },
    ],
    is_system: true,
  },
  {
    template_type: "WEEKLY_DIGEST",
    channel: "email",
    name: "Resumen semanal COS",
    subject: "📋 Resumen COS semanal — {{summary.totalNotifications}} eventos",
    body: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#0f172a;color:#e2e8f0;padding:24px;">
  <div style="max-width:640px;margin:0 auto;background:#1e293b;border-radius:12px;padding:32px;">
    <h1 style="color:#fff;margin:0 0 8px;">📊 Resumen Semanal COS</h1>
    <p style="color:#94a3b8;margin:0 0 32px;">{{userName}}, esto pasó {{period}}</p>
    
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:32px;">
      <div style="background:#1e3a5f;padding:16px;border-radius:8px;text-align:center;">
        <div style="font-size:24px;font-weight:bold;color:#60a5fa;">{{summary.totalNotifications}}</div>
        <div style="font-size:12px;color:#94a3b8;">Notificaciones</div>
      </div>
      <div style="background:#5f1e1e;padding:16px;border-radius:8px;text-align:center;">
        <div style="font-size:24px;font-weight:bold;color:#fca5a5;">{{summary.upcomingObligations}}</div>
        <div style="font-size:12px;color:#94a3b8;">Obligaciones</div>
      </div>
      <div style="background:#1e5f2e;padding:16px;border-radius:8px;text-align:center;">
        <div style="font-size:24px;font-weight:bold;color:#6ee7b7;">{{summary.invoicesIssued}}</div>
        <div style="font-size:12px;color:#94a3b8;">Facturas</div>
      </div>
    </div>
    
    {{#if obligations}}
    <h3 style="color:#fff;">📅 Próximas obligaciones</h3>
    {{#each obligations}}
    <div style="padding:8px 0;border-bottom:1px solid #334155;">
      <strong>{{fiscal_calendar.obligation_type}}</strong> — Vence {{due_date}}
    </div>
    {{/each}}
    {{/if}}
    
    <div style="text-align:center;margin-top:32px;padding-top:24px;border-top:1px solid #334155;">
      <a href="{{portalUrl}}" style="display:inline-block;padding:12px 32px;background:#3b82f6;color:white;text-decoration:none;border-radius:8px;">Ir al Dashboard →</a>
    </div>
  </div>
</body>
</html>`,
    variables: [
      { key: "userName", label: "Nombre del usuario", type: "string", required: true },
      { key: "period", label: "Período", type: "string", required: true },
      { key: "summary", label: "Resumen con conteos", type: "string", required: true },
      { key: "notifications", label: "Lista de notificaciones", type: "string", required: false },
      { key: "obligations", label: "Lista de obligaciones", type: "string", required: false },
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
