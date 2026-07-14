"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { WizardSteps, type Step } from "@/components/due-diligence/WizardSteps"
import { CompanyStep } from "@/components/due-diligence/CompanyStep"
import { UploadStep } from "@/components/due-diligence/UploadStep"
import { ValidateStep } from "@/components/due-diligence/ValidateStep"
import { ConfigStep } from "@/components/due-diligence/ConfigStep"
import { createEngagement } from "@/lib/actions/dd-actions"
import { Building2, Upload, ShieldCheck, Settings2, AlertTriangle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const STEPS: Step[] = [
  { id: "company", label: "Empresa", icon: <Building2 className="h-4 w-4" /> },
  { id: "upload", label: "Archivos", icon: <Upload className="h-4 w-4" /> },
  { id: "validate", label: "Validar", icon: <ShieldCheck className="h-4 w-4" /> },
  { id: "config", label: "Configurar", icon: <Settings2 className="h-4 w-4" /> },
]

export default function NewDDWizardPage() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<any>({})
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <WizardSteps steps={STEPS} current={step} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {step === 0 && (
            <CompanyStep
              data={data}
              setData={(d) => { setData((prev: any) => ({ ...prev, ...d })); setStep(1) }}
              onNext={() => setStep(1)}
            />
          )}
          {step === 1 && (
            <UploadStep
              data={data}
              setData={(d: any) => setData((prev: any) => ({ ...prev, ...d }))}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <ValidateStep
              data={data}
              onNext={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <ConfigStep
              data={data}
              onSubmit={async (modules: string[]) => {
                setError(null)
                const currencyMap: Record<string, "USD" | "EUR" | "COP" | "MXN"> = {
                  EC: "USD", CO: "COP", MX: "MXN", PE: "USD", CL: "USD",
                }
                const res = await createEngagement({
                  companyName: data.name,
                  industry: data.industry || "technology",
                  fiscalYear: new Date().getFullYear(),
                  currency: currencyMap[data.country ?? ""] ?? "USD",
                  scope: modules as ("financial" | "legal" | "tax" | "operational" | "commercial")[],
                })
                if ("data" in res) {
                  router.push(`/due-diligence/${res.data.id}/analysis`)
                } else {
                  setError(typeof res.error === "string" ? res.error : "Error al crear el engagement")
                }
              }}
            />
          )}
          {error && (
            <div className="mx-auto mt-4 max-w-2xl flex items-center gap-2 rounded-lg bg-danger/10 border border-danger/30 px-4 py-3 text-sm text-danger">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
