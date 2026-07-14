'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Shield, Download, Send, CheckCircle, AlertTriangle } from 'lucide-react'

type ARCORight = 'ACCESS' | 'RECTIFY' | 'CANCEL' | 'OPPOSE' | 'PORTABILITY'

export default function PrivacidadPage() {
  const queryClient = useQueryClient()
  const [rightType, setRightType] = useState<ARCORight>('ACCESS')
  const [requesterName, setRequesterName] = useState('')
  const [requesterEmail, setRequesterEmail] = useState('')
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const { data: activities = [] } = useQuery<any[]>({
    queryKey: ['lopdp-activities'],
    queryFn: () => api.get('/v1/lopdp/activities'),
  })

  const { data: consents = [] } = useQuery<any[]>({
    queryKey: ['lopdp-consents'],
    queryFn: () => api.get('/v1/lopdp/consents'),
  })

  const { data: arcoRequests = [] } = useQuery<any[]>({
    queryKey: ['lopdp-arco'],
    queryFn: () => api.get('/v1/lopdp/arco-requests'),
  })

  const submitARCO = useMutation({
    mutationFn: () =>
      api.post('/v1/lopdp/arco-requests', {
        requesterEmail,
        requesterName,
        rightType,
      }),
    onSuccess: () => {
      setSuccessMsg('Solicitud ARCO enviada. Recibirá respuesta en máximo 15 días hábiles.')
      queryClient.invalidateQueries({ queryKey: ['lopdp-arco'] })
      setRequesterName('')
      setRequesterEmail('')
    },
  })

  const exportData = useMutation({
    mutationFn: () => api.get(`/v1/lopdp/export-data?email=${requesterEmail}`),
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'mis-datos-personales.json'; a.click()
      URL.revokeObjectURL(url)
    },
  })

  const rightLabels: Record<ARCORight, { title: string; desc: string }> = {
    ACCESS: { title: 'Acceso (Art. 9)', desc: 'Conocer qué datos personales tenemos sobre usted' },
    RECTIFY: { title: 'Rectificación (Art. 10)', desc: 'Corregir datos inexactos o incompletos' },
    CANCEL: { title: 'Cancelación (Art. 11)', desc: 'Eliminar sus datos personales (derecho al olvido)' },
    OPPOSE: { title: 'Oposición (Art. 12)', desc: 'Oponerse al tratamiento de sus datos' },
    PORTABILITY: { title: 'Portabilidad (Art. 14)', desc: 'Recibir sus datos en formato estructurado' },
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Privacidad y Protección de Datos</h1>
          <p className="text-muted-foreground">
            LOPDP Ecuador — Ley Orgánica de Protección de Datos Personales
          </p>
        </div>
      </div>

      {successMsg && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>{successMsg}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ARCO+P Rights Form */}
        <Card>
          <CardHeader>
            <CardTitle>Ejercer Derechos ARCO+P</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nombre completo</Label>
              <Input
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                placeholder="Juan Pérez"
              />
            </div>
            <div>
              <Label>Correo electrónico</Label>
              <Input
                value={requesterEmail}
                onChange={(e) => setRequesterEmail(e.target.value)}
                placeholder="juan@example.com"
                type="email"
              />
            </div>
            <div>
              <Label>Derecho a ejercer</Label>
              <Select value={rightType} onValueChange={(v) => setRightType(v as ARCORight)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(rightLabels).map(([key, val]) => (
                    <SelectItem key={key} value={key}>
                      {val.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {rightLabels[rightType].desc}
              </p>
            </div>

            {rightType === 'PORTABILITY' && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => exportData.mutate()}
                disabled={!requesterEmail || exportData.isPending}
              >
                <Download className="h-4 w-4 mr-2" />
                {exportData.isPending ? 'Exportando...' : 'Exportar mis datos (JSON)'}
              </Button>
            )}

            <Button
              className="w-full"
              onClick={() => submitARCO.mutate()}
              disabled={!requesterName || !requesterEmail || submitARCO.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              {submitARCO.isPending ? 'Enviando...' : 'Enviar Solicitud'}
            </Button>

            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-xs">
                Plazo legal de respuesta: <strong>15 días hábiles</strong> (Art. 16 LOPDP).
                Para consultas: privacidad@econosight.ec
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Consents Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Consentimientos Otorgados</CardTitle>
          </CardHeader>
          <CardContent>
            {consents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay consentimientos registrados</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Actividad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consents.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-sm">{c.activity?.name}</TableCell>
                      <TableCell>
                        {c.revokedAt ? (
                          <span className="text-red-600 text-xs">Revocado</span>
                        ) : (
                          <span className="text-green-600 text-xs">Activo</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(c.createdAt).toLocaleDateString('es-EC')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activities de tratamiento */}
      <Card>
        <CardHeader>
          <CardTitle>Actividades de Tratamiento Registradas</CardTitle>
          <p className="text-sm text-muted-foreground">
            Art. 23 LOPDP — Registro obligatorio ante SPDP
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Actividad</TableHead>
                <TableHead>Base Legal</TableHead>
                <TableHead>Categorías</TableHead>
                <TableHead>Retención</TableHead>
                <TableHead>Sujetos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium text-sm">{a.name}</TableCell>
                  <TableCell className="text-xs">{a.legal_basis}</TableCell>
                  <TableCell className="text-xs">{a.data_categories?.join(', ')}</TableCell>
                  <TableCell className="text-xs">{a.retention_days} días</TableCell>
                  <TableCell className="text-xs">{a.data_subject_categories?.join(', ')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Historial ARCO */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Solicitudes ARCO+P</CardTitle>
        </CardHeader>
        <CardContent>
          {arcoRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay solicitudes previas</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Derecho</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Límite</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {arcoRequests.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">
                      {new Date(r.receivedAt).toLocaleDateString('es-EC')}
                    </TableCell>
                    <TableCell className="text-sm">{r.rightType}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded ${
                        r.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        r.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>{r.status}</span>
                    </TableCell>
                    <TableCell className="text-xs">
                      {new Date(r.deadlineAt).toLocaleDateString('es-EC')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
