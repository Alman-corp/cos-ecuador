import type { ReactNode } from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "COS Platform — Inteligencia Estratégica para tu Firma",
  description:
    "Transforma datos dispersos en inteligencia accionable. IA especializada, dashboards en tiempo real y simulación estratégica para firmas de consultoría.",
  openGraph: {
    title: "COS Platform",
    description:
      "IA especializada, dashboards en tiempo real y simulación estratégica.",
    type: "website",
  },
}

export default function LandingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
