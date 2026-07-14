// @llm-engineer — DO NOT MODIFY WITHOUT APPROVAL
export interface ConstitutionalRule {
  id: string
  principle: string
  category: "compliance" | "safety" | "ethics" | "accuracy"
  check: (text: string) => { violated: boolean; violation?: string }
  severity: "critical" | "high" | "medium"
}

export interface ConstitutionalResult {
  approved: boolean
  violations: string[]
  sanitized: string
}

const RULES: ConstitutionalRule[] = [
  {
    id: "no-investment-advice",
    principle: "No dar recomendaciones de inversión personalizadas sin disclaimer",
    category: "compliance",
    check: (text) => {
      const patterns = ["deberías comprar", "compra ahora", "vende tus", "invierte en", "es una oportunidad única"]
      for (const p of patterns) {
        if (text.toLowerCase().includes(p)) {
          return { violated: true, violation: `Contiene lenguaje de recomendación de inversión: "${p}"` }
        }
      }
      return { violated: false }
    },
    severity: "critical",
  },
  {
    id: "no-guarantees",
    principle: "No garantizar resultados financieros futuros",
    category: "compliance",
    check: (text) => {
      const patterns = ["rendimiento garantizado", "retorno asegurado", "sin riesgo", "ganancia segura", "100% seguro"]
      for (const p of patterns) {
        if (text.toLowerCase().includes(p)) {
          return { violated: true, violation: `Garantía de resultado: "${p}"` }
        }
      }
      return { violated: false }
    },
    severity: "critical",
  },
  {
    id: "data-attribution",
    principle: "Citar fuentes de datos cuando se presenten métricas",
    category: "accuracy",
    check: (text) => {
      if (/\d+\.?\d*%/.test(text) && !/fuente|según|de acuerdo con|source|according/i.test(text)) {
        return { violated: true, violation: "Métrica sin atribución de fuente" }
      }
      return { violated: false }
    },
    severity: "medium",
  },
  {
    id: "uncertainty",
    principle: "Expresar incertidumbre en pronósticos",
    category: "accuracy",
    check: (text) => {
      if (/pronostic|proyectamos|estimamos|predecimos/i.test(text) && !/probabilidad|rango|intervalo|confianza|±|inciert/i.test(text)) {
        return { violated: true, violation: "Pronóstico sin expresión de incertidumbre" }
      }
      return { violated: false }
    },
    severity: "high",
  },
  {
    id: "no-confidential",
    principle: "No divulgar información confidencial o insider",
    category: "ethics",
    check: (text) => {
      const patterns = ["información privilegiada", "insider", "confidencial", "no pública", "secret", "filtrado"]
      for (const p of patterns) {
        if (text.toLowerCase().includes(p)) {
          return { violated: true, violation: `Posible divulgación de información confidencial: "${p}"` }
        }
      }
      return { violated: false }
    },
    severity: "critical",
  },
]

export function constitutionalCheck(text: string): ConstitutionalResult {
  const violations: string[] = []
  let sanitized = text

  for (const rule of RULES) {
    const result = rule.check(text)
    if (result.violated && result.violation) {
      violations.push(`[${rule.severity.toUpperCase()}] ${result.violation}`)
      if (rule.severity === "critical") {
        sanitized = sanitized + "\n\n⚠ DISCLAIMER: Esta información es solo para fines educativos. No constituye asesoría financiera personalizada."
      }
    }
  }

  return {
    approved: violations.length === 0,
    violations,
    sanitized,
  }
}

export function getConstitutionalRules(): ConstitutionalRule[] {
  return RULES
}
