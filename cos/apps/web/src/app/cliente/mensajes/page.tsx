export default function MensajesPage() {
  const conversations = [
    { from: "Carlos Andrade", role: "Consultor Líder", subject: "Revisión informe trimestral", preview: "Le adjunto la versión final del informe...", date: "Hoy, 10:30", unread: true },
    { from: "Sistema COS", role: "Automático", subject: "Alerta: Declaración IVA pendiente", preview: "La declaración del mes de Junio debe ser...", date: "Ayer, 14:00", unread: true },
    { from: "María Fernanda", role: "Analista Financiero", subject: "Dudas sobre proyección", preview: "Respecto al flujo proyectado, quería...", date: "25 Jun 2026", unread: false },
    { from: "Sistema COS", role: "Automático", subject: "Documento procesado", preview: "El Balance General Q2 2026 ha sido...", date: "24 Jun 2026", unread: false },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-surface-50">Mensajes</h1>
        <p className="text-sm text-surface-400">Comunicación con tu equipo de consultoría</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-surface-700/50">
        {conversations.map((msg) => (
          <div
            key={`${msg.from}-${msg.subject}`}
            className={`flex items-start gap-4 border-b border-surface-700/30 px-5 py-4 transition-colors hover:bg-surface-800/50 cursor-pointer ${
              msg.unread ? "bg-accent-600/5" : ""
            }`}
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              msg.unread ? "bg-accent-600/20 text-accent-400" : "bg-surface-700 text-surface-400"
            }`}>
              {msg.from.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-surface-200">{msg.from}</span>
                  <span className="text-[10px] text-surface-500">{msg.role}</span>
                  {msg.unread && <span className="h-2 w-2 rounded-full bg-accent-500" />}
                </div>
                <span className="text-[10px] text-surface-500">{msg.date}</span>
              </div>
              <p className="mt-0.5 text-sm font-medium text-surface-300">{msg.subject}</p>
              <p className="mt-0.5 truncate text-xs text-surface-500">{msg.preview}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
