import { resend, FROM_EMAIL } from './client'

export interface DeliveryParams {
  clientEmail: string
  clientName: string
  companyName: string
  consultantEmail: string
  consultantName: string
  consultantFirm: string
  reportUrl: string
  portalUrl: string
  jobId: string
  creditsRemaining: number
  tempPassword?: string
  expiresAt?: Date
}

export async function sendReportDelivery(params: DeliveryParams) {
  const tempPassword = params.tempPassword || generateTempPassword()
  const expiresAt = params.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const clientHtml = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">
    <div style="background:#2563eb;padding:32px;text-align:center;border-radius:8px 8px 0 0">
      <h1 style="color:white;margin:0;font-size:24px">Informe de Due Diligence Financiero</h1>
    </div>
    <div style="padding:32px">
      <p style="font-size:16px;font-weight:bold">Estimado/a ${params.clientName},</p>
      <p style="font-size:15px;line-height:24px;color:#334155">
        Nos complace entregarle el <strong>Informe de Due Diligence Financiero</strong>
        de <strong>${params.companyName}</strong>, preparado por ${params.consultantName} de ${params.consultantFirm}.
      </p>
      <div style="text-align:center;margin:24px 0">
        <a href="${params.reportUrl}" style="background:#2563eb;color:white;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block">
          Descargar Informe PDF
        </a>
      </div>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0">
        <p style="font-weight:bold;margin-bottom:12px">Acceso al Portal</p>
        <p style="font-size:14px;color:#475569"><strong>URL:</strong> <a href="${params.portalUrl}" style="color:#2563eb">${params.portalUrl}</a></p>
        <p style="font-size:14px;color:#475569"><strong>Contrase\u00f1a temporal:</strong> ${tempPassword}</p>
        <p style="font-size:13px;color:#64748b;font-style:italic">Se le solicitar\u00e1 cambiar la contrase\u00f1a en el primer acceso.</p>
      </div>
      <p style="font-size:13px;color:#64748b">Este enlace expira el ${expiresAt.toLocaleDateString('es-ES')}. El portal permanecer\u00e1 accesible durante 30 d\u00edas adicionales.</p>
      <p style="font-size:13px;color:#64748b">Por favor, no comparta este email ni las credenciales de acceso. El informe es confidencial.</p>
    </div>
    <div style="background:#f8fafc;padding:24px;text-align:center;border-top:1px solid #e2e8f0;font-size:14px;color:#475569">
      <p> Generado por COS Due Diligence</p>
    </div>
  </div>`

  const consultantHtml = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">
    <h1 style="font-size:24px;color:#1e293b">Due Diligence Completado</h1>
    <p style="font-size:15px;line-height:24px;color:#334155">
      Hola ${params.consultantName},<br/><br/>
      El Due Diligence de <strong>${params.companyName}</strong> ha sido completado y el informe ha sido enviado a <strong>${params.clientEmail}</strong>.
    </p>
    <div style="text-align:center;margin:32px 0">
      <a href="${params.portalUrl}" style="background:#10b981;color:white;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block">
        Ver Detalles
      </a>
    </div>
    <div style="background:#f0fdf4;padding:16px;border-radius:8px;border:1px solid #bbf7d0">
      <p style="font-size:14px;color:#166534;margin:0">Creditos restantes este mes: <strong>${params.creditsRemaining}</strong></p>
    </div>
  </div>`

  const clientResult = await resend.emails.send({
    from: `${params.consultantFirm} <${FROM_EMAIL}>`,
    to: params.clientEmail,
    replyTo: params.consultantEmail,
    subject: `Informe de Due Diligence: ${params.companyName}`,
    html: clientHtml,
  })

  const consultantResult = await resend.emails.send({
    from: `COS Due Diligence <${FROM_EMAIL}>`,
    to: params.consultantEmail,
    subject: `DD Completado: ${params.companyName} | ${params.creditsRemaining} creditos`,
    html: consultantHtml,
  })

  return {
    clientEmailId: clientResult.id,
    consultantEmailId: consultantResult.id,
    tempPassword,
    expiresAt,
  }
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars[Math.floor(Math.random() * chars.length)]
  }
  return password
}
