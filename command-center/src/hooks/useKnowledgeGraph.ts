"use client"

import { useState, useCallback, useMemo } from "react"
import { getKnowledgeGraph, getEntityConnections, searchGraph, findEntity, type KGEntity } from "@/lib/knowledge-graph"

export function useKnowledgeGraph() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const fullGraph = useMemo(() => getKnowledgeGraph(), [])

  const displayGraph = useMemo(() => {
    if (!searchQuery.trim()) return fullGraph
    return searchGraph(searchQuery)
  }, [fullGraph, searchQuery])

  const selectedEntity = useMemo(() => {
    if (!selectedId) return null
    return findEntity(selectedId) ?? null
  }, [selectedId])

  const connections = useMemo(() => {
    if (!selectedId) return null
    return getEntityConnections(selectedId)
  }, [selectedId])

  const selectEntity = useCallback((id: string | null) => {
    setSelectedId(id)
  }, [])

  const search = useCallback((q: string) => {
    setSearchQuery(q)
    if (q.trim()) setSelectedId(null)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedId(null)
  }, [])

  return {
    graph: displayGraph,
    selectedEntity,
    connections,
    selectedId,
    searchQuery,
    selectEntity,
    search,
    clearSelection,
  }
}
