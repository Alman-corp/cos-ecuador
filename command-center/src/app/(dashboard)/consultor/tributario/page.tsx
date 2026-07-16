"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Calculator, AlertTriangle, FileCheck2, Scale, Shield } from "lucide-react"
import { FiscalCalendar } from "./components/FiscalCalendar"
import { IvaSimulator } from "./components/IvaSimulator"
import { ObligationsDashboard } from "./components/ObligationsDashboard"
import { IvaCalculatorFull } from "./components/IvaCalculatorFull"
import { ATSGenerator } from "./components/ATSGenerator"
import { CrucesDashboard } from "./components/CrucesDashboard"

export default function TributarioPage() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Scale className="h-8 w-8" />
            Motor Tributario SRI
          </h1>
          <p className="text-muted-foreground">
            Gestion completa de obligaciones fiscales ecuatorianas
          </p>
        </div>
      </div>

      <Tabs defaultValue="obligaciones" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="obligaciones" className="gap-2">
            <FileCheck2 className="h-4 w-4" /> Obligaciones
          </TabsTrigger>
          <TabsTrigger value="calendario" className="gap-2">
            Calendario
          </TabsTrigger>
          <TabsTrigger value="iva" className="gap-2">
            <Calculator className="h-4 w-4" /> IVA 104
          </TabsTrigger>
          <TabsTrigger value="anexos" className="gap-2">
            <FileText className="h-4 w-4" /> Anexos ATS
          </TabsTrigger>
          <TabsTrigger value="cruces" className="gap-2">
            <AlertTriangle className="h-4 w-4" /> Cruces
          </TabsTrigger>
          <TabsTrigger value="simulador" className="gap-2">
            <Shield className="h-4 w-4" /> Simulador
          </TabsTrigger>
        </TabsList>

        <TabsContent value="obligaciones" className="mt-6">
          <ObligationsDashboard companyId={selectedClientId || "demo"} />
        </TabsContent>

        <TabsContent value="calendario" className="mt-6">
          <FiscalCalendar />
        </TabsContent>

        <TabsContent value="iva" className="mt-6">
          <IvaCalculatorFull clientId={selectedClientId} />
        </TabsContent>

        <TabsContent value="anexos" className="mt-6">
          <ATSGenerator clientId={selectedClientId} />
        </TabsContent>

        <TabsContent value="cruces" className="mt-6">
          <CrucesDashboard clientId={selectedClientId} />
        </TabsContent>

        <TabsContent value="simulador" className="mt-6">
          <IvaSimulator />
        </TabsContent>
      </Tabs>
    </div>
  )
}
