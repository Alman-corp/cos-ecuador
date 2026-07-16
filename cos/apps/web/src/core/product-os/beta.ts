import type { BetaProgram } from "./types"

export const betaProgram: BetaProgram = {
  status: "draft",
  maxParticipants: 10,
  currentParticipants: 0,
  duration: "60 días",
  requirements: [
    "Ser una firma de consultoría, contabilidad o auditoría con al menos 2 empleados",
    "Tener al menos 5 clientes activos a los que aplicar la plataforma",
    "Disponibilidad para una reunión semanal de 30 minutos con el equipo de producto",
    "Comprometerse a usar la plataforma para al menos 3 análisis completos durante la beta",
    "Proporcionar feedback estructurado al final de cada semana",
  ],
  incentives: [
    "Acceso gratuito a todos los planes durante 60 días",
    "Soporte prioritario con el equipo fundador",
    "Participación en la definición del roadmap del producto",
    "Descuento del 50% en el primer año post-beta",
    "Reconocimiento como beta partner en el sitio web (opcional)",
    "Acceso anticipado a nuevas funcionalidades",
  ],
  feedbackChannels: [
    "Reunión semanal de seguimiento (15-30 min)",
    "Encuesta NPS al día 30",
    "Formulario de feedback post-análisis integrado en la plataforma",
    "Canal directo de WhatsApp/Telegram con el equipo de producto",
    "Registro automático de métricas de uso en la plataforma",
  ],
  successCriteria: [
    "Al menos 70% de los participantes completan el flujo de activación completo",
    "Promedio de 3+ análisis por empresa durante la beta",
    "NPS >= 40 al final del período",
    "Al menos 40% de los participantes expresan intención de pago",
    "Identificar al menos 3 mejoras críticas para el producto",
    "Tiempo promedio a primer análisis < 7 días",
  ],
}

export function getBetaProgress(): { registered: number; activated: number; analyzed: number; paidIntent: number } {
  return { registered: 0, activated: 0, analyzed: 0, paidIntent: 0 }
}
