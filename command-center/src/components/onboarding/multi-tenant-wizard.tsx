'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { api } from '@/lib/api'

const STEPS = [
  { id: 1, title: 'Empresa', description: 'Datos de tu firma consultora' },
  { id: 2, title: 'Usuarios', description: 'Invita a tu equipo' },
  { id: 3, title: 'Roles', description: 'Define permisos' },
  { id: 4, title: 'Branding', description: 'Personaliza tu portal' },
  { id: 5, title: 'LOPDP', description: 'Consentimiento de datos' },
]

const OnboardingSchema = z.object({
  name: z.string().min(3).max(150),
  ruc: z.string().length(13).regex(/^\d{13}$/),
  industry: z.enum(['CONSTRUCTION', 'MANUFACTURING', 'SERVICES', 'TECHNOLOGY', 'FINANCE']),
  city: z.enum(['Quito', 'Guayaquil', 'Cuenca', 'Otro']),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().regex(/^\+593\d{8,9}$/).optional().or(z.literal('')),
  consentLopdp: z.boolean().refine((v) => v === true, 'Debes aceptar la política de datos'),
})

type OnboardingData = z.infer<typeof OnboardingSchema>

export function MultiTenantOnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(1)
  const router = useRouter()

  const form = useForm<OnboardingData>({
    resolver: zodResolver(OnboardingSchema),
    defaultValues: {
      name: '',
      ruc: '',
      industry: 'SERVICES',
      city: 'Quito',
      email: '',
      phone: '',
      consentLopdp: false,
    },
  })

  const createTenant = useMutation({
    mutationFn: (data: OnboardingData) => api.post('/v1/tenants', data),
    onSuccess: () => {
      router.push('/dashboard')
      onComplete()
    },
  })

  const onSubmit = (data: OnboardingData) => {
    createTenant.mutate(data)
  }

  const nextStep = () => setCurrentStep((s) => Math.min(s + 1, 5))
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 1))

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Configura tu firma en COS Ecuador</CardTitle>
        <Progress value={(currentStep / 5) * 100} className="mt-2" />
        <p className="text-sm text-muted-foreground">
          Paso {currentStep} de 5: {STEPS[currentStep - 1].description}
        </p>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {currentStep === 1 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de tu firma</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Consultores Andinos S.A." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ruc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RUC de la firma</FormLabel>
                      <FormControl>
                        <Input placeholder="1790012345001" maxLength={13} {...field} />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        13 dígitos con validación de dígito verificador
                      </p>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industria</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="SERVICES">Servicios</SelectItem>
                            <SelectItem value="CONSTRUCTION">Construcción</SelectItem>
                            <SelectItem value="MANUFACTURING">Manufactura</SelectItem>
                            <SelectItem value="TECHNOLOGY">Tecnología</SelectItem>
                            <SelectItem value="FINANCE">Financiero</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ciudad</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Quito">Quito</SelectItem>
                            <SelectItem value="Guayaquil">Guayaquil</SelectItem>
                            <SelectItem value="Cuenca">Cuenca</SelectItem>
                            <SelectItem value="Otro">Otra ciudad</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="consentLopdp"
                  render={({ field }) => (
                    <FormItem className="flex items-start space-x-3">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="mt-1"
                        />
                      </FormControl>
                      <div className="text-sm">
                        <FormLabel className="font-normal">
                          Acepto la{' '}
                          <a href="/lopdp" target="_blank" className="underline">
                            Política de Protección de Datos (LOPDP Ecuador)
                          </a>
                        </FormLabel>
                        <p className="text-muted-foreground">
                          COS procesará datos de tus clientes bajo contrato de consultoría
                        </p>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Puedes invitar usuarios desde el panel de administración después del onboarding.
                </p>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Los roles se configuran en Gestión de Usuarios.
                  Roles disponibles: Admin, Consultor, Cliente, Viewer.
                </p>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  La personalización de marca (logo, colores, dominio) está disponible en
                  Configuración &gt; Branding.
                </p>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-4">
                <div className="rounded-lg bg-muted p-4">
                  <h3 className="font-medium">Resumen de Protección de Datos</h3>
                  <ul className="mt-2 text-sm space-y-1">
                    <li>Base legal: Contrato de prestación de servicios</li>
                    <li>Datos recopilados: Identificación, financieros, tributarios</li>
                    <li>Retención: 5 años según normativa contable ecuatoriana</li>
                    <li>Derechos ARCO+P: Acceso, Rectificación, Cancelación, Oposición, Portabilidad</li>
                    <li>Encargado del tratamiento: EconoSight Consultores</li>
                    <li>SPDP: Registro de actividades de tratamiento obligatorio</li>
                  </ul>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t">
              <Button type="button" variant="ghost" onClick={prevStep} disabled={currentStep === 1}>
                Anterior
              </Button>

              {currentStep < 5 ? (
                <Button type="button" onClick={nextStep}>
                  Siguiente
                </Button>
              ) : (
                <Button type="submit" disabled={createTenant.isPending}>
                  {createTenant.isPending ? 'Creando...' : 'Comenzar'}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
