'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, FileText, Grid3X3, List, Eye, Plus, Tag, ArrowUpDown } from 'lucide-react'
import type { ContractTemplate, TemplateVariable } from '@/lib/legal/contract-types'
import { getAllTemplates } from '@/lib/legal/template-engine'

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

export default function PlantillasPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'updated'>('name')

  const templates = useMemo(() => getAllTemplates(), [])

  const categories = useMemo(() => {
    const cats = new Set(templates.map((t) => t.category))
    return ['all', ...Array.from(cats)]
  }, [templates])

  const filteredTemplates = useMemo(() => {
    let result = templates.filter((t) => {
      const matchesSearch =
        !searchQuery ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory
      return matchesSearch && matchesCategory
    })

    result.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'category') return a.category.localeCompare(b.category)
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

    return result
  }, [templates, searchQuery, selectedCategory, sortBy])

  if (selectedTemplate) {
    const t = selectedTemplate
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedTemplate(null)}>
            <ArrowUpDown className="h-5 w-5 rotate-45" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t.name}</h1>
            <p className="text-sm text-muted-foreground">{t.description}</p>
          </div>
          <Link href={`/consultor/legal/contratos`}>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> Usar Plantilla
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Variables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {t.variables.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Esta plantilla no tiene variables</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-2 font-medium">Variable</th>
                          <th className="pb-2 font-medium">Tipo</th>
                          <th className="pb-2 font-medium">Requerido</th>
                          <th className="pb-2 font-medium">Valor Defecto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {t.variables.map((v) => (
                          <tr key={v.id} className="border-b last:border-0">
                            <td className="py-2 pr-2">
                              <div>
                                <p className="font-medium">{v.label}</p>
                                <p className="text-xs text-muted-foreground">{v.name}</p>
                              </div>
                            </td>
                            <td className="py-2 pr-2">
                              <Badge variant="outline" className="text-[10px]">{v.type}</Badge>
                            </td>
                            <td className="py-2 pr-2">
                              {v.required ? (
                                <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400">Sí</Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">No</span>
                              )}
                            </td>
                            <td className="py-2 text-xs text-muted-foreground">{v.defaultValue || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Secciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {t.sections.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay secciones definidas</p>
                  ) : (
                    [...t.sections]
                      .sort((a, b) => a.order - b.order)
                      .map((s) => (
                        <div key={s.id} className="p-2 rounded-lg border text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-xs">{s.order}. {s.title}</span>
                            {s.optional && (
                              <Badge variant="outline" className="text-[10px]">Opcional</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{s.content}</p>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Detalles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Categoría</span>
                  <Badge className={categoryColors[t.category]} variant="outline">
                    {categoryLabels[t.category] || t.category}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Versión</span>
                  <span>v{t.version}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Idioma</span>
                  <span>{t.language === 'es' ? 'Español' : 'Inglés'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Jurisdicción</span>
                  <span>{t.jurisdiction}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Creado</span>
                  <span className="text-xs">{new Date(t.createdAt).toLocaleDateString('es-EC')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Actualizado</span>
                  <span className="text-xs">{new Date(t.updatedAt).toLocaleDateString('es-EC')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Variables</span>
                  <span>{t.variables.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Secciones</span>
                  <span>{t.sections.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Etiquetas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-1 flex-wrap">
                  {t.tags.length === 0 ? (
                    <span className="text-xs text-muted-foreground">Sin etiquetas</span>
                  ) : (
                    t.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px]">
                        <Tag className="h-2.5 w-2.5 mr-1" />
                        {tag}
                      </Badge>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Gestión de Plantillas
          </h1>
          <p className="text-muted-foreground mt-1">
            {templates.length} plantillas disponibles para generación de contratos
          </p>
        </div>
        <div className="flex gap-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, descripción, categoría o etiquetas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          <Button
            variant={sortBy === 'name' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setSortBy('name')}
          >
            <ArrowUpDown className="h-3 w-3 mr-1" /> Nombre
          </Button>
          <Button
            variant={sortBy === 'category' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setSortBy('category')}
          >
            <ArrowUpDown className="h-3 w-3 mr-1" /> Categoría
          </Button>
          <Button
            variant={sortBy === 'updated' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setSortBy('updated')}
          >
            <ArrowUpDown className="h-3 w-3 mr-1" /> Actualizado
          </Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
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
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((t) => (
            <Card
              key={t.id}
              className="hover:shadow-lg transition-all cursor-pointer hover:border-primary/50"
              onClick={() => setSelectedTemplate(t)}
            >
              <CardHeader className="pb-2">
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
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <span className="px-1.5 py-0.5 rounded bg-muted">{t.language === 'es' ? 'ES' : 'EN'}</span>
                  <span>v{t.version}</span>
                  <Badge variant="outline" className="text-[10px]">{t.variables.length} vars</Badge>
                  <Badge variant="outline" className="text-[10px]">{t.sections.length} secc.</Badge>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {t.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50">{tag}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredTemplates.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-4 p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedTemplate(t)}
                >
                  <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={categoryColors[t.category]} variant="outline">
                      {categoryLabels[t.category] || t.category}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">v{t.version}</Badge>
                    <Link href="/consultor/legal/contratos">
                      <Button variant="ghost" size="icon-xs" type="button">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); setSelectedTemplate(t) }}>
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
