"use client"

import { useState, useEffect } from "react"
import { hybridSearch, addDocument, getDocuments, type SearchResult } from "@/lib/hybrid-search"
import { crossEncoderRerank, explainRerank } from "@/lib/reranking"
import { semanticChunk, mergeChunksByTopic } from "@/lib/semantic-chunking"
import { searchWithDrillDown, getHierarchicalTree, getHierarchicalPath } from "@/lib/hierarchical-index"
import { expandQuery, getQueryStrategy, executeMultiQuery } from "@/lib/query-understanding"
import { shouldRetrieve } from "@/lib/self-rag"
import { graphSearch, getEntityConnections, type GraphEntity, type GraphRelation } from "@/lib/graph-rag"
import { findCitations, formatCitation, getCitationStats, type IsdCitation } from "@/lib/citation-isd"
import { getCachedResponse, setCachedResponse, getCacheStats, invalidateCache } from "@/lib/negative-cache"
import { searchMultilingual, detectLanguage, getMultilingualDocs, type MultilingualDocument, type Language } from "@/lib/multilingual-embeddings"

type Tab = "search" | "chunking" | "hierarchical" | "query" | "self-rag" | "graph" | "citations" | "cache" | "multilingual"

export default function RagPage() {
  const [tab, setTab] = useState<Tab>("search")
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [reranked, setReranked] = useState<SearchResult[]>([])
  const [showRerank, setShowRerank] = useState(true)

  const tabs: { id: Tab; label: string }[] = [
    { id: "search", label: "Hybrid Search" },
    { id: "chunking", label: "Semantic Chunking" },
    { id: "hierarchical", label: "Hierarchical Index" },
    { id: "query", label: "Query Understanding" },
    { id: "self-rag", label: "Self-RAG" },
    { id: "graph", label: "GraphRAG" },
    { id: "citations", label: "ISD Citations" },
    { id: "cache", label: "Negative Cache" },
    { id: "multilingual", label: "Multi-Language" },
  ]

  const handleSearch = () => {
    if (!query.trim()) return
    const cached = getCachedResponse(query)
    if (cached) { console.log("Cache hit:", cached) }

    const searchResults = hybridSearch(query, undefined, 5)
    setResults(searchResults)
    setReranked(crossEncoderRerank(query, searchResults, 3))
    setCachedResponse(query, JSON.stringify(searchResults))
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-50">RAG Playground</h1>
        <p className="mt-1 text-sm text-surface-400">
          Hybrid search · Reranking · GraphRAG · ISD Citations · Multi-language · Negative cache
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-accent-600/10 text-accent-400 ring-1 ring-accent-500/20"
                : "bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-surface-300"
            }`}>{t.label}</button>
        ))}
      </div>

      <div className="mb-6 flex gap-3">
        <input value={query} onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Buscar: EBITDA, DCF, margen, ingresos…"
          className="flex-1 rounded-lg border border-surface-700 bg-surface-900 px-4 py-2.5 text-sm text-surface-200 placeholder-surface-500 outline-none focus:ring-1 focus:ring-accent-500/50" />
        <button onClick={handleSearch} className="rounded-lg bg-accent-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-accent-500">
          Buscar
        </button>
      </div>

      {tab === "search" && <SearchTab query={query} results={results} reranked={reranked} showRerank={showRerank} setShowRerank={setShowRerank} />}
      {tab === "chunking" && <ChunkingTab />}
      {tab === "hierarchical" && <HierarchicalTab />}
      {tab === "query" && <QueryTab query={query} />}
      {tab === "self-rag" && <SelfRagTab query={query} />}
      {tab === "graph" && <GraphTab query={query} />}
      {tab === "citations" && <CitationsTab query={query} />}
      {tab === "cache" && <CacheTab />}
      {tab === "multilingual" && <MultilingualTab query={query} />}
    </div>
  )
}

function SearchTab({ query, results, reranked, showRerank, setShowRerank }: {
  query: string; results: SearchResult[]; reranked: SearchResult[]; showRerank: boolean; setShowRerank: (v: boolean) => void
}) {
  return (
    <div>
      <label className="mb-3 flex items-center gap-2 text-sm text-surface-400">
        <input type="checkbox" checked={showRerank} onChange={() => setShowRerank(!showRerank)} />
        Cross-encoder Reranking (Cohere Rerank sim)
      </label>

      {results.length === 0 && <p className="text-sm text-surface-500">Ingresa una consulta para ver resultados híbridos (BM25 + vector).</p>}

      <div className="space-y-3">
        {(showRerank ? reranked : results).map((r, i) => (
          <div key={`${r.documentId}-${i}`} className="rounded-xl border border-surface-700/50 bg-surface-900 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-surface-800 text-xs font-bold text-surface-400">{i + 1}</span>
                <p className="text-sm font-medium text-surface-200">{r.title}</p>
              </div>
              <span className="rounded bg-surface-800 px-2 py-0.5 text-xs font-mono text-surface-400">{(r.score * 100).toFixed(1)}%</span>
            </div>
            <p className="mt-2 text-xs text-surface-400">{r.content}</p>
            <div className="mt-2 flex items-center gap-2 text-[10px] text-surface-500">
              <span className="rounded bg-surface-800 px-1.5 py-0.5">{r.strategy}</span>
              {Object.entries(r.metadata).map(([k, v]) => (
                <span key={k} className="text-surface-600">{k}={v}</span>
              ))}
            </div>
            {showRerank && <p className="mt-1 text-[9px] text-surface-600">{explainRerank(query, r)}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

function ChunkingTab() {
  const sampleText = "Tesla reported Q4 2025 revenue of $25.4B, exceeding analyst estimates. EBITDA reached $4.2B with a margin of 16.5%, driven by operating leverage. Free cash flow was $2.1B. The energy storage business grew 85% YoY to $2.1B in revenue. Automotive segment margin improved to 19.8% from 18.5% in Q4 2024. SG&A expenses decreased to 6.9% of revenue from 8.2%. Cash position stands at $44.1B. The company delivered 495,000 vehicles in the quarter."
  const [text, setText] = useState(sampleText)

  const chunks = semanticChunk(text)
  const merged = mergeChunksByTopic(chunks)

  return (
    <div>
      <div className="mb-4">
        <label className="block text-xs font-medium text-surface-400 mb-1">Texto de ejemplo</label>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4}
          className="w-full rounded-lg border border-surface-700 bg-surface-900 px-3 py-2 text-xs text-surface-200" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="mb-2 text-xs font-medium text-surface-400">Chunks semánticos ({chunks.length})</p>
          <div className="space-y-2">
            {chunks.map((c) => (
              <div key={c.id} className="rounded-lg border border-surface-700/50 bg-surface-950 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded bg-accent-600/10 px-1.5 py-0.5 text-[9px] font-medium text-accent-400">{c.topic}</span>
                  <span className="text-[9px] text-surface-500">{c.tokens} tokens</span>
                </div>
                <p className="text-[10px] text-surface-400 line-clamp-2">{c.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-surface-400">Merge por tema ({merged.length})</p>
          <div className="space-y-2">
            {merged.map((c) => (
              <div key={c.id} className="rounded-lg border border-emerald-600/20 bg-emerald-600/5 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded bg-emerald-600/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-400">{c.topic}</span>
                  <span className="text-[9px] text-surface-500">{c.tokens} tokens</span>
                </div>
                <p className="text-[10px] text-surface-400 line-clamp-2">{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function HierarchicalTab() {
  const tree = getHierarchicalTree()
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const path = selectedNode ? getHierarchicalPath(selectedNode) : []

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="mb-2 text-xs font-medium text-surface-400">Árbol jerárquico (summary → detail → verbatim)</p>
        <div className="space-y-2">
          {tree.map((root) => (
            <NodeView key={root.id} node={root} depth={0} selectedNode={selectedNode} setSelectedNode={setSelectedNode} />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-surface-400">Path de navegación</p>
        {path.length > 0 ? (
          <div className="space-y-2">
            {path.map((n) => (
              <div key={n.id} className={`rounded-lg border p-3 ${
                n.level === "summary" ? "border-accent-600/30 bg-accent-600/5" :
                n.level === "detail" ? "border-surface-700/50 bg-surface-900" :
                "border-emerald-600/20 bg-emerald-600/5"
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded px-1.5 py-0.5 text-[9px] font-medium text-surface-400 uppercase">{n.level}</span>
                  <p className="text-xs font-medium text-surface-200">{n.title}</p>
                </div>
                <p className="text-[10px] text-surface-400">{n.content}</p>
                {n.metadata.source && <p className="mt-1 text-[9px] text-surface-500">{n.metadata.source} · p.{n.metadata.page} ¶{n.metadata.paragraph}</p>}
              </div>
            ))}
          </div>
        ) : <p className="text-xs text-surface-500">Selecciona un nodo para ver el drill-down</p>}
      </div>
    </div>
  )
}

function NodeView({ node, depth, selectedNode, setSelectedNode }: {
  node: import("@/lib/hierarchical-index").HierarchicalNode
  depth: number; selectedNode: string | null; setSelectedNode: (id: string) => void
}) {
  return (
    <div style={{ marginLeft: depth * 16 }}>
      <div
        onClick={() => setSelectedNode(node.id)}
        className={`cursor-pointer rounded-lg border p-2 mb-1 transition-colors ${
          selectedNode === node.id
            ? "border-accent-600/50 bg-accent-600/10"
            : "border-surface-700/50 bg-surface-950 hover:bg-surface-900"
        }`}>
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-medium uppercase text-surface-500">{node.level}</span>
          <p className="text-xs text-surface-300">{node.title}</p>
        </div>
        <p className="text-[9px] text-surface-500 line-clamp-1">{node.content}</p>
      </div>
      {node.children.map((child) => (
        <NodeView key={child.id} node={child} depth={depth + 1} selectedNode={selectedNode} setSelectedNode={setSelectedNode} />
      ))}
    </div>
  )
}

function QueryTab({ query }: { query: string }) {
  if (!query) return <p className="text-sm text-surface-500">Ingresa una consulta para ver expansión de query.</p>
  const expanded = expandQuery(query)
  const strategy = getQueryStrategy(query)

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-accent-600/20 bg-accent-600/5 p-4">
        <p className="text-xs font-medium text-accent-400 mb-2">Estrategia de query</p>
        <div className="flex gap-2">
          <span className="rounded bg-surface-800 px-2 py-1 text-[10px] text-surface-300">search: {strategy.shouldSearch ? "yes" : "no"}</span>
          <span className="rounded bg-surface-800 px-2 py-1 text-[10px] text-surface-300">expand: {strategy.expand ? "yes" : "no"}</span>
          <span className="rounded bg-surface-800 px-2 py-1 text-[10px] text-surface-300">depth: {strategy.depth}</span>
        </div>
      </div>

      <div className="rounded-xl border border-surface-700/50 bg-surface-900 p-4">
        <p className="text-xs font-medium text-surface-400 mb-2">HyDE (Hypothetical Document Embedding)</p>
        <p className="text-xs text-surface-300">{expanded.hyde}</p>
      </div>

      <div className="rounded-xl border border-surface-700/50 bg-surface-900 p-4">
        <p className="text-xs font-medium text-surface-400 mb-2">Multi-Query ({expanded.multiQueries.length} variaciones)</p>
        <div className="space-y-1">
          {expanded.multiQueries.map((q, i) => (
            <p key={i} className="text-xs text-surface-400">• {q}</p>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-surface-700/50 bg-surface-900 p-4">
        <p className="text-xs font-medium text-surface-400 mb-2">Step-back Question</p>
        <p className="text-xs text-surface-300">{expanded.stepBack}</p>
      </div>
    </div>
  )
}

function SelfRagTab({ query }: { query: string }) {
  if (!query) return <p className="text-sm text-surface-500">Ingresa una consulta para evaluar si necesita retrieval.</p>
  const decision = shouldRetrieve(query, [])

  return (
    <div className="rounded-xl border border-surface-700/50 bg-surface-900 p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${decision.needsSearch ? "bg-emerald-600/10" : "bg-amber-600/10"}`}>
          <span className={`text-lg ${decision.needsSearch ? "text-emerald-400" : "text-amber-400"}`}>
            {decision.needsSearch ? "✓" : "✕"}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium text-surface-200">
            {decision.needsSearch ? "Necesita retrieval" : "No necesita buscar"}
          </p>
          <p className="text-xs text-surface-500">Confianza: {(decision.confidence * 100).toFixed(0)}% · Depth: {decision.depth}</p>
        </div>
      </div>
      <p className="text-xs text-surface-400">Razón: {decision.reason}</p>
    </div>
  )
}

function GraphTab({ query }: { query: string }) {
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null)
  const [graphData, setGraphData] = useState<{ entities: GraphEntity[]; relations: GraphRelation[]; context: string } | null>(null)
  const [connections, setConnections] = useState<{ entities: GraphEntity[]; relations: GraphRelation[] } | null>(null)

  useEffect(() => {
    if (query) setGraphData(graphSearch(query))
  }, [query])

  useEffect(() => {
    if (selectedEntity) setConnections(getEntityConnections(selectedEntity))
  }, [selectedEntity])

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="mb-2 text-xs font-medium text-surface-400">Entidades y relaciones</p>
        {graphData && (
          <div className="space-y-2">
            {graphData.entities.map((e) => (
              <div key={e.id}
                onClick={() => setSelectedEntity(e.id)}
                className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                  selectedEntity === e.id ? "border-accent-600/50 bg-accent-600/10" : "border-surface-700/50 bg-surface-950 hover:bg-surface-900"
                }`}>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-surface-800 px-1.5 py-0.5 text-[9px] font-medium text-surface-300">{e.type}</span>
                  <p className="text-sm font-medium text-surface-200">{e.name}</p>
                </div>
                {Object.entries(e.properties).map(([k, v]) => (
                  <p key={k} className="text-[10px] text-surface-500">{k}: {v}</p>
                ))}
              </div>
            ))}
            <p className="mt-3 text-xs font-medium text-surface-500">Contexto gráfico</p>
            <pre className="rounded-lg bg-surface-950 p-3 text-[10px] text-surface-400 whitespace-pre-wrap">{graphData.context}</pre>
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-surface-400">Conexiones (2-hop)</p>
        {connections && (
          <div className="space-y-2">
            {connections.entities.map((e) => (
              <div key={e.id} className="rounded-lg border border-surface-700/50 bg-surface-950 p-2">
                <p className="text-xs font-medium text-surface-300">{e.name}</p>
                <div className="mt-1 space-y-1">
                  {connections.relations.filter((r) => r.sourceId === e.id || r.targetId === e.id).map((r, i) => (
                    <p key={i} className="text-[9px] text-surface-500">
                      {r.sourceId === e.id ? "→" : "←"} {r.relation} ({r.evidence})
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CitationsTab({ query }: { query: string }) {
  const citations = query ? findCitations(query) : []
  const stats = getCitationStats()

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="mb-2 text-xs font-medium text-surface-400">Citas ISD (archivo · página · ¶ · celda)</p>
        {citations.length === 0 && <p className="text-xs text-surface-500">Ingresa una consulta para buscar citas.</p>}
        <div className="space-y-2">
          {citations.map((c, i) => (
            <div key={i} className="rounded-xl border border-surface-700/50 bg-surface-900 p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="rounded bg-surface-800 px-1.5 py-0.5 text-[9px] font-medium text-surface-400 uppercase">{c.source}</span>
                <span className="text-[9px] text-surface-500">{(c.confidence * 100).toFixed(0)}% match</span>
              </div>
              <p className="text-xs text-surface-200 mb-1">{c.exactText}</p>
              <p className="text-[9px] font-mono text-surface-500">{formatCitation(c)}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-surface-400">Estadísticas</p>
        <div className="rounded-xl border border-surface-700/50 bg-surface-900 p-4 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-surface-400">Total citas</span>
            <span className="text-surface-200 font-mono">{stats.total}</span>
          </div>
          {Object.entries(stats.sources).map(([src, count]) => (
            <div key={src} className="flex justify-between text-xs">
              <span className="text-surface-400 capitalize">{src}</span>
              <span className="text-surface-200 font-mono">{count}</span>
            </div>
          ))}
          <div className="flex justify-between text-xs">
            <span className="text-surface-400">Confianza promedio</span>
            <span className="text-surface-200 font-mono">{(stats.avgConfidence * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function CacheTab() {
  const [stats, setStats] = useState(getCacheStats())
  const [cacheKey, setCacheKey] = useState("")
  const [cacheValue, setCacheValue] = useState("")

  const handleSet = () => {
    if (!cacheKey || !cacheValue) return
    setCachedResponse(cacheKey, cacheValue)
    setStats(getCacheStats())
    setCacheKey(""); setCacheValue("")
  }

  const handleInvalidate = () => {
    invalidateCache()
    setStats(getCacheStats())
  }

  return (
    <div>
      <div className="mb-4 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-surface-700/50 bg-surface-900 p-4">
          <p className="text-xs text-surface-400">Entradas en caché</p>
          <p className="text-2xl font-bold text-surface-50">{stats.size}</p>
        </div>
        <div className="rounded-xl border border-surface-700/50 bg-surface-900 p-4">
          <p className="text-xs text-surface-400">Hits totales</p>
          <p className="text-2xl font-bold text-surface-50">{stats.totalHits}</p>
        </div>
        <div className="rounded-xl border border-surface-700/50 bg-surface-900 p-4">
          <p className="text-xs text-surface-400">Hit rate</p>
          <p className="text-2xl font-bold text-surface-50">{stats.hitRate}%</p>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <input value={cacheKey} onChange={(e) => setCacheKey(e.target.value)} placeholder="Query" className="flex-1 rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-200" />
        <input value={cacheValue} onChange={(e) => setCacheValue(e.target.value)} placeholder="Response" className="flex-1 rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-200" />
        <button onClick={handleSet} disabled={!cacheKey || !cacheValue} className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-500 disabled:opacity-50">
          Set
        </button>
      </div>

      <button onClick={handleInvalidate} className="rounded-lg bg-red-600/10 px-4 py-2 text-sm text-red-400 hover:bg-red-600/20">
        Invalidar toda la caché
      </button>
    </div>
  )
}

function MultilingualTab({ query }: { query: string }) {
  const docs = getMultilingualDocs()
  const [targetLang, setTargetLang] = useState<Language>("en")
  const [results, setResults] = useState<MultilingualDocument[]>([])

  useEffect(() => {
    if (query) setResults(searchMultilingual(query, targetLang))
  }, [query, targetLang])

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <span className="text-xs text-surface-400">Target language:</span>
        {(["en", "es", "pt"] as Language[]).map((lang) => (
          <button key={lang} onClick={() => setTargetLang(lang)}
            className={`rounded-lg px-3 py-1 text-xs font-medium ${targetLang === lang ? "bg-accent-600/10 text-accent-400 ring-1 ring-accent-500/20" : "bg-surface-800 text-surface-400"}`}>
            {lang === "en" ? "English" : lang === "es" ? "Español" : "Português"}
          </button>
        ))}
        <span className="text-xs text-surface-500">
          Query lang: {detectLanguage(query || " ")}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="mb-2 text-xs font-medium text-surface-400">Documentos multilingüe ({docs.length})</p>
          <div className="space-y-2">
            {docs.map((d) => (
              <div key={d.id} className="rounded-lg border border-surface-700/50 bg-surface-950 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded bg-surface-800 px-1.5 py-0.5 text-[9px] font-medium text-surface-400 uppercase">{d.language}</span>
                </div>
                <p className="text-xs text-surface-300">{d.translation[targetLang]}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-surface-400">Resultados por similitud ({results.length})</p>
          <div className="space-y-2">
            {results.map((r, i) => (
              <div key={r.id} className="rounded-lg border border-accent-600/20 bg-accent-600/5 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded bg-surface-800 px-1.5 py-0.5 text-[9px] font-medium text-surface-400 uppercase">{r.language}</span>
                  <span className="text-[9px] text-surface-500">{((1 - i * 0.15) * 100).toFixed(0)}% match</span>
                </div>
                <p className="text-xs text-surface-300">{r.translation[targetLang]}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
