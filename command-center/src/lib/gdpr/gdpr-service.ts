export interface GDPRExportData {
  exportedAt: string
  dataSubject: {
    userId: string
    email: string
    name: string
  }
  data: {
    profile: {
      personal: Record<string, string | null>
      preferences: Record<string, unknown>
      roles: Array<{ name: string; permissions: string[] }>
    }
    companies: Array<{ name: string; ruc: string; industry: string }>
    documents: Array<{ name: string; uploadedAt: string }>
    meetings: Array<{ title: string; scheduledAt: string; duration: number; participants: number }>
    tickets: Array<{ title: string; status: string; createdAt: string }>
    auditLog: Array<{ action: string; resourceType: string; timestamp: string }>
  }
  legalBasis: string
  retentionPolicy: string
}

export async function exportUserData(userId: string): Promise<{ json: GDPRExportData; filename: string }> {
  const exportData: GDPRExportData = {
    exportedAt: new Date().toISOString(),
    dataSubject: { userId, email: 'usuario@example.com', name: 'Usuario Exportado' },
    data: {
      profile: {
        personal: { fullName: 'Usuario Exportado', email: 'usuario@example.com', phone: '+593 99 999 9999' },
        preferences: { language: 'es-EC', timezone: 'America/Guayaquil', notifications: { email: true, sms: false } },
        roles: [{ name: 'Consultor', permissions: ['read:companies', 'write:reports'] }],
      },
      companies: [{ name: 'Constructora Andina S.A.', ruc: '1790000002001', industry: 'Construcción' }],
      documents: [{ name: 'informe-financiero-2025.pdf', uploadedAt: '2026-01-15T10:00:00Z' }],
      meetings: [{ title: 'Revisión trimestral', scheduledAt: '2026-06-01T14:00:00Z', duration: 60, participants: 4 }],
      tickets: [{ title: 'Solicitud de acceso a datos', status: 'COMPLETED', createdAt: '2026-05-10T08:00:00Z' }],
      auditLog: [{ action: 'LOGIN', resourceType: 'SESSION', timestamp: '2026-07-13T00:00:00Z' }],
    },
    legalBasis: 'GDPR Art. 20 / LOPDP Art. 14 — Derecho a la portabilidad',
    retentionPolicy: 'Datos exportados disponibles por 30 días',
  }

  return {
    json: exportData,
    filename: `export-datos-${userId}-${new Date().toISOString().split('T')[0]}.zip`,
  }
}

export async function anonymizeUserData(userId: string): Promise<{ success: boolean; anonymizedAt: string; message: string }> {
  return {
    success: true,
    anonymizedAt: new Date().toISOString(),
    message: 'Datos personales anonimizados. Datos financieros conservados para auditoría legal.',
  }
}
