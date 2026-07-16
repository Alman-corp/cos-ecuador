# AI Migration Map — COS

> Generado por llm-engineer el 2026-07-11

---

## Recommended Package Structure

```
packages/
  ai-core/          # Orchestrator, model-router, prompts, self-critique, constitutional
  rag-pipeline/     # self-rag, query-understanding, hybrid-search, reranking, semantic-chunking, graph-rag, hierarchical-index, citation-isd, multilingual-embeddings, knowledge-graph
  eval-suite/       # eval-suite (both), evaluator runners
  openai-client/    # openai-client singleton
  context-engine/   # context-compaction, memory-layers
  tools-engine/     # tools, multi-modal
  tax-engine/       # tax-engine/* (all files)
  dd-engine/        # dd/commands, dd/schemas (moved), dd/actions
  observability/    # otel, synthetics, rum, slos, product-analytics
  infrastructure/   # env, secrets, rls, db/queries, sso, runbooks, audit-log, audit-log-server, circuit-breaker, rate-limiter, encryption, api-keys, feature-flags, negative-cache, ab-testing
```

---

## Priority A — Critical (move first)

| File | Reason | Target Package | Dependencies |
|------|--------|---------------|--------------|
| `orchestrator.ts` | System core, multi-agent router | `ai-core` | model-router, self-critique, constitutional, tools, context-compaction, openai-client, prompts |
| `prompts.ts` | All agent prompts, A/B testing | `ai-core` | none |
| `constitutional.ts` | Compliance rules, production-critical | `ai-core` | none |
| `self-critique.ts` | Output quality gate | `ai-core` | none |
| `ai/openai-client.ts` | Real OpenAI client | `openai-client` | openai (npm) |
| `graph-rag.ts` | Knowledge graph mock → dynamic extraction | `rag-pipeline` | none |
| `citation-isd.ts` | Document citations mock → dynamic | `rag-pipeline` | none |
| `actions/dd-actions.ts` | Production server actions | `dd-engine` | supabase, dd-schemas, audit-log-server |
| `secrets.ts` | Secret management (insecure localStorage) | `infrastructure` | none |
| `env.ts` | Environment validation | `infrastructure` | none |
| `db/queries.ts` | Production Supabase queries | `infrastructure` | supabase |
| `audit-log-server.ts` | Server-side audit logging | `infrastructure` | supabase |
| `tax-engine/index.ts` | Tax engine facade | `tax-engine` | types, calculator, calendar, validators, rates, dd-adapter |
| `tax-engine/types.ts` | Shared tax types | `tax-engine` | none |
| `tax-engine/rates.ts` | Ecuador tax rates | `tax-engine` | none |
| `tax-engine/calculator.ts` | Tax calculations | `tax-engine` | rates |
| `tax-engine/calendar.ts` | Tax calendar | `tax-engine` | types |
| `tax-engine/validators.ts` | RUC/cedula validation | `tax-engine` | none |

---

## Priority B — Important (move after A)

| File | Reason | Target Package | Dependencies |
|------|--------|---------------|--------------|
| `model-router.ts` | Task routing to model tiers | `ai-core` | none |
| `self-rag.ts` | Retrieval decision logic | `rag-pipeline` | query-understanding |
| `query-understanding.ts` | Query expansion (HyDE, step-back) | `rag-pipeline` | none |
| `hybrid-search.ts` | BM25 + vector search | `rag-pipeline` | none |
| `multilingual-embeddings.ts` | es/en/pt embeddings | `rag-pipeline` | none |
| `eval-suite.ts` | Main eval suite, 12 test cases | `eval-suite` | none |
| `multi-modal.ts` | File processing (images, PDFs, CSV, voice) | `tools-engine` | none |
| `dd/commands.ts` | Slash commands for DD chat | `dd-engine` | tax-engine, tax-engine/types, tax-engine/integration/dd-adapter |
| `tax-engine/integration/dd-adapter.ts` | Tax risk analysis adapter | `tax-engine` | types |
| `insight-engine.ts` | Financial insight engine | `ai-core` | none |
| `otel.ts` | Distributed tracing & metrics | `observability` | none |
| `synthetics.ts` | Synthetic checks | `observability` | otel |
| `rum.ts` | Real User Monitoring | `observability` | otel |
| `sso.ts` | SSO configuration | `infrastructure` | none |
| `rls.ts` | RLS policy definitions | `infrastructure` | none |

---

## Priority C — Nice to Have

| File | Reason | Target Package | Dependencies |
|------|--------|---------------|--------------|
| `tools.ts` | Tool definitions (mock data) | `tools-engine` | none |
| `context-compaction.ts` | Context compression | `context-engine` | none |
| `memory-layers.ts` | Layered memory (working/episodic/etc) | `context-engine` | none |
| `reranking.ts` | Cross-encoder simulated reranking | `rag-pipeline` | hybrid-search |
| `semantic-chunking.ts` | Semantic chunking | `rag-pipeline` | none |
| `hierarchical-index.ts` | Hierarchical index | `rag-pipeline` | none |
| `knowledge-graph.ts` | Full knowledge graph (3D viz) | `rag-pipeline` | none |
| `ai/eval-suite.ts` | Simplified eval (duplicate, consider merge) | `eval-suite` | none |
| `cost-monitoring.ts` | Cost calculation per feature | `observability` | none |
| `ab-testing.ts` | A/B testing system | `infrastructure` | none |
| `audit-log.ts` | Client-side audit log | `infrastructure` | none |
| `api-keys.ts` | API key management | `infrastructure` | none |
| `circuit-breaker.ts` | Circuit breaker | `infrastructure` | none |
| `rate-limiter.ts` | Rate limiter | `infrastructure` | none |
| `encryption.ts` | AES-GCM encryption | `infrastructure` | none |
| `feature-flags.ts` | Feature flags | `infrastructure` | none |
| `negative-cache.ts` | Response cache | `infrastructure` | none |
| `runbooks.ts` | Operations runbooks | `infrastructure` | none |
| `product-analytics.ts` | Product analytics | `observability` | none |
| `slos.ts` | SLO tracking | `observability` | none |
| `schemas/dd-schemas.ts` | Zod schemas | `dd-engine` | zod |
| `__tests__/dd-commands.test.ts` | Tests | `dd-engine` | dd/commands |

---

## Dependency Graph (Critical Path)

```
openai-client (A)
  └── orchestrator (A)
        ├── prompts (A)
        ├── model-router (B)
        ├── self-critique (A)
        ├── constitutional (A)
        ├── tools (C)
        ├── context-compaction (C)
        └── dd/commands (B)
              └── tax-engine/* (A)
                    └── tax-engine/integration/dd-adapter (B)

graph-rag (A) ──┐
citation-isd (A) ├── rag-pipeline
self-rag (B) ────┘
query-understanding (B)

env (A) ──┐
db/queries (A) ──┼── infrastructure
secrets (A) ────┘
audit-log-server (A)
```

## Migration Order

1. `openai-client` → no deps, foundational
2. `env` → no deps, foundational
3. `db/queries` → depends on env
4. `tax-engine/*` → mostly independent, high value
5. `prompts` → no deps, foundational for agents
6. `constitutional` → no deps, safety layer
7. `self-critique` → no deps, quality layer
8. `orchestrator` → depends on #1-#7
9. `actions/dd-actions` → depends on tax-engine + db
10. `secrets` → independent, security-critical
11. `graph-rag` + `citation-isd` → independent, RAG foundations
12. B files → after all A files
13. C files → final pass
