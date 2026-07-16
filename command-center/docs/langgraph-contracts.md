# LangGraph Agent Contracts — COS

> Generado por llm-engineer el 2026-07-11
>
> Define los 10 agentes del sistema multi-agente con entradas, salidas, engine determinístico y herramientas.

---

## 1. ResearchAgent

| Campo | Valor |
|-------|-------|
| **Nombre** | ResearchAgent |
| **Propósito** | Investigación de mercado, búsqueda de comparables, análisis sectorial y detección de tendencias |
| **Input** | `{ query: string; sector?: string; market?: string; depth?: "quick" \| "deep" }` |
| **Output** | `{ findings: ResearchFinding[]; sources: Source[]; summary: string; confidence: number }` |
| **Engine determinístico** | `self-rag.ts` (decisión de retrieval), `query-understanding.ts` (expansión HyDE/multi-query), `hybrid-search.ts` (BM25+vectorial) |
| **Herramientas** | `search_peers` (tools.ts), `query_financials` (tools.ts), `calculate_ratio` (tools.ts) |
| **Notas** | Usa graph-rag para navegación 2-hop de entidades. |

---

## 2. AnalysisAgent

| Campo | Valor |
|-------|-------|
| **Nombre** | AnalysisAgent |
| **Propósito** | Análisis financiero fundamental: ratios, tendencias, márgenes, flujo de caja, detección de riesgos |
| **Input** | `{ companyId: string; statements: FinancialStatement[]; metrics: string[]; period: string }` |
| **Output** | `{ ratios: Record<string, number>; trends: TrendAnalysis[]; risks: RiskFlag[]; narrative: string }` |
| **Engine determinístico** | `tools.ts` (calculate_ratio, query_financials), `insight-engine.ts` (z-scores, drivers, hallazgos) |
| **Herramientas** | `query_financials`, `calculate_ratio`, `search_peers` |
| **Notas** | Output en español con formato de monedas y porcentajes. |

---

## 3. DocumentAgent

| Campo | Valor |
|-------|-------|
| **Nombre** | DocumentAgent |
| **Propósito** | Procesamiento de documentos multi-modal: extracción de texto, chunking semántico, citas estructuradas |
| **Input** | `{ files: FileUpload[]; sourceType: "10-K" \| "transcript" \| "report" \| "csv" \| "image" }` |
| **Output** | `{ chunks: SemanticChunk[]; citations: Citation[]; summary: string; language: "es" \| "en" \| "pt" }` |
| **Engine determinístico** | `semantic-chunking.ts` (chunking por tópico), `citation-isd.ts` (base de citas), `multilingual-embeddings.ts` (detección de idioma) |
| **Herramientas** | `multi-modal.ts` (procesamiento de archivos) |
| **Notas** | OCR y parsing PDF real pendientes (simulado actualmente). |

---

## 4. TaxAgent

| Campo | Valor |
|-------|-------|
| **Nombre** | TaxAgent |
| **Propósito** | Cálculos tributarios ecuatorianos: IVA, Impuesto a la Renta, retenciones, calendario fiscal, validación RUC |
| **Input** | `{ profile: TaxProfile; period: string; regime: "sociedad" \| "persona"; ruc?: string }` |
| **Output** | `{ obligations: TaxObligation[]; analysis: TaxAnalysis; risks: TaxRisk[]; calendar: TaxCalendar[] }` |
| **Engine determinístico** | `tax-engine/calculator.ts` (cálculos), `tax-engine/rates.ts` (tasas), `tax-engine/calendar.ts` (calendario), `tax-engine/validators.ts` (RUC), `tax-engine/integration/dd-adapter.ts` (riesgos) |
| **Herramientas** | Ninguna (toda la lógica es determinística) |
| **Notas** | Tasas basadas en normativa SRI ecuatoriana. Verificar vigencia periódicamente. |

---

## 5. ComplianceAgent

| Campo | Valor |
|-------|-------|
| **Nombre** | ComplianceAgent |
| **Propósito** | Aplicación de reglas constitucionales: no investment advice, no guarantees, data attribution, uncertainty disclaimers, no confidential info |
| **Input** | `{ content: string; context: ConversationContext; severity?: "info" \| "warn" \| "block" }` |
| **Output** | `{ sanitized: string; violations: ComplianceViolation[]; blocked: boolean; disclaimers: string[] }` |
| **Engine determinístico** | `constitutional.ts` (5 reglas con severidad y sanitización automática) |
| **Herramientas** | Ninguna (post-processing del output) |
| **Notas** | Se ejecuta como paso final del pipeline de orquestación. Crítico para producción. |

---

## 6. MarketAgent

| Campo | Valor |
|-------|-------|
| **Nombre** | MarketAgent |
| **Propósito** | Análisis de mercado: indicadores macro, comparación sectorial, benchmarking, y detección de oportunidades |
| **Input** | `{ sector: string; region: string; indicators?: string[]; timeframe: string }` |
| **Output** | `{ marketData: MarketIndicator[]; benchmarks: Benchmark[]; opportunities: Opportunity[]; alerts: Alert[] }` |
| **Engine determinístico** | `query-understanding.ts` (step-back prompting), `hybrid-search.ts` (búsqueda sectorial), `insight-engine.ts` (drivers y alertas) |
| **Herramientas** | `search_peers`, `query_financials` |
| **Notas** | Datos mock actualmente; integrar con APIs de mercado reales. |

---

## 7. ValuationAgent

| Campo | Valor |
|-------|-------|
| **Nombre** | ValuationAgent |
| **Propósito** | Valuación de empresas: DCF, múltiplos, análisis de escenarios, stress testing |
| **Input** | `{ companyId: string; financials: ProjectedFinancials; method: "dcf" \| "multiples" \| "both"; scenarios?: Scenario[] }` |
| **Output** | `{ valuation: ValuationResult; scenarios: ScenarioResult[]; sensitivity: SensitivityTable; recommendation: string }` |
| **Engine determinístico** | `tools.ts` (calculate_ratio para múltiplos), `insight-engine.ts` (z-scores, hallazgos) |
| **Herramientas** | `calculate_ratio`, `query_financials` |
| **Notas** | DCF simulation pendiente; actualmente usa herramientas mock. |

---

## 8. ReportAgent

| Campo | Valor |
|-------|-------|
| **Nombre** | ReportAgent |
| **Propósito** | Generación de reportes estructurados: narrativa financiera, dashboards ejecutivos, resúmenes de due diligence |
| **Input** | `{ sections: ReportSection[]; format: "executive" \| "detailed" \| "dashboard"; audience: "board" \| "management" \| "analyst" }` |
| **Output** | `{ report: string; kpiSummary: KPI[]; visualData: VisualizationData[]; exportFormats: string[] }` |
| **Engine determinístico** | `insight-engine.ts` (narrativa financiera), `prompts.ts` (template synthesizer) |
| **Herramientas** | Ninguna (usa templates de prompts + insight engine) |
| **Notas** | Output en español. Soporta exportación a PDF/CSV vía `multi-modal.ts`. |

---

## 9. ChatAgent

| Campo | Valor |
|-------|-------|
| **Nombre** | ChatAgent |
| **Propósito** | Interfaz conversacional con memoria por capas, soporte multi-turno, compresión de contexto |
| **Input** | `{ message: string; conversationId: string; userId: string; attachments?: FileUpload[] }` |
| **Output** | `{ reply: string; citations: Citation[]; memoryUpdated: boolean; tokenUsage: TokenUsage }` |
| **Engine determinístico** | `memory-layers.ts` (working/episodic/semantic/procedural), `context-compaction.ts` (compresión), `model-router.ts` (routing a tier), `self-rag.ts` (retrieval on demand) |
| **Herramientas** | `query_financials`, `calculate_ratio`, `search_peers` (vía tools.ts) |
| **Notas** | Integra con `useChatMemory.ts` hook. Usa `circuit-breaker.ts` para protección de APIs. |

---

## 10. OrchestratorAgent

| Campo | Valor |
|-------|-------|
| **Nombre** | OrchestratorAgent |
| **Propósito** | Orquestación del pipeline completo: router → planner → specialists → writer → critique → revision → compaction |
| **Input** | `{ userQuery: string; context: ConversationContext; availableAgents: AgentRegistry; options?: OrchestratorOptions }` |
| **Output** | `{ finalResponse: string; agentTrace: AgentCall[]; totalTokens: number; qualityScore: number; citations: Citation[] }` |
| **Engine determinístico** | `orchestrator.ts` (pipeline completo), `model-router.ts` (asignación de tier), `self-critique.ts` (evaluación 6 dimensiones), `constitutional.ts` (post-processing), `context-compaction.ts` (compresión final) |
| **Herramientas** | Todas las herramientas (delega a agentes especializados) |
| **Notas** | Núcleo del sistema. Ejecuta sub-agentes en secuencia: ResearchAgent → AnalysisAgent → ... → ReportAgent → ComplianceAgent. Actualmente simulado. |

---

## Resumen de Dependencias entre Agentes

```
OrchestratorAgent
  ├── ResearchAgent → self-rag, query-understanding, hybrid-search, graph-rag
  ├── AnalysisAgent → tools (calculate_ratio), insight-engine
  ├── DocumentAgent → semantic-chunking, citation-isd, multilingual-embeddings, multi-modal
  ├── TaxAgent → tax-engine (calculator, rates, calendar, validators, dd-adapter)
  ├── ComplianceAgent → constitutional
  ├── MarketAgent → query-understanding, hybrid-search, insight-engine
  ├── ValuationAgent → tools, insight-engine
  ├── ReportAgent → insight-engine, prompts
  └── ChatAgent → memory-layers, context-compaction, model-router, self-rag, circuit-breaker

Cross-cutting:
  - Todos los agentes → openai-client (LLM calls)
  - Orchestrator → self-critique (quality gate post all agents)
  - Todos los agentes → model-router (tier assignment)
```
