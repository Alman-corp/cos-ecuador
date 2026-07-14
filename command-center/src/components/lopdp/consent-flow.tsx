'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, ExternalLink } from 'lucide-react'

const ConsentFormSchema = z.object({
  acceptPrivacyPolicy: z.literal(true, {
    errorMap: () => ({ message: 'Debe aceptar la política de privacidad' }),
  }),
  acceptDataProcessing: z.literal(true, {
    errorMap: () => ({ message: 'Debe aceptar el tratamiento de datos' }),
  }),
  acceptInternationalTransfers: z.boolean().default(false),
  acceptMarketing: z.boolean().default(false),
  acceptAnalytics: z.boolean().default(true),
})

type ConsentFormValues = z.infer<typeof ConsentFormSchema>

interface ConsentFlowProps {
  tenantId: string
  policyVersion: string
  onComplete: () => void
}

export function ConsentFlow({ tenantId, policyVersion, onComplete }: ConsentFlowProps) {
  const [showDetails, setShowDetails] = useState<string | null>(null)
  const [confirmSubmit, setConfirmSubmit] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ConsentFormValues>({
    resolver: zodResolver(ConsentFormSchema),
    defaultValues: {
      acceptMarketing: false,
      acceptInternationalTransfers: false,
      acceptAnalytics: true,
    },
  })

  const saveConsent = useMutation({
    mutationFn: async (data: ConsentFormValues) => {
      const consents = [
        { activityType: 'PRIVACY_POLICY', granted: data.acceptPrivacyPolicy },
        { activityType: 'DATA_PROCESSING', granted: data.acceptDataProcessing },
        { activityType: 'INTERNATIONAL_TRANSFERS', granted: data.acceptInternationalTransfers },
        { activityType: 'MARKETING', granted: data.acceptMarketing },
        { activityType: 'ANALYTICS', granted: data.acceptAnalytics },
      ]
      return api.post('/v1/lopdp/consents', {
        tenantId,
        policyVersion,
        consents,
        metadata: {
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          consentMethod: 'CHECKBOX',
        },
      })
    },
    onSuccess: () => onComplete(),
  })

  const values = watch()

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-blue-600" />
          Protección de Datos Personales — LOPDP Ecuador
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          En cumplimiento de la Ley Orgánica de Protección de Datos Personales (LOPDP),
          Registro Oficial Suplemento 353 de 26-May-2021
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((data) => saveConsent.mutate(data))} className="space-y-6">

          <ConsentBlock
            title="Política de Privacidad"
            required
            description="He leído y acepto la Política de Privacidad de EconoSight."
            detailContent={<PrivacyPolicySummary />}
            showDetails={showDetails === 'privacy'}
            onToggleDetails={() => setShowDetails(showDetails === 'privacy' ? null : 'privacy')}
            error={errors.acceptPrivacyPolicy?.message}
          >
            <input type="checkbox" {...register('acceptPrivacyPolicy')} className="mt-1" />
          </ConsentBlock>

          <ConsentBlock
            title="Tratamiento de Datos Personales"
            required
            description="Autorizo el tratamiento de mis datos para prestación del servicio de consultoría."
            detailContent={<DataProcessingSummary />}
            showDetails={showDetails === 'processing'}
            onToggleDetails={() => setShowDetails(showDetails === 'processing' ? null : 'processing')}
            error={errors.acceptDataProcessing?.message}
          >
            <input type="checkbox" {...register('acceptDataProcessing')} className="mt-1" />
          </ConsentBlock>

          <ConsentBlock
            title="Transferencias Internacionales"
            description="Autorizo el uso de servicios de IA (OpenAI, Anthropic) en EE.UU., protegidos por DPAs."
            detailContent={<InternationalTransfersSummary />}
            showDetails={showDetails === 'international'}
            onToggleDetails={() => setShowDetails(showDetails === 'international' ? null : 'international')}
          >
            <input type="checkbox" {...register('acceptInternationalTransfers')} className="mt-1" />
          </ConsentBlock>

          <ConsentBlock
            title="Comunicaciones Comerciales"
            description="Acepto recibir información sobre actualizaciones del servicio y webinars."
          >
            <input type="checkbox" {...register('acceptMarketing')} className="mt-1" />
          </ConsentBlock>

          <ConsentBlock
            title="Análisis de Uso (Anonimizado)"
            description="Permito el análisis anonimizado de mi uso para mejorar el servicio."
          >
            <input type="checkbox" {...register('acceptAnalytics')} className="mt-1" />
          </ConsentBlock>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Sus derechos ARCO+P:</strong> Acceso, Rectificación, Cancelación,
              Oposición y Portabilidad. Puede ejercerlos en{' '}
              <a href="/configuracion/privacidad" className="underline">Configuración &gt; Privacidad</a>
              . Consultas: <strong>privacidad@econosight.ec</strong>
            </AlertDescription>
          </Alert>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline">Cancelar</Button>
            <Button type="submit" disabled={saveConsent.isPending}>
              {saveConsent.isPending ? 'Guardando...' : 'Aceptar y Continuar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function ConsentBlock({
  title, required, description, children, detailContent, showDetails, onToggleDetails, error,
}: any) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start gap-3">
        {children}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{title}</h4>
            {required && <span className="text-red-500 text-xs">* Obligatorio</span>}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
          {detailContent && (
            <button
              type="button"
              onClick={onToggleDetails}
              className="text-sm text-blue-600 hover:underline mt-2 flex items-center gap-1"
            >
              {showDetails ? 'Ocultar detalles' : 'Ver detalles'}
              <ExternalLink className="h-3 w-3" />
            </button>
          )}
          {showDetails && (
            <div className="mt-3 p-3 bg-muted rounded-md text-sm">{detailContent}</div>
          )}
          {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </div>
      </div>
    </div>
  )
}

function PrivacyPolicySummary() {
  return (
    <ul className="space-y-1 text-xs">
      <li>• <strong>Responsable:</strong> EconoSight Ecuador</li>
      <li>• <strong>Finalidad:</strong> Servicios de consultoría financiera</li>
      <li>• <strong>Base legal:</strong> Ejecución contractual + consentimiento</li>
      <li>• <strong>Plazo:</strong> 5 años (normativa contable)</li>
      <li>• <strong>Derechos:</strong> ARCO+P en privacidad@econosight.ec</li>
    </ul>
  )
}

function DataProcessingSummary() {
  return (
    <ul className="space-y-1 text-xs">
      <li>• <strong>Categorías:</strong> Nombre, RUC, email, datos financieros</li>
      <li>• <strong>Destinatarios:</strong> SRI, SuperCias, BCE</li>
      <li>• <strong>Medidas:</strong> Cifrado AES-256, TLS 1.3, RLS multi-tenant</li>
    </ul>
  )
}

function InternationalTransfersSummary() {
  return (
    <ul className="space-y-1 text-xs">
      <li>• <strong>OpenAI:</strong> Procesamiento IA (DPA SCC firmado)</li>
      <li>• <strong>Anthropic:</strong> Claude para análisis (DPA SCC firmado)</li>
      <li>• <strong>Garantías:</strong> Cláusulas Contractuales Tipo UE</li>
    </ul>
  )
}
