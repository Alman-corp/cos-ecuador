'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Search, FileText, ArrowLeft, Check, Save, Loader2, Eye, Download } from 'lucide-react'
import type { ContractTemplate, DocumentTemplate } from '@/lib/legal/contract-types'
import { getTemplate, getAllTemplates } from '@/lib/legal/template-engine'
import { renderTemplate } from '@/lib/legal/template-engine'
import { createContract } from '@/lib/legal/legal-service'

const categoryColors: Record<string, string> = {
  services: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  confidentiality: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  rental: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  sale: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  labor: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
  corporate: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  civil: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  commercial: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  partnership: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
  consulting: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  supplier: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}

const categoryLabels: Record<string, string> = {
  services: 'Servicios',
  confidentiality: 'Confidencialidad',
  rental: 'Arrendamiento',
  sale: 'Compraventa',
  labor: 'Laboral',
  corporate: 'Corporativo',
  civil: 'Civil',
  commercial: 'Comercial',
  partnership: 'Sociedad',
  consulting: 'Consultoría',
  supplier: 'Proveedores',
  other: 'Otros',
}

export default function ContratosPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<DocumentTemplate | null>(null)
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [renderedContent, setRenderedContent] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const templates = useMemo(() => getAllTemplates(), [])

  const categories = useMemo(() => {
    const cats = new Set(templates.map((t) => t.category))
    return ['all', ...Array.from(cats)]
  }, [templates])

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchesSearch =
        !searchQuery ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesCategory = activeCategory === 'all' || t.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [templates, searchQuery, activeCategory])

  const selectedTemplate = selectedTemplateId ? getTemplate(selectedTemplateId) : null

  function handleSelectTemplate(id: DocumentTemplate) {
    setSelectedTemplateId(id)
    const tmpl = getTemplate(id)
    const defaults: Record<string, string> = {}
    tmpl.variables.forEach((v) => {
      if (v.defaultValue) defaults[v.name] = v.defaultValue
    })
    setVariables(defaults)
    setRenderedContent(null)
    setSavedMessage(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleVariableChange(name: string, value: string) {
    setVariables((prev) => ({ ...prev, [name]: value }))
  }

  function handleGenerate() {
    if (!selectedTemplateId) return
    setIsGenerating(true)
    setTimeout(() => {
      try {
        const { content, title } = renderTemplate(selectedTemplateId!, variables)
        const fullContent = `${title}\n\n${content}`
        setRenderedContent(fullContent)
        const parties = [
          { name: variables.contratante_nombre || variables.cliente || variables.arrendador || variables.comprador || variables.empleador || variables.franquiciante || variables.cedente || variables.parte_reveladora || variables.prestamista || variables.socio1 || variables.mandante || 'Parte A', role: 'issuer' as const, documentType: 'ruc' as const, documentNumber: variables.contratante_cedula || variables.cliente_ruc || variables.arrendador_cedula || variables.comprador_cedula || variables.empleador_ruc || variables.franquiciante_ruc || variables.cedente_cedula || variables.parte_reveladora_ruc || variables.prestamista_cedula || variables.socio1_cedula || variables.mandante_cedula || '0000000000' },
          { name: variables.profesional_nombre || variables.consultor || variables.arrendatario || variables.vendedor || variables.trabajador || variables.franquiciatario || variables.cesionario || variables.parte_receptora || variables.prestatario || variables.socio2 || variables.apoderado || 'Parte B', role: 'recipient' as const, documentType: 'cedula' as const, documentNumber: variables.profesional_cedula || variables.consultor_ruc || variables.arrendatario_cedula || variables.vendedor_cedula || variables.trabajador_cedula || variables.franquiciatario_cedula || variables.cesionario_cedula || variables.parte_receptora_ruc || variables.prestatario_cedula || variables.socio2_cedula || variables.apoderado_cedula || '0000000000' },
        ]
        const contract = createContract(selectedTemplateId!, variables, parties)
        setSavedMessage(`Contrato guardado como borrador · ID: ${contract.id}`)
      } catch (e) {
        setRenderedContent('Error al generar el contrato. Verifique las variables ingresadas.')
      }
      setIsGenerating(false)
    }, 600)
  }

  if (selectedTemplate) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => { setSelectedTemplateId(null); setRenderedContent(null); setSavedMessage(null) }}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{selectedTemplate.name}</h1>
            <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
          </div>
        </div>

        {!renderedContent ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Completar Variables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedTemplate.variables.map((v) => (
                    <div key={v.id}>
                      <Label htmlFor={v.name} className="flex items-center gap-1">
                        {v.label}
                        {v.required && <span className="text-red-500">*</span>}
                        {v.helpText && (
                          <span className="text-xs text-muted-foreground ml-1">({v.helpText})</span>
                        )}
                      </Label>
                      {v.type === 'boolean' ? (
                        <select
                          id={v.name}
                          value={variables[v.name] || 'false'}
                          onChange={(e) => handleVariableChange(v.name, e.target.value)}
                          className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm mt-1"
                        >
                          <option value="true">Sí</option>
                          <option value="false">No</option>
                        </select>
                      ) : v.type === 'select' && v.options ? (
                        <select
                          id={v.name}
                          value={variables[v.name] || ''}
                          onChange={(e) => handleVariableChange(v.name, e.target.value)}
                          className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm mt-1"
                        >
                          <option value="">Seleccionar...</option>
                          {v.options.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          id={v.name}
                          type={v.type === 'number' || v.type === 'money' ? 'text' : v.type === 'date' ? 'date' : 'text'}
                          placeholder={v.placeholder || `Ingrese ${v.label.toLowerCase()}`}
                          value={variables[v.name] || ''}
                          onChange={(e) => handleVariableChange(v.name, e.target.value)}
                          className="mt-1"
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-2">
                  <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
                    {isGenerating ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generando...</>
                    ) : (
                      <><FileText className="h-4 w-4 mr-2" /> Generar Contrato</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vista Previa</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Complete las variables y presione &quot;Generar Contrato&quot; para ver el documento completo.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {savedMessage && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-sm text-green-800 dark:text-green-400">
                <Check className="h-4 w-4" />
                {savedMessage}
              </div>
            )}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Documento Generado</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    navigator.clipboard.writeText(renderedContent)
                    setSavedMessage('Contenido copiado al portapapeles')
                    setTimeout(() => setSavedMessage(null), 3000)
                  }}>
                    <Eye className="h-4 w-4 mr-1" /> Copiar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    const blob = new Blob([renderedContent], { type: 'text/plain;charset=utf-8' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `${selectedTemplate.name.replace(/\s+/g, '_')}.txt`
                    a.click()
                    URL.revokeObjectURL(url)
                  }}>
                    <Download className="h-4 w-4 mr-1" /> Exportar TXT
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 rounded-lg p-4 max-h-[600px] overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap font-serif leading-relaxed">
                    {renderedContent}
                  </pre>
                </div>
              </CardContent>
            </Card>
            <div className="flex gap-2">
              <Button onClick={() => { setRenderedContent(null); setSavedMessage(null) }}>
                <FileText className="h-4 w-4 mr-2" /> Modificar Variables
              </Button>
              <Button variant="outline" onClick={() => { setSelectedTemplateId(null); setRenderedContent(null); setSavedMessage(null) }}>
                Nuevo Contrato
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8" />
          Plantillas de Contratos
        </h1>
        <p className="text-muted-foreground mt-1">
          Seleccione una plantilla para generar un nuevo contrato
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar plantillas por nombre, categoría o etiqueta..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={activeCategory === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory(cat)}
          >
            {cat === 'all' ? 'Todas' : categoryLabels[cat] || cat}
          </Button>
        ))}
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg">No se encontraron plantillas</p>
          <p className="text-sm">Intente con otros términos de búsqueda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((t) => (
            <Card
              key={t.id}
              className="hover:shadow-lg transition-all cursor-pointer hover:border-primary/50"
              onClick={() => handleSelectTemplate(t.id as DocumentTemplate)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm leading-snug">{t.name}</CardTitle>
                  <Badge className={`shrink-0 ml-2 ${categoryColors[t.category] || categoryColors.other}`} variant="outline">
                    {categoryLabels[t.category] || t.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                  {t.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="px-1.5 py-0.5 rounded bg-muted">{t.language === 'es' ? 'ES' : 'EN'}</span>
                  <span>v{t.version}</span>
                  {t.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="px-1.5 py-0.5 rounded bg-muted/50">{tag}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
