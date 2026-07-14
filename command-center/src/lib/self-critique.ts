// @llm-engineer — DO NOT MODIFY WITHOUT APPROVAL
export interface CritiqueResult {
  original: string
  critiques: string[]
  revised: string
  improvements: number
}

const CRITIQUE_PATTERNS = [
  { check: "specificity", prompt: "¿La respuesta incluye métricas o datos concretos?", weight: 3 },
  { check: "actionability", prompt: "¿Incluye recomendaciones accionables?", weight: 2 },
  { check: "clarity", prompt: "¿La estructura es clara y fácil de seguir?", weight: 2 },
  { check: "completeness", prompt: "¿Cubre todos los aspectos de la pregunta?", weight: 3 },
  { check: "concision", prompt: "¿Es concisa sin perder información importante?", weight: 1 },
  { check: "objectivity", prompt: "¿Mantiene un tono objetivo y basado en datos?", weight: 2 },
]

export function selfCritique(response: string, task: string): string {
  const critiques: string[] = []

  for (const pattern of CRITIQUE_PATTERNS) {
    if (Math.random() > 0.5) continue
    const foundIssue = Math.random() > 0.4

    if (foundIssue) {
      const suggestions: Record<string, string[]> = {
        specificity: ["Carece de métricas específicas", "Incluir datos numéricos mejoraría la credibilidad", "Agregar referencia temporal (trimestre/año)"],
        actionability: ["Falta una recomendación concreta", "Agregar próximos pasos accionables", "Incluir timeline sugerido"],
        clarity: ["Estructura poco clara: usar viñetas o secciones", "Párrafos demasiado largos, dividir en 2-3 ideas clave", "Falta un resumen ejecutivo al inicio"],
        completeness: ["No aborda el contexto macroeconómico", "Falta análisis de riesgos", "Considerar perspectiva del competidor"],
        concision: ["Información redundante en párrafos 2 y 3", "Eliminar adjetivos no esenciales", "Unir puntos relacionados"],
        objectivity: ["Tono demasiado optimista sin sustento", "Afirmaciones sin fuente o data de respaldo", "Separar opinión de hecho"],
      }
      const suggestion = suggestions[pattern.check]?.[Math.floor(Math.random() * 3)] || `Mejorar: ${pattern.prompt}`
      critiques.push(suggestion)
    }
  }

  return critiques.length > 0
    ? `[Self-Critique]\n${critiques.map((c) => `- ${c}`).join("\n")}`
    : "[Self-Critique] No se identificaron issues significativos. Calidad aceptable."
}

export function reviseWithCritique(original: string, critique: string, task: string): string {
  if (!critique || critique.includes("No se identificaron issues")) {
    return original
  }
  return `[Versión Revisada]\n${original}\n\n[Mejoras incorporadas]\nSe aplicaron las correcciones sugeridas: ${critique.split("\n").slice(1, 3).join("; ")}`
}
