import type { FinancialYear } from "./types"

export interface WizardStep1 {
  companyName: string
  taxId: string
  country: string
  industry: string
  foundedYear: string
  employees: string
  currency: string
  isCurrentClient: boolean
}

export interface WizardFile {
  year: number
  fileName: string
  status: "uploading" | "processing" | "processed" | "needs_review" | "error"
  warnings?: string[]
  data?: Partial<FinancialYear>
}

export interface WizardStep3 {
  qualityScore: number
  qualityLevel: string
  correctionsNeeded: boolean
}

export interface WizardStep4 {
  objective: string
  customObjective: string
  context: string
  includeCompetitors: boolean
  contactName: string
  contactEmail: string
  contactRole: string
}

export interface WizardState {
  step: number
  step1: WizardStep1
  step2: WizardFile[]
  step3: WizardStep3
  step4: WizardStep4
}

const DEFAULT_STEP1: WizardStep1 = {
  companyName: "", taxId: "", country: "EC", industry: "",
  foundedYear: "", employees: "", currency: "USD", isCurrentClient: false,
}

const DEFAULT_STEP4: WizardStep4 = {
  objective: "acquisition", customObjective: "", context: "",
  includeCompetitors: false, contactName: "", contactEmail: "", contactRole: "",
}

export function createDefaultWizardState(): WizardState {
  return { step: 1, step1: { ...DEFAULT_STEP1 }, step2: [], step3: { qualityScore: 0, qualityLevel: "", correctionsNeeded: false }, step4: { ...DEFAULT_STEP4 } }
}

export function saveDraft(state: WizardState) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("cos_dd_draft", JSON.stringify(state))
    } catch {}
  }
}

export function loadDraft(): WizardState | null {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("cos_dd_draft")
      if (raw) return JSON.parse(raw)
    } catch {}
  }
  return null
}

export function clearDraft() {
  if (typeof window !== "undefined") {
    try { localStorage.removeItem("cos_dd_draft") } catch {}
  }
}
