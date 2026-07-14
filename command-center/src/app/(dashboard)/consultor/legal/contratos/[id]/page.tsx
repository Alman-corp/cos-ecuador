'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit3, Save, FileText, GitCompare, Users, BookOpen, CheckCircle, Download, X, Plus, Trash2 } from 'lucide-react'
import type { ContractDocument, ContractStatus, ContractVersion, ContractParty, DiffChange } from '@/lib/legal/contract-types'
import { getContract, updateContract, changeContractStatus, exportToMarkdown, getContractDiff, deleteContract } from '@/lib/legal/legal-service'
import { analyzeDocument } from '@/lib/legal/clause-library'

const statusLabels: Record<ContractStatus, string> = {
  draft: 'Borrador',
  review: 'Revisión',
  approved: 'Aprobado',
  signed: 'Firmado',
  expired: 'Vencido',
  cancelled: 'Cancelado',
}

const statusColors: Record<ContractStatus, string> = {
  draft: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400',
  review: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400',
  approved: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400',
  signed: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400',
  expired: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/30 dark:text-gray-400',
  cancelled: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400',
}

const mockContract: ContractDocument = {
  id: 'mock-1',
  templateId: 'contrato-servicios-profesionales',
  title: 'Contrato de Prestación de Servicios Profesionales',
  content: `CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES

PREÁMBULO
=========
Comparecen a la celebración del presente Contrato de Prestación de Servicios Profesionales, por una parte María López, ecuatoriana, portadora de la cédula de identidad No. 1712345678, con domicilio en Quito, a quien en adelante se denominará "EL CONTRATANTE"; y, por otra parte TechSolutions SA, ecuatoriana, portadora del RUC No. 1792345678001, a quien en adelante se denominará "EL PROFESIONAL".

PRIMERA.- ANTECEDENTES
======================
EL CONTRATANTE requiere los servicios profesionales de desarrollo de software para implementar un sistema de gestión empresarial. EL PROFESIONAL declara tener la capacidad técnica, profesional y legal necesaria.

SEGUNDA.- OBJETO DEL CONTRATO
=============================
EL PROFESIONAL se obliga a prestar sus servicios profesionales a EL CONTRATANTE para el desarrollo del sistema de gestión, conforme a los términos y condiciones establecidos en el presente instrumento.

TERCERA.- PLAZO
===============
El plazo de duración del presente contrato será de 6 meses, contados a partir de la fecha de suscripción del mismo.

CUARTA.- HONORARIOS Y FORMA DE PAGO
====================================
EL CONTRATANTE pagará a EL PROFESIONAL la cantidad de $3,000 mensuales, por concepto de honorarios profesionales.

FIRMAS
======
En fe de lo cual, las partes suscriben el presente contrato en la ciudad de Quito, a los 15 de junio de 2026.

___________________________
María López
C.C. 1712345678
EL CONTRATANTE

___________________________
TechSolutions SA
RUC: 1792345678001
EL PROFESIONAL`,
  variables: { profesional_nombre: 'TechSolutions SA', contratante_nombre: 'María López', honorarios: '3000', plazo_meses: '6', ciudad: 'Quito', fecha: '15 de junio de 2026' },
  status: 'draft',
  version: 1,
  versions: [
    { version: 1, content: `CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES\n\nPREÁMBULO\n=========\nComparecen...`, changedBy: 'Sistema', changedAt: '2026-06-01T10:00:00Z', changeDescription: 'Versión inicial del contrato' },
    { version: 2, content: `CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES\n\nPREÁMBULO\n=========\nComparecen... (v2)`, changedBy: 'Usuario Admin', changedAt: '2026-06-10T14:00:00Z', changeDescription: 'Actualización de honorarios y plazo' },
  ],
  parties: [
    { name: 'María López', role: 'issuer', documentType: 'cedula', documentNumber: '1712345678', address: 'Quito', email: 'maria@email.com', legalRepresentative: 'María López' },
    { name: 'TechSolutions SA', role: 'recipient', documentType: 'ruc', documentNumber: '1792345678001', address: 'Quito', email: 'info@techsol.com', legalRepresentative: 'Carlos Pérez' },
  ],
  tags: ['servicios', 'profesionales'],
  notes: 'Revisar cláusula de confidencialidad antes de firma',
  createdAt: '2026-06-01T10:00:00Z',
  updatedAt: '2026-06-15T14:30:00Z',
}

const tabs = ['Documento', 'Versiones', 'Partes', 'Cláusulas'] as const

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function ContractDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [contract, setContract] = useState<ContractDocument | null>(null)
  const [activeTab, setActiveTab] = useState<string>('Documento')
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null)
  const [diff, setDiff] = useState<DiffChange[] | null>(null)
  const [exportMessage, setExportMessage] = useState<string | null>(null)
  const [analysisResults, setAnalysisResults] = useState<any[] | null>(null)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const id = params.id as string
    const found = getContract(id)
    if (found) {
      setContract(found)
      setNotes(found.notes || '')
      if (found.versions.length >= 2) {
        const d = getContractDiff(id)
        if (d) setDiff(d.changes)
      }
    } else if (id === 'mock-1') {
      setContract(mockContract)
      setNotes(mockContract.notes)
    } else {
      setContract(null)
    }
  }, [params.id])

  useEffect(() => {
    if (contract && activeTab === 'Cláusulas') {
      const analyses = analyzeDocument(contract)
      setAnalysisResults(analyses)
    }
  }, [contract, activeTab])

  const currentVersion = useMemo(() => {
    if (!contract || contract.versions.length === 0) return null
    if (selectedVersion !== null) {
      return contract.versions.find((v) => v.version === selectedVersion) || null
    }
    return contract.versions[contract.versions.length - 1]
  }, [contract, selectedVersion])

  function handleEdit() {
    if (!contract) return
    setEditContent(currentVersion?.content || contract.content)
    setIsEditing(true)
  }

  function handleSave() {
    if (!contract) return
    const updated = updateContract(contract.id, {
      notes,
      changedBy: 'Usuario',
      changeDescription: 'Edición manual del contenido',
    })
    if (updated) {
      setContract(updated)
      setEditContent('')
    }
    setIsEditing(false)
    setExportMessage('Cambios guardados correctamente')
    setTimeout(() => setExportMessage(null), 3000)
  }

  function handleStatusChange(newStatus: ContractStatus) {
    if (!contract) return
    const updated = changeContractStatus(contract.id, newStatus, 'Usuario')
    if (updated) {
      setContract(updated)
      setExportMessage(`Estado cambiado a: ${statusLabels[newStatus]}`)
      setTimeout(() => setExportMessage(null), 3000)
    }
  }

  function handleExportMarkdown() {
    if (!contract) return
    const md = exportToMarkdown(contract.id)
    if (md) {
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${contract.title.replace(/\s+/g, '_')}.md`
      a.click()
      URL.revokeObjectURL(url)
      setExportMessage('Exportado como Markdown')
    } else {
      setExportMessage('Error al exportar')
    }
    setTimeout(() => setExportMessage(null), 3000)
  }

  function handleDelete() {
    if (!contract) return
    if (confirm('¿Está seguro de eliminar este contrato?')) {
      deleteContract(contract.id)
      router.push('/consultor/legal')
    }
  }

  function getVersionBadge(v: number): string {
    if (v === contract?.version) return 'Actual'
    return `v${v}`
  }

  if (!contract) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Contrato no encontrado</h2>
        <p className="text-muted-foreground mb-4">El contrato que busca no existe o ha sido eliminado</p>
        <Link href="/consultor/legal">
          <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" /> Volver a Legal Hub</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/consultor/legal">
            <Button variant="ghost" size="icon" type="button">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{contract.title}</h1>
              <Badge className={statusColors[contract.status]} variant="outline">
                {statusLabels[contract.status]}
              </Badge>
              <Badge variant="outline" className="text-xs">v{contract.version}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Creado {formatDate(contract.createdAt)} · Actualizado {formatDate(contract.updatedAt)}
            </p>
          </div>
        </div>
      </div>

      {exportMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-sm">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          {exportMessage}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'Documento' && <FileText className="h-4 w-4 mr-1" />}
            {tab === 'Versiones' && <GitCompare className="h-4 w-4 mr-1" />}
            {tab === 'Partes' && <Users className="h-4 w-4 mr-1" />}
            {tab === 'Cláusulas' && <BookOpen className="h-4 w-4 mr-1" />}
            {tab}
          </Button>
        ))}
      </div>

      {activeTab === 'Documento' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Documento</CardTitle>
                <div className="flex gap-2">
                  {!isEditing ? (
                    <>
                      <Button variant="outline" size="sm" onClick={handleEdit}>
                        <Edit3 className="h-4 w-4 mr-1" /> Editar
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleExportMarkdown}>
                        <Download className="h-4 w-4 mr-1" /> Exportar MD
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" onClick={handleSave}>
                        <Save className="h-4 w-4 mr-1" /> Guardar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                        <X className="h-4 w-4 mr-1" /> Cancelar
                      </Button>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-[500px] font-mono text-sm p-4 rounded-lg border border-input bg-transparent resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                ) : (
                  <div className="bg-muted/30 rounded-lg p-4 max-h-[600px] overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap font-serif leading-relaxed">
                      {currentVersion?.content || contract.content}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {contract.status === 'draft' && (
                  <Button className="w-full" size="sm" onClick={() => handleStatusChange('review')}>
                    Enviar a Revisión
                  </Button>
                )}
                {contract.status === 'review' && (
                  <Button className="w-full" size="sm" onClick={() => handleStatusChange('approved')}>
                    Aprobar Contrato
                  </Button>
                )}
                {contract.status === 'approved' && (
                  <Button className="w-full" size="sm" onClick={() => handleStatusChange('signed')}>
                    <CheckCircle className="h-4 w-4 mr-1" /> Firmar Contrato
                  </Button>
                )}
                {contract.status !== 'signed' && contract.status !== 'cancelled' && contract.status !== 'expired' && (
                  <Button variant="destructive" className="w-full" size="sm" onClick={() => handleStatusChange('cancelled')}>
                    <X className="h-4 w-4 mr-1" /> Cancelar Contrato
                  </Button>
                )}
                <Button variant="outline" className="w-full" size="sm" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-24 text-sm p-2 rounded-lg border border-input bg-transparent resize-none"
                  placeholder="Añadir notas..."
                />
                <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => {
                  if (!contract) return
                  const updated = updateContract(contract.id, { notes, changedBy: 'Usuario', changeDescription: 'Actualización de notas' })
                  if (updated) setContract(updated)
                }}>
                  <Save className="h-3 w-3 mr-1" /> Guardar Notas
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'Versiones' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            <h3 className="font-semibold text-sm">Historial de Versiones</h3>
            {contract.versions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay versiones disponibles</p>
            ) : (
              [...contract.versions].reverse().map((v) => (
                <Card
                  key={v.version}
                  className={`cursor-pointer transition-colors ${selectedVersion === v.version ? 'border-primary' : ''}`}
                  onClick={() => setSelectedVersion(selectedVersion === v.version ? null : v.version)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <Badge variant={v.version === contract.version ? 'default' : 'outline'} className="text-xs">
                        {getVersionBadge(v.version)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(v.changedAt)}</span>
                    </div>
                    <p className="text-xs mt-1">{v.changeDescription}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">por {v.changedBy}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Vista del Documento</CardTitle>
              </CardHeader>
              <CardContent>
                {diff && selectedVersion ? (
                  <div className="space-y-1 max-h-[500px] overflow-y-auto">
                    <p className="text-sm text-muted-foreground mb-2">
                      Diferencias entre versiones
                    </p>
                    {diff.map((change, i) => (
                      <div
                        key={i}
                        className={`p-2 rounded text-sm ${
                          change.type === 'addition'
                            ? 'bg-green-100 dark:bg-green-950/30 border-l-4 border-green-500'
                            : change.type === 'deletion'
                            ? 'bg-red-100 dark:bg-red-950/30 border-l-4 border-red-500 line-through'
                            : 'bg-yellow-100 dark:bg-yellow-950/30 border-l-4 border-yellow-500'
                        }`}
                      >
                        <span className="text-xs font-mono text-muted-foreground">L{change.line}: </span>
                        {change.oldText && <span className="text-red-600">{change.oldText}</span>}
                        {change.newText && change.type === 'modification' && (
                          <>
                            <span className="mx-1 text-muted-foreground">→</span>
                            <span className="text-green-600">{change.newText}</span>
                          </>
                        )}
                        {change.newText && change.type === 'addition' && (
                          <span className="text-green-600">{change.newText}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-muted/30 rounded-lg p-4 max-h-[500px] overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap font-serif leading-relaxed">
                      {currentVersion?.content || contract.content}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'Partes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {contract.parties.map((party, i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4" />
                  {party.role === 'issuer' ? 'Contratante / Emisor' : party.role === 'recipient' ? 'Receptor / Contratado' : 'Garante'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Nombre</dt>
                    <dd className="font-medium">{party.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Documento</dt>
                    <dd>{party.documentType.toUpperCase()}: {party.documentNumber}</dd>
                  </div>
                  {party.legalRepresentative && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Representante</dt>
                      <dd>{party.legalRepresentative}</dd>
                    </div>
                  )}
                  {party.address && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Dirección</dt>
                      <dd>{party.address}</dd>
                    </div>
                  )}
                  {party.email && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Email</dt>
                      <dd>{party.email}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'Cláusulas' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Cláusulas</CardTitle>
            </CardHeader>
            <CardContent>
              {!analysisResults || analysisResults.length === 0 ? (
                <p className="text-sm text-muted-foreground">No se pudieron analizar las cláusulas del documento</p>
              ) : (
                <div className="space-y-4">
                  {analysisResults.map((result, i) => (
                    <div key={i} className="p-3 rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className={
                            result.risk === 'high'
                              ? 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400'
                              : result.risk === 'medium'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400'
                              : 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400'
                          }
                        >
                          Riesgo: {result.risk === 'high' ? 'Alto' : result.risk === 'medium' ? 'Medio' : 'Bajo'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">{result.category}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{result.clauseText}</p>
                      {result.recommendations.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-semibold mb-1">Recomendaciones:</p>
                          <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                            {result.recommendations.map((rec: string, j: number) => (
                              <li key={j}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
