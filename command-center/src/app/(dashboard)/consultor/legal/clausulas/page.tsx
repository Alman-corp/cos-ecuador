'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, Shield, CheckCircle, BookOpen, Search, ArrowRight, Copy, RefreshCw, Gavel } from 'lucide-react'
import { analyzeClause, getClausesByCategory } from '@/lib/legal/clause-library'
import type { ClauseAnalysis, ClauseCategory } from '@/lib/legal/contract-types'

const categoryOptions: { value: ClauseCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'termination', label: 'Terminación' },
  { value: 'confidentiality', label: 'Confidencialidad' },
  { value: 'liability', label: 'Responsabilidad' },
  { value: 'payment', label: 'Pago' },
  { value: 'penalty', label: 'Penalidad' },
  { value: 'jurisdiction', label: 'Jurisdicción' },
  { value: 'force_majeure', label: 'Fuerza Mayor' },
  { value: 'non_compete', label: 'No Competencia' },
  { value: 'intellectual_property', label: 'Propiedad Intelectual' },
  { value: 'warranty', label: 'Garantía' },
  { value: 'indemnity', label: 'Indemnidad' },
  { value: 'other', label: 'Otras' },
]

const riskLabels: Record<string, string> = {
  low: 'Bajo',
  medium: 'Medio',
  high: 'Alto',
}

const riskColors: Record<string, string> = {
  low: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950/30 dark:text-yellow-400',
  high: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-400',
}

const sampleClauses = [
  'Cualquiera de las partes podrá dar por terminado el presente contrato de forma unilateral sin expresión de causa, mediante notificación escrita con 15 días de anticipación.',
  'La Parte Receptora se obliga a mantener absoluta confidencialidad sobre toda la información divulgada, por un período de 5 años desde la terminación del contrato.',
  'La responsabilidad total de una parte frente a la otra, por cualquier concepto derivado del presente contrato, se limita al valor total de los honorarios pagados.',
  'En caso de mora en el pago, se aplicará un interés del 5% mensual sobre el valor adeudado.',
  'Las partes se someten a la jurisdicción y competencia de los jueces y tribunales de la ciudad de Quito, Ecuador.',
]

export default function ClausulasPage() {
  const [clauseText, setClauseText] = useState('')
  const [analysis, setAnalysis] = useState<ClauseAnalysis | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ClauseCategory | 'all'>('all')
  const [comparisonTexts, setComparisonTexts] = useState<string[]>(['', ''])

  const libraryClauses = useMemo(() => {
    if (selectedCategory === 'all') return getClausesByCategory('termination')
    return getClausesByCategory(selectedCategory)
  }, [selectedCategory])

  const filteredLibrary = useMemo(() => {
    if (selectedCategory === 'all') return getClausesByCategory('termination')
    return getClausesByCategory(selectedCategory)
  }, [selectedCategory])

  const libraryAll = useMemo(() => {
    const cats: ClauseCategory[] = ['termination', 'confidentiality', 'liability', 'payment', 'penalty', 'jurisdiction', 'force_majeure', 'non_compete', 'intellectual_property', 'warranty', 'indemnity', 'other']
    return cats.flatMap((c) => getClausesByCategory(c))
  }, [])

  function handleAnalyze() {
    if (!clauseText.trim()) return
    const result = analyzeClause(clauseText.trim())
    setAnalysis(result)
  }

  function handleInsertLibraryClause(text: string) {
    setClauseText(text)
    setAnalysis(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function navigateToDetail(analysis: ClauseAnalysis) {
    setAnalysis(analysis)
  }

  const searchedLibrary = useMemo(() => {
    if (!searchQuery) return libraryAll
    const q = searchQuery.toLowerCase()
    return libraryAll.filter(
      (c) =>
        c.text.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.recommendations.some((r) => r.toLowerCase().includes(q))
    )
  }, [searchQuery, libraryAll])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Gavel className="h-8 w-8" />
          Analizador de Cláusulas
        </h1>
        <p className="text-muted-foreground mt-1">
          Analice cláusulas contractuales, evalúe riesgos y verifique cumplimiento normativo ecuatoriano
        </p>
      </div>

      <Tabs defaultValue="analyzer" className="space-y-6">
        <TabsList>
          <TabsTrigger value="analyzer">Analizador</TabsTrigger>
          <TabsTrigger value="library">Biblioteca de Cláusulas</TabsTrigger>
          <TabsTrigger value="compare">Comparación</TabsTrigger>
        </TabsList>

        <TabsContent value="analyzer" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Ingrese la Cláusula</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <textarea
                    value={clauseText}
                    onChange={(e) => setClauseText(e.target.value)}
                    placeholder="Pegue el texto de la cláusula aquí para analizar su riesgo y cumplimiento normativo..."
                    className="w-full h-40 p-3 rounded-lg border border-input bg-transparent text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleAnalyze} disabled={!clauseText.trim()}>
                      <Shield className="h-4 w-4 mr-2" /> Analizar Cláusula
                    </Button>
                    <Button variant="outline" onClick={() => { setClauseText(''); setAnalysis(null) }}>
                      <RefreshCw className="h-4 w-4 mr-2" /> Limpiar
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">Textos de ejemplo:</p>
                    {sampleClauses.map((text, i) => (
                      <button
                        key={i}
                        onClick={() => { setClauseText(text); setAnalysis(null) }}
                        className="text-xs text-left w-full p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground line-clamp-1"
                      >
                        {text.slice(0, 80)}...
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              {analysis ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Resultado del Análisis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={riskColors[analysis.risk]} variant="outline">
                        {analysis.risk === 'high' ? <AlertTriangle className="h-3 w-3 mr-1" /> : analysis.risk === 'medium' ? <AlertTriangle className="h-3 w-3 mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                        Riesgo: {riskLabels[analysis.risk]}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {analysis.category}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-xs font-semibold mb-1">Cláusula analizada:</p>
                      <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">{analysis.clauseText}</p>
                    </div>

                    {analysis.recommendations.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-1">Recomendaciones:</p>
                        <ul className="space-y-1">
                          {analysis.recommendations.map((rec, i) => (
                            <li key={i} className="text-xs flex items-start gap-2 p-1.5 rounded bg-blue-50 dark:bg-blue-950/30">
                              <CheckCircle className="h-3 w-3 text-blue-600 shrink-0 mt-0.5" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysis.compliance.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-1">Verificación de Cumplimiento:</p>
                        <div className="space-y-1">
                          {analysis.compliance.map((c, i) => (
                            <div
                              key={i}
                              className={`flex items-start gap-2 p-2 rounded text-xs ${
                                c.compliant
                                  ? 'bg-green-50 dark:bg-green-950/30'
                                  : 'bg-red-50 dark:bg-red-950/30'
                              }`}
                            >
                              {c.compliant ? (
                                <CheckCircle className="h-3 w-3 text-green-600 shrink-0 mt-0.5" />
                              ) : (
                                <AlertTriangle className="h-3 w-3 text-red-600 shrink-0 mt-0.5" />
                              )}
                              <div>
                                <p className="font-medium">{c.regulation}</p>
                                <p className="text-muted-foreground">{c.description}</p>
                                {c.recommendation && (
                                  <p className="text-yellow-700 dark:text-yellow-400 mt-0.5">{c.recommendation}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(
                        `Análisis de Cláusula\nRiesgo: ${riskLabels[analysis.risk]}\nCategoría: ${analysis.category}\nRecomendaciones:\n${analysis.recommendations.map(r => `- ${r}`).join('\n')}`
                      )}
                    >
                      <Copy className="h-3 w-3 mr-1" /> Copiar Resultado
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Resultado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                      <Search className="h-12 w-12 mb-3 opacity-30" />
                      <p className="text-sm">Ingrese una cláusula y presione</p>
                      <p className="text-sm font-medium">&quot;Analizar Cláusula&quot;</p>
                      <p className="text-xs mt-2">para ver el análisis de riesgo y cumplimiento</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="library" className="space-y-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar cláusulas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-9 rounded-lg border border-input bg-transparent text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/50"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {categoryOptions.map((opt) => (
                <Button
                  key={opt.value}
                  variant={selectedCategory === opt.value ? 'default' : 'outline'}
                  size="xs"
                  onClick={() => { setSelectedCategory(opt.value); setSearchQuery('') }}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(searchQuery ? searchedLibrary : libraryAll).length === 0 ? (
              <div className="col-span-2 text-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No se encontraron cláusulas</p>
              </div>
            ) : (
              (searchQuery ? searchedLibrary : libraryAll).map((clause, i) => (
                <Card key={clause.id || i} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        <Badge className={riskColors[clause.risk]} variant="outline" style={{ fontSize: '10px' }}>
                          {riskLabels[clause.risk]}
                        </Badge>
                        <Badge variant="outline" style={{ fontSize: '10px' }}>
                          {clause.category}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleInsertLibraryClause(clause.text)}
                        title="Usar esta cláusula"
                      >
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground line-clamp-3 mb-2">{clause.text}</p>
                    <div className="flex gap-1 flex-wrap">
                      {clause.regulations.slice(0, 2).map((reg, j) => (
                        <span key={j} className="text-[10px] px-1 py-0.5 rounded bg-muted">{reg}</span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="compare" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[0, 1].map((idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-sm">Cláusula {idx + 1}</CardTitle>
                </CardHeader>
                <CardContent>
                  <textarea
                    value={comparisonTexts[idx]}
                    onChange={(e) => {
                      const next = [...comparisonTexts]
                      next[idx] = e.target.value
                      setComparisonTexts(next)
                    }}
                    placeholder={`Pegue la cláusula ${idx + 1} aquí...`}
                    className="w-full h-40 p-3 rounded-lg border border-input bg-transparent text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  {comparisonTexts[idx].trim() && (
                    <div className="mt-2">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          const result = analyzeClause(comparisonTexts[idx].trim())
                          alert(
                            `Riesgo: ${riskLabels[result.risk]}\nCategoría: ${result.category}\n\nRecomendaciones:\n${result.recommendations.join('\n')}`
                          )
                        }}
                      >
                        <Shield className="h-3 w-3 mr-1" /> Analizar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {comparisonTexts[0].trim() && comparisonTexts[1].trim() && (
            <Card>
              <CardHeader>
                <CardTitle>Comparación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold mb-2">Cláusula 1</p>
                    <div className="bg-muted/30 p-3 rounded text-sm whitespace-pre-wrap font-serif">
                      {comparisonTexts[0]}
                    </div>
                    {(() => {
                      const r1 = analyzeClause(comparisonTexts[0].trim())
                      return (
                        <div className="mt-2 space-y-1">
                          <Badge className={riskColors[r1.risk]} variant="outline">
                            Riesgo: {riskLabels[r1.risk]}
                          </Badge>
                          <p className="text-xs text-muted-foreground">Categoría: {r1.category}</p>
                        </div>
                      )
                    })()}
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-2">Cláusula 2</p>
                    <div className="bg-muted/30 p-3 rounded text-sm whitespace-pre-wrap font-serif">
                      {comparisonTexts[1]}
                    </div>
                    {(() => {
                      const r2 = analyzeClause(comparisonTexts[1].trim())
                      return (
                        <div className="mt-2 space-y-1">
                          <Badge className={riskColors[r2.risk]} variant="outline">
                            Riesgo: {riskLabels[r2.risk]}
                          </Badge>
                          <p className="text-xs text-muted-foreground">Categoría: {r2.category}</p>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
