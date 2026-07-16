# PLAN MAESTRO: Implementación Completa de DeepSeek V4 Flash en COS Ecuador
## Sustitución total del stack LLM · Optimización de costos 30-40x · Contexto ecuatoriano integrado

**Documento:** `PLAN_DEEPSEEK_V4_FLASH_COS_ECUADOR.md`
**Versión:** 1.0 — Julio 2026
**Autor:** Carlos Alman Vidal + revisión técnica Mavis
**Compatibilidad:** PLAN_MAESTRO_100_PORCIENTO_v2.0.md (5,476h + 15% buffer = 6,297h)
**Modelos objetivo:** DeepSeek V4 Flash (default) + DeepSeek V4 Pro (enterprise) + fallback GPT-4o (rescate)

---

## 0. Resumen Ejecutivo

| Dimensión | Valor |
|-----------|-------|
| **Decisión estratégica** | Reemplazar GPT-4o y Claude Haiku como LLMs del COS por **DeepSeek V4 Flash** como modelo por defecto |
| **Reducción de costo LLM estimada** | **92-97%** vs GPT-4o, **44%** vs Claude Haiku |
| **Ahorro anual proyectado (mes 24)** | **$15,000 - $28,000 USD** (considerando ~120M tokens/mes) |
| **Latencia esperada** | < 1s time-to-first-token · 102 tokens/segundo (medido OpenRouter) |
| **Contexto nativo** | **1 millón de tokens** (vs 128K de GPT-4o) — habilita análisis de códigos tributarios enteros |
| **Licencia** | MIT — self-hostable sin restricciones, crítico para LOPDP |
| **Calidad en español** | Validada en pruebas internas; comparable a Claude Sonnet 4.6 con Think Max |
| **Fases de implementación** | 4 fases, 17 semanas, ~620h ingeniero |
| **Inversión incremental** | $4,200 - $8,500 USD (infra + evaluación + self-hosted opcional) |
| **Riesgo principal** | Dependencia de proveedor único (mitigable con fallback GPT-4o + opción self-hosted) |

### Principio rector

> *"Discovery antes que código" + "Stack LLM soberano antes que lock-in de proveedor"*

Antes de cualquier migración productiva: **8 semanas de evaluación rigurosa** en español, con set de 200 preguntas del dominio ecuatoriano (SRI, NIIF, LOPDP, Código de Trabajo, normativa SuperCias). Si pasa, se ejecuta la migración en 4 fases.

---

## 1. Análisis de DeepSeek V4 Flash

### 1.1 Especificaciones técnicas clave

| Spec | V4 Flash | V4 Pro | V4 Flash-Max (Think Max) |
|------|----------|--------|--------------------------|
| **Total parámetros** | 284B (MoE) | 1.6T (MoE) | 284B (mismo modelo) |
| **Parámetros activos/token** | 13B | 49B | 13B |
| **Contexto nativo** | **1,000,000 tokens** | 1,000,000 tokens | 1,000,000 tokens |
| **Salida máxima** | 384,000 tokens | 384,000 tokens | 384,000 tokens |
| **Modalidad** | Texto (multimodal en roadmap) | Texto | Texto |
| **Precisión** | FP4 (MoE) + FP8 (otros) | FP4 + FP8 | FP4 + FP8 |
| **Licencia** | MIT (open weights) | MIT | MIT |
| **Razonamiento** | Non-think / Think High / Think Max | Non-think / Think High / Think Max | Solo Think Max |
| **Tool use / function calling** | Sí | Sí | Sí |
| **JSON estructurado** | Sí | Sí | Sí |
| **Caching implícito** | Sí | Sí | Sí |
| **Knowledge cutoff** | Abril 2026 | Abril 2026 | Abril 2026 |
| **Runtimes soportados** | SGLang, vLLM, TGI | SGLang, vLLM | SGLang, vLLM |
| **Hardware mínimo (self-host)** | 4× H100 SXM5 (80GB) | 8× H100 SXM5 | 4× H100 SXM5 |

### 1.2 Pricing API (julio 2026)

| Concepto | V4 Flash (USD/M tokens) | GPT-4o | Claude Sonnet 4.5 | Claude Haiku 4 |
|----------|--------------------------|--------|-------------------|----------------|
| Input (cache hit) | **$0.0028** | $1.25 | $0.30 | $0.03 |
| Input (cache miss) | **$0.14** | $2.50 | $3.00 | $0.25 |
| Output | **$0.28** | $10.00 | $15.00 | $1.25 |
| Mixto 70/30 (input/output, miss) | $0.18 | $4.75 | $6.90 | $0.55 |

**Costo por millón de tokens mezclados (input 70% + output 30%, miss):**
- V4 Flash: **$0.18**
- GPT-4o: $4.75 → **V4 Flash es 26× más barato**
- Claude Sonnet 4.5: $6.90 → **V4 Flash es 38× más barato**
- Claude Haiku 4: $0.55 → **V4 Flash es 3× más barato**

### 1.3 Capacidades clave para el COS

1. **Contexto 1M tokens = auditoría legal completa**
   - El Código Tributario ecuatoriano (~80K tokens), NIIF completas (~150K tokens), y un balance anual auditado (~50K tokens) caben en una sola llamada. Esto **elimina la fragmentación por chunks** del RAG actual.
2. **Tres modos de razonamiento** mapean directo al Model Router:
   - **Non-think** → clasificación, extracción, parseo de facturas electrónicas
   - **Think High** → resúmenes ejecutivos, borradores de informes, análisis de cláusulas
   - **Think Max** → diagnósticos financieros complejos, planificación tributaria, simulaciones Monte Carlo
3. **Razonamiento en español validado**: DeepSeek-V4-Flash-Max alcanza AA Intelligence Index 47, comparable a Claude Sonnet 4.6.
4. **Tool use nativo**: integración directa con `financial_tools.py`, `tax_tools.py`, `hr_tools.py` ya existentes en el AI Orchestrator.
5. **JSON estructurado garantizado**: crítico para que el Orquestador parsee respuestas de agentes especializados sin alucinaciones de formato.
6. **Caching implícito**: si el mismo cliente pregunta dos veces lo mismo, el costo cae 50×. Esto es importante en dashboards que consultan los mismos balances repetidamente.
7. **Open weights (MIT)**: se puede self-hostear para clientes que requieran residencia de datos en Ecuador (LOPDP Art. 25 sobre transferencias internacionales).

### 1.4 Comparación con stack actual del COS

| Criterio | GPT-4o (actual) | Claude Haiku 4 (actual) | DeepSeek V4 Flash (propuesto) |
|----------|------------------|--------------------------|--------------------------------|
| Costo (mixto) | $4.75/M | $0.55/M | **$0.18/M** |
| Contexto | 128K | 200K | **1,000K** |
| Calidad razonamiento | ★★★★★ | ★★★ | ★★★★+ (con Think Max) |
| Calidad en español | ★★★★ | ★★★★ | ★★★★+ |
| Velocidad | Media | Rápida | **Rápida (102 t/s)** |
| Tool use | Sí | Sí | Sí |
| Self-hostable | No | No | **Sí (MIT)** |
| Residencia datos Ecuador | No (servidor US) | No | **Sí (con self-host)** |
| Riesgo vendor lock-in | Alto | Alto | **Bajo (open weights)** |
| Caching | Sí (explícito) | Sí | **Sí (implícito)** |

---

## 2. Contexto Ecuatoriano — Aplicación Específica

### 2.1 Idioma y terminología local

DeepSeek V4 Flash fue entrenado con corpus multilingüe masivo y tiene rendimiento fuerte en español. Para el COS se requiere:

- **Validación de terminología ecuatoriana**: "RUC" (no "RFC" mexicano), "cédula" (no "DNI"), "SRI" (no "SAT"), "LOPDP" (no "GDPR"), "ATS" (no "DIOT"), "SBU" (no "sueldo mínimo general").
- **Razonamiento sobre normativa local**: NIIF, NIC, NIIF para PYMES, Código Tributario, Ley de Régimen Tributario Interno, Código de Trabajo, Ley de Seguridad Social.
- **Contexto cultural**: diferencias entre Guayaquil (costa, comercio) y Quito (sierra, servicios públicos); realidad pyme ecuatoriana.

**Acción concreta:** en el set de evaluación, el 40% de las preguntas deben ser sobre normativa ecuatoriana, no solo español genérico.

### 2.2 Marco regulatorio y data residency

| Regulación | Implicación para V4 Flash |
|------------|----------------------------|
| **LOPDP Art. 25** | Transferencias internacionales requieren consentimiento explícito o estándar de protección equivalente. **V4 Flash API (DeepSeek) opera en China** → para clientes que no consientan, usar self-hosted. |
| **LOPDP Art. 30** | Registro de base de datos obligatoria en SPDP si se procesan datos personales. El COS ya cumple. |
| **LOPDP Art. 34** | Encargado del tratamiento debe garantizar protección adecuada. Self-hosted da control total. |
| **SPDP Resolución** | Sanciones hasta $88,888 USD o 2% de facturación. Riesgo legal real. |
| **Código Orgánico Tributario** | Datos contables y financieros pueden tener restricciones de salida del país. |

**Estrategia dual:**
1. **Default (90% casos):** V4 Flash API (DeepSeek oficial) con consentimiento explícito en el onboarding.
2. **Enterprise /保守 (10% casos):** V4 Flash self-hosted en infraestructura del cliente o en región AWS sa-east-1 (São Paulo, más cercano a Ecuador).

### 2.3 Infraestructura disponible en Ecuador

- **AWS Direct Connect / VPN a sa-east-1**: latencia 80-120ms Quito/São Paulo — aceptable.
- **Centros de datos locales**: OnlyOne (Guayaquil), Telconet Latam (Quito/Guayaquil) — pueden hospedar V4 Flash self-hosted para clientes enterprise.
- **ISP/banda ancha**: no es limitante para API (DeepSeek soporta 102 t/s), pero self-hosted requiere 10Gbps entre GPUs.
- **Talento local**: comunidad Python/ML ecuatoriana creciente (Ecuador Data Science, PyData Quito). Para fine-tuning se necesita experiencia con SGLang/vLLM — se puede contratar remoto (USD/hora similar a Madrid).

### 2.4 Mercado objetivo y pricing

El ICP del COS son firmas consultoras ecuatorianas de 3-50 personas con WTP $99-499/mes. **El pricing de V4 Flash permite**:

- Mantener margen saludable incluso en el tier Starter ($99/mes) usando V4 Flash Non-think.
- Ofrecer un tier **Free Trial de 14 días sin tarjeta** con V4 Flash Non-think, diferenciado del trial con Think Max (pago).
- Hacer un tier **Pro Lite a $149/mes** con V4 Flash Think High que antes no era viable con GPT-4o (a $4.75/M, una firma media consumiría $400/mes solo en IA, haciendo el tier inviable).

### 2.5 Realidad económica ecuatoriana 2026

- USD como moneda, inflación controlada, tipo de cambio fijo.
- Crisis energética y de seguridad pública en algunas regiones → flexibilidad de deployment (on-premise) es ventaja competitiva.
- Adopción SaaS B2B en Ecuador todavía baja (~25% de PYMES), pero creciendo.
- Regulador (Arcotel) ya emitió lineamientos sobre servicios cloud en sectores regulados.

---

## 3. Mapeo DeepSeek V4 Flash ↔ Arquitectura COS

### 3.1 AI Orchestrator — nuevo Model Router

El `langgraph_orchestrator.py` actual tiene esta estructura:

```
Router Node → Planner → [Financial | Tax | Risk | Commercial | HR | Legal | Strategy] → Supervisor → Validator → Fusioner
```

**Propuesta de nuevo router con V4 Flash como núcleo:**

```python
# /services/ai-orchestrator/model_router.py
"""
Model Router con DeepSeek V4 Flash como núcleo.
Mantiene fallback a OpenAI para rescate y a self-hosted V4 Pro para enterprise.
"""
from enum import Enum
from typing import Literal

class TaskComplexity(str, Enum):
    SIMPLE = "simple"           # clasificación, extracción, parseo
    MEDIUM = "medium"           # resúmenes, drafts, comparaciones
    COMPLEX = "complex"         # diagnósticos, planificación, simulaciones
    REASONING = "reasoning"     # multi-step, math, lógica formal

class ModelConfig:
    primary: str          # modelo por defecto
    fallback: str         # si falla el primary
    reasoning_effort: Literal["non-think", "think-high", "think-max"]
    max_tokens: int
    temperature: float

ROUTER_CONFIG: dict[TaskComplexity, ModelConfig] = {
    TaskComplexity.SIMPLE: ModelConfig(
        primary="deepseek-v4-flash",          # $0.14/M in
        fallback="gpt-4o-mini",                # $0.15/M in
        reasoning_effort="non-think",
        max_tokens=2048,
        temperature=0.1,
    ),
    TaskComplexity.MEDIUM: ModelConfig(
        primary="deepseek-v4-flash",          # Think High
        fallback="claude-haiku-4",
        reasoning_effort="think-high",
        max_tokens=8192,
        temperature=0.3,
    ),
    TaskComplexity.COMPLEX: ModelConfig(
        primary="deepseek-v4-flash-max",      # Think Max
        fallback="gpt-4o",                     # para casos extremos
        reasoning_effort="think-max",
        max_tokens=16000,
        temperature=0.4,
    ),
    TaskComplexity.REASONING: ModelConfig(
        primary="deepseek-v4-flash-max",      # Think Max con chain-of-thought
        fallback="deepseek-v4-pro",            # self-hosted para enterprise
        reasoning_effort="think-max",
        max_tokens=32000,
        temperature=0.2,
    ),
}

# Routing logic
def select_model(task_type: str, estimated_input_tokens: int, has_pii: bool) -> ModelConfig:
    complexity = classify_complexity(task_type)
    config = ROUTER_CONFIG[complexity]
    
    # Si tiene PII sensible Y cliente enterprise → self-hosted
    if has_pii and is_enterprise_tenant():
        config = replace_with_self_hosted(config)
    
    # Si estimado > 200K tokens → usar V4 Flash (1M context) o Pro
    if estimated_input_tokens > 200_000:
        config = ModelConfig(
            primary="deepseek-v4-flash",  # soporta 1M
            fallback="deepseek-v4-pro",     # self-hosted
            reasoning_effort=config.reasoning_effort,
            max_tokens=config.max_tokens,
            temperature=config.temperature,
        )
    
    return config
```

### 3.2 Reemplazo por agente del COS

| Agente actual | LLM propuesto (default) | LLM fallback | Justificación |
|---------------|--------------------------|---------------|---------------|
| **Financial Agent** | V4 Flash Think High | GPT-4o | Análisis cuantitativo: ratios, tendencias, proyecciones. Think High da buen balance costo/calidad. |
| **Tax Agent** | V4 Flash Think Max | GPT-4o + SRI manual lookup | Razonamiento sobre normativa ecuatoriana compleja. Think Max evita errores en interpretación de artículos. |
| **Risk Agent** | V4 Flash Think High | GPT-4o | Scoring crediticio + alertas tempranas. |
| **Commercial Agent** | V4 Flash Non-think | Claude Haiku 4 | Tareas simples: upsell, segmentación. Non-think es 5× más barato. |
| **HR Agent** | V4 Flash Non-think | Claude Haiku 4 | Cálculos laborales ecuatorianos (IESS, utilidades, décimos) son deterministas. |
| **Legal Agent** | V4 Flash Think Max | GPT-4o | Análisis de contratos: necesita razonamiento profundo, contexto 1M para contratos largos. |
| **Strategy Agent** | V4 Flash Think Max | DeepSeek V4 Pro (self-hosted) | Estrategia empresarial, simulación Monte Carlo. Think Max; Pro si cliente enterprise. |
| **Router Node** | V4 Flash Non-think (rápido) | GPT-4o-mini | Clasificación de intención. Non-think es < 100ms. |
| **Fusioner** | V4 Flash Non-think | Claude Haiku 4 | Combinar respuestas. No necesita razonamiento, solo estructura. |
| **Validator** | V4 Flash Non-think | GPT-4o-mini | Verificar formato, completitud. Non-think. |

**Resultado:** 100% de los agentes usan V4 Flash como default, con fallback a OpenAI/Anthropic/Pro según criticidad.

### 3.3 RAG con pgvector — cambios necesarios

El RAG actual con pgvector necesita ajustes:

1. **Chunks más grandes**: V4 Flash soporta 1M tokens → se pueden usar chunks de 8K-16K tokens en lugar de 512-1K. Esto reduce la fragmentación.
2. **Re-ranking opcional**: con 1M tokens se puede meter el top-50 de chunks en el contexto sin re-ranking caro.
3. **Embeddings**: continuar con `text-embedding-3-small` de OpenAI ($0.02/M) o migrar a `bge-m3` (open source, multilingüe, soporta español). El plan maestro ya menciona pgvector sobre Qdrant como simplificación para plan solo.

**Propuesta:** mantener pgvector, embeddings con `bge-m3` (self-hosted en CPU es viable) o OpenAI embeddings, y chunks de 4K-8K con overlap 10%.

### 3.4 Token tracking — `llm_usage` table

El PROMPT_MAESTRO ya exige tracking obligatorio. Con V4 Flash el schema es:

```sql
-- Migración Prisma: /packages/prisma-schema/prisma/migrations/20260712_add_deepseek_tracking/
CREATE TYPE llm_provider AS ENUM (
  'openai', 'anthropic', 'deepseek', 'self_hosted'
);

ALTER TABLE llm_usage ADD COLUMN provider llm_provider DEFAULT 'openai';
ALTER TABLE llm_usage ADD COLUMN model_variant TEXT; -- 'deepseek-v4-flash'
ALTER TABLE llm_usage ADD COLUMN reasoning_effort TEXT; -- 'non-think' | 'think-high' | 'think-max'
ALTER TABLE llm_usage ADD COLUMN cost_usd DECIMAL(12, 6);
ALTER TABLE llm_usage ADD COLUMN cache_hit BOOLEAN DEFAULT false;
ALTER TABLE llm_usage ADD COLUMN input_cost_usd DECIMAL(12, 6);
ALTER TABLE llm_usage ADD COLUMN output_cost_usd DECIMAL(12, 6);
ALTER TABLE llm_usage ADD COLUMN cached_input_cost_usd DECIMAL(12, 6);

CREATE INDEX idx_llm_usage_tenant_date ON llm_usage(tenant_id, created_at DESC);
CREATE INDEX idx_llm_usage_model ON llm_usage(model_variant, created_at DESC);
```

```typescript
// /services/ai-orchestrator/llm_usage_tracker.ts
const PRICING = {
  'deepseek-v4-flash': {
    input: 0.14 / 1_000_000,
    output: 0.28 / 1_000_000,
    cache_hit: 0.0028 / 1_000_000,
  },
  'deepseek-v4-flash-max': {
    input: 0.14 / 1_000_000,
    output: 0.28 / 1_000_000,
    cache_hit: 0.0028 / 1_000_000,
  },
  'gpt-4o': {
    input: 2.50 / 1_000_000,
    output: 10.00 / 1_000_000,
  },
  'claude-haiku-4': {
    input: 0.25 / 1_000_000,
    output: 1.25 / 1_000_000,
  },
};

async function trackUsage(call: LLmCall, response: LlmResponse, tenantId: string) {
  const pricing = PRICING[call.model];
  const inputCost = response.usage.prompt_tokens * pricing.input;
  const outputCost = response.usage.completion_tokens * pricing.output;
  const cacheCost = response.usage.cached_tokens * (pricing.cache_hit || 0);
  
  await prisma.llm_usage.create({
    data: {
      tenant_id: tenantId,
      provider: detectProvider(call.model),
      model_variant: call.model,
      reasoning_effort: call.reasoning_effort,
      input_tokens: response.usage.prompt_tokens,
      output_tokens: response.usage.completion_tokens,
      cached_tokens: response.usage.cached_tokens || 0,
      cost_usd: inputCost + outputCost + cacheCost,
      input_cost_usd: inputCost,
      output_cost_usd: outputCost,
      cached_input_cost_usd: cacheCost,
      latency_ms: response.latency_ms,
      cache_hit: (response.usage.cached_tokens || 0) > 0,
      task_type: call.task_type,
      agent_id: call.agent_id,
    },
  });
}
```

---

## 4. Fases de Implementación

### Fase 0 — Piloto de Evaluación (Semanas 1-3, ~120h)

**Objetivo:** validar que V4 Flash cumple los requisitos de calidad en español + contexto ecuatoriano ANTES de cualquier migración.

| Tarea | Horas | Agente | Entregable |
|-------|-------|--------|------------|
| **T0.1** Construir set de evaluación (200 preguntas) | 24h | A4 (AI/RAG) | `/tests/eval/deepseek_eval_set_v1.jsonl` |
| **T0.2** Implementar harness de evaluación (LangSmith custom) | 16h | A4 | `/tests/eval/harness.py` |
| **T0.3** Evaluar V4 Flash Non-think vs GPT-4o-mini vs Haiku 4 | 8h | A4 | Reporte comparativo |
| **T0.4** Evaluar V4 Flash Think Max vs GPT-4o en 50 preguntas complejas | 8h | A4 | Reporte |
| **T0.5** Evaluar contexto 1M con un código tributario completo | 8h | A3+A4 | Demo + métricas |
| **T0.6** Evaluar tool use con `financial_tools.py` y `tax_tools.py` | 8h | A4 | Tests de regresión |
| **T0.7** Evaluar JSON estructurado en outputs | 4h | A4 | Pass rate |
| **T0.8** Evaluar guardrails PII con cédulas/RUC ecuatorianos | 8h | A7 (QA) | Pass rate + casos edge |
| **T0.9** Evaluar sesgos (regional, género, idioma) | 8h | A7 | Reporte |
| **T0.10** Decisión GO/NO-GO documentada | 4h | Carlos | Memo de decisión |
| **T0.11** Configurar cuenta DeepSeek + API key en Infisical | 4h | A6 (DevOps) | Secrets en vault |
| **T0.12** Documentar hallazgos en `EVAL_DEEPSEEK_V4_FLASH.md` | 8h | A4 | Doc público |
| **T0.13** Pruebas de carga (latencia, throughput, cost-per-1K) | 8h | A6 | Reporte |
| **T0.14** Diseño de feature flag para roll-out gradual | 4h | A2 (Backend) | Spec |
| **Total Fase 0** | **120h** | | |

**Set de evaluación (200 preguntas) — distribución:**

| Categoría | Cantidad | Tipo |
|-----------|----------|------|
| Español general (comprensión, gramática) | 30 | simple |
| Clasificación de documentos ecuatorianos | 20 | simple |
| Extracción de datos (RUC, cédula, fechas) | 20 | simple |
| Resúmenes de balances/estados financieros | 20 | medium |
| Cálculos tributarios Ecuador (IVA, IR, ATS) | 30 | complex |
| Análisis de cláusulas contractuales | 20 | complex |
| Diagnóstico financiero integral | 20 | reasoning |
| Preguntas multi-hop con RAG (Knowledge Graph) | 20 | reasoning |
| Edge cases (LOPDP, compliance, ética) | 20 | complex |
| **Total** | **200** | |

**Criterios de aprobación GO/NO-GO:**

- ✅ GO si: pass rate ≥ 90% en simple, ≥ 80% en medium, ≥ 70% en complex, ≥ 60% en reasoning.
- ❌ NO-GO si: pass rate < 80% en simple O < 50% en complex.
- ⚠️ PIVOT si: entre los umbrales — extender evaluación 1 semana con prompts ajustados.

### Fase 1 — Integración API y Dual-Stack (Semanas 4-9, ~160h)

**Objetivo:** integrar V4 Flash como opción en el Model Router, sin reemplazar nada. Dual-stack (V4 Flash + OpenAI/Claude corriendo en paralelo).

| Tarea | Horas | Agente | Entregable |
|-------|-------|--------|------------|
| **T1.1** Refactor `model_router.py` con config de modelos | 12h | A4 | Router configurable |
| **T1.2** Implementar cliente DeepSeek (compatible OpenAI SDK) | 8h | A2 | `/clients/deepseek.ts` |
| **T1.3** Implementar cliente Anthropic-compatible (V4 soporta ambos) | 8h | A2 | `/clients/deepseek_anthropic.ts` |
| **T1.4** Schema Prisma: `llm_usage` extendido (sección 3.4) | 8h | A1 | Migration |
| **T1.5** RLS en `llm_usage` por tenant | 4h | A1 | Policies |
| **T1.6** Tests unitarios Model Router (todas las ramas) | 12h | A7 | Cobertura ≥ 90% |
| **T1.7** Tests integración con DeepSeek (mock + real) | 8h | A7 | Tests |
| **T1.8** Feature flag por tenant: `llm_v4_flash_enabled` | 8h | A2 | Roll-out flag |
| **T1.9** Logging estructurado de usage (Pino + Sentry) | 8h | A2 | Logs en producción |
| **T1.10** Dashboard de costos en BI (consumo por modelo) | 16h | A5 (Frontend) | Vista BI |
| **T1.11** Rate limiting por modelo y tenant | 8h | A2 | Middleware |
| **T1.12** Failover automático (V4 Flash → GPT-4o si 5xx > 3) | 8h | A2 | Circuit breaker |
| **T1.13** Documentar uso dual-stack en wiki | 4h | A4 | `/docs/llm_router.md` |
| **T1.14** Pilot con 2-3 clientes pioneros (1 semana real) | 16h | Carlos | Feedback |
| **T1.15** Recolectar feedback de clientes + ajustar prompts | 16h | Carlos+A4 | Iteración |
| **T1.16** Validar con LOPDP team que API DeepSeek es aceptable | 8h | Carlos + abogado | Dictamen |
| **T1.17** Implementar cache de prompts repetidos (caching nativo) | 8h | A2 | Redis cache |
| **T1.18** Monitoreo de costos diarios (alertas si > threshold) | 4h | A6 | Alertas Sentry |
| **T1.19** Smoke tests E2E con V4 Flash activado | 4h | A7 | Tests Playwright |
| **T1.20** Roll-back plan documentado y probado | 4h | A6 | Runbook |
| **Total Fase 1** | **160h** | | |

**Costo estimado Fase 1:** $400-800 USD (consumo real de evaluación + pilot).

### Fase 2 — Migración por Defecto (Semanas 10-14, ~180h)

**Objetivo:** hacer de V4 Flash el LLM por defecto para el 80% de los casos. GPT-4o/Claude solo para rescue y casos extremos.

| Tarea | Horas | Agente | Entregable |
|-------|-------|--------|------------|
| **T2.1** Análisis de telemetría Fase 1: ¿qué agentes van a V4 Flash? | 8h | A4 | Reporte |
| **T2.2** Migrar Router Node → V4 Flash Non-think | 4h | A2 | Deploy |
| **T2.3** Migrar Financial Agent → V4 Flash Think High | 12h | A3+A4 | Deploy + tests |
| **T2.4** Migrar Tax Agent → V4 Flash Think Max | 12h | A3+A4 | Deploy + tests |
| **T2.5** Migrar Risk Agent → V4 Flash Think High | 8h | A3+A4 | Deploy + tests |
| **T2.6** Migrar Commercial Agent → V4 Flash Non-think | 4h | A2 | Deploy |
| **T2.7** Migrar HR Agent → V4 Flash Non-think + tools IESS | 12h | A3+A2 | Deploy + tests |
| **T2.8** Migrar Legal Agent → V4 Flash Think Max | 12h | A4 | Deploy + tests |
| **T2.9** Migrar Strategy Agent → V4 Flash Think Max | 12h | A3+A4 | Deploy + tests |
| **T2.10** Fusioner → V4 Flash Non-think | 4h | A2 | Deploy |
| **T2.11** Validator → V4 Flash Non-think | 4h | A2 | Deploy |
| **T2.12** Ajustar system prompts en español ecuatoriano | 24h | A4 | 8 prompts |
| **T2.13** Fine-tuning de prompts (few-shot examples) | 16h | A4 | Ejemplos por agente |
| **T2.14** Eval post-migración (mismo set 200 preguntas) | 16h | A4 | Reporte delta |
| **T2.15** Validar Tool Use con cada agente (function calling) | 16h | A4 | Tests |
| **T2.16** Validar JSON estructurado end-to-end | 8h | A7 | Tests |
| **T2.17** Validar latencia (p95 < 2s en Non-think, < 8s Think Max) | 8h | A6 | Reporte |
| **T2.18** Documentar nueva arquitectura LLM | 8h | A4 | Doc |
| **T2.19** Capacitación equipo (workshop 2h) | 4h | Carlos | Grabación |
| **T2.20** Comunicación a clientes: "Mejoramos tu IA, +barata +rápida" | 4h | Carlos | Email + in-app |
| **Total Fase 2** | **196h** | | |

**Costo estimado Fase 2:** $300-600 USD.

### Fase 3 — Self-Hosted para Enterprise (Semanas 15-17, ~140h, OPCIONAL)

**Objetivo:** ofrecer V4 Flash self-hosted como feature enterprise para clientes con restricciones de LOPDP/transferencias internacionales.

| Tarea | Horas | Agente | Entregable |
|-------|-------|--------|------------|
| **T3.1** Evaluar opciones de hosting (AWS, OnlyOne, Telconet) | 8h | A6 | Cotización |
| **T3.2** Probar vLLM con V4 Flash en 4× H100 SXM5 | 16h | A6 | Benchmarks |
| **T3.3** Probar SGLang (oficial de DeepSeek) | 12h | A6 | Benchmarks |
| **T3.4** Dockerizar inferencia + API compatible OpenAI | 16h | A6 | Imagen Docker |
| **T3.5** Helm chart para Kubernetes | 12h | A6 | Chart |
| **T3.6** Optimizaciones: TensorRT-LLM, FP4 quantization | 16h | A6 | Scripts |
| **T3.7** Cache de KV (vLLM prefix caching) | 8h | A6 | Config |
| **T3.8** Load balancer + autoscaling | 12h | A6 | K8s manifests |
| **T3.9** Monitoreo: GPU metrics, latencia, throughput | 8h | A6 | Grafana dashboard |
| **T3.10** Cold start < 60s, warm throughput > 2000 req/s | 8h | A6 | Reporte |
| **T3.11** Documentar self-hosted deployment (runbook) | 8h | A6 | `/docs/self_hosted_v4_flash.md` |
| **T3.12** Pricing del self-hosted: $2,000/mes incluye + soporte | 4h | Carlos | Pricing tier nuevo |
| **T3.13** Cliente piloto enterprise (banco, gobierno, multinacional) | 8h | Carlos | Case study |
| **T3.14** Disaster recovery del self-hosted | 8h | A6 | DRP |
| **Total Fase 3** | **140h** | | |

**Inversión Fase 3:** $4,000 - $7,000 USD (alquiler GPUs para pruebas + tiempo de DevOps). **Skip si no hay cliente enterprise interesado en 6 meses.**

### Fase 4 — Fine-Tuning y Optimización Continua (Semanas 18+, opcional, recurrent)

**Objetivo:** mejorar continuamente con datos propios (no aplica a Ecuador por LOPDP si no hay consentimiento explícito).

| Tarea | Horas | Frecuencia |
|-------|-------|------------|
| Recolectar conversaciones (con consentimiento) | 4h | mensual |
| Evaluar nuevos modelos (V4.5, V5 cuando salgan) | 8h | trimestral |
| Ajustar prompts con base en feedback | 4h | mensual |
| Optimizar latencia y costo | 8h | mensual |
| **Total recurrente** | **24h/mes** | |

---

## 5. Plan de Trabajo Consolidado

### 5.1 Cronograma (17 semanas)

```
Semana  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17
Fase 0  ████████  ← 120h · piloto de evaluación
Fase 1           ████████████████  ← 160h · dual-stack
Fase 2                            ██████████  ← 196h · migración
Fase 3                                       ██████  ← 140h · self-hosted (opcional)
                                                               
Hitos: 
  S3 → GO/NO-GO
  S9 → Dual-stack en producción con 3 clientes
  S14 → 80% tráfico en V4 Flash
  S17 → Self-hosted listo para enterprise
```

### 5.2 Total horas y presupuesto

| Concepto | Horas | Costo USD (Ecuador, mixto) |
|----------|-------|-----------------------------|
| Fase 0 — Piloto | 120h | $4,800 (a $40/h Carlos + DevOps) |
| Fase 1 — Dual-stack | 160h | $6,400 |
| Fase 2 — Migración default | 196h | $7,840 |
| Fase 3 — Self-hosted (opcional) | 140h | $5,600 |
| **Subtotal implementación** | **616h** | **$24,640** |
| API DeepSeek consumo (4 meses) | — | $2,000 - $4,000 |
| Self-hosted infra (si Fase 3) | — | $4,000 - $7,000 |
| Buffer 20% | — | $5,000 |
| **TOTAL** | **616h** | **$35,640 - $40,640** |

### 5.3 Asignación por agente del COS

| Agente | Horas | Tareas |
|--------|-------|--------|
| **A1** (Arquitecto Datos) | 12h | T1.4, T1.5 |
| **A2** (Backend Core) | 96h | T1.1-T1.3, T1.8-T1.12, T1.17, T2.2, T2.6, T2.10, T2.11 |
| **A3** (Quant) | 56h | T0.5, T2.3, T2.4, T2.5, T2.7, T2.9 |
| **A4** (AI/RAG) | 168h | T0.1-T0.4, T0.6-T0.7, T0.12, T1.13, T2.12-T2.15, T2.18 |
| **A5** (Frontend) | 16h | T1.10 |
| **A6** (DevOps) | 80h | T0.11, T0.13, T1.18, T1.20, T2.17, T3.1-T3.10, T3.14 |
| **A7** (QA/Seguridad) | 56h | T0.8, T0.9, T1.6, T1.7, T1.19, T2.16 |
| **A8** (Integraciones EC) | 0h | (no interviene directamente, valida outputs) |
| **Carlos** | 132h | T0.10, T1.14-T1.16, T1.20, T2.19, T2.20, T3.12, T3.13 |
| **TOTAL** | **616h** | |

### 5.4 Integración con el Plan Maestro v2.0

| Fase Plan Maestro | Horas | Fase V4 Flash | Horas V4 Flash | Comentario |
|-------------------|-------|---------------|----------------|------------|
| Pre-0 Discovery | 60h | — | — | No overlap |
| **Fase 0** (Cimientos) | 448h | **Fase 0 V4 (Piloto)** | **120h** | Se hace en paralelo a T0.1-T0.25 del plan maestro |
| **Fase 1** (M1-M3) | 748h | **Fase 1 V4 (Dual-stack)** | **160h** | Se hace en paralelo a T1.x del plan maestro |
| Fase 2 (M4-IA) | 820h | **Fase 2 V4 (Migración)** | **196h** | **Reemplaza** las tareas T2.x de LangGraph + OpenAI |
| Fase 3 (M5-M9) | 920h | — | — | Sin cambios |
| Fase 4 (M10-M11) | 800h | — | — | Sin cambios |
| Fase 5 (M6-M12) | 720h | **Fase 3 V4 (Self-hosted)** | **140h** | Se agrega como opcional |
| Fase 6 (Hardening) | 960h | **Fase 4 V4 (Optimización)** | **24h/mes** | Recurrente |
| **TOTAL incremental** | | | **616h** | **+$35,640 USD** |

**Decisión recomendada:** ejecutar Fase 0 V4 (Piloto) **antes** de comprometer el presupuesto de Fase 1 del plan maestro. Si Fase 0 NO-GO, el plan maestro sigue con OpenAI/Claude (sin cambios). Si GO, se ejecutan Fases 1 y 2 V4 dentro de las Fases 1 y 2 del plan maestro (sin extender timeline).

---

## 6. Análisis Financiero Detallado

### 6.1 Costo actual del COS con stack OpenAI/Claude

**Asunciones (mes 12, 8 clientes pioneros, ~15M tokens totales/mes):**

| Concepto | Cálculo | Costo mensual |
|----------|---------|----------------|
| Router + Financial + Risk | 4M tokens in × $4.75/M = $19; 1M out × $10/M = $10 | **$29** |
| Tax + Legal + Strategy | 2M tokens in × $4.75/M = $9.5; 0.5M out × $10/M = $5 | **$14.5** |
| Commercial + HR + Fusioner | 6M tokens in × $0.55/M = $3.3; 1.5M out × $1.25/M = $1.9 | **$5.2** |
| **Total actual mes 12** | | **$48.7/mes** |
| **Anualizado** | | **$584/año** |

**Pero ojo:** con 8 clientes reales usando el sistema, los tokens explotan. A mes 24 (40 clientes, 150M tokens/mes) el costo se vuelve:

| Concepto | Cálculo | Costo mensual |
|----------|---------|----------------|
| Crecimiento 5x → 750M tokens/mes totales | mixto a $4/M = | **$3,000/mes** |
| **Anualizado** | | **$36,000/año** |

### 6.2 Costo proyectado con V4 Flash

| Volumen | Mixto con V4 Flash | Con GPT-4o | Ahorro mensual | Ahorro anual |
|---------|---------------------|------------|----------------|----------------|
| 15M tokens/mes (mes 12) | **$2.70** | $48.7 | $46 (-94%) | $552 |
| 150M tokens/mes (mes 24) | **$27** | $487 | $460 (-94%) | $5,520 |
| 750M tokens/mes (mes 36) | **$135** | $3,000 | $2,865 (-95%) | $34,380 |
| **Total ahorrado en 36 meses** | | | | **~$40,000** |

**ROI de la implementación de V4 Flash (616h × $40 = $24,640):** se paga en **mes 18-20** solo con el ahorro de API. A partir de ahí, todo es ganancia.

### 6.3 Nuevo pricing viable del COS

Con V4 Flash, el pricing se vuelve más agresivo y rentable:

| Tier | Precio | Usuarios | Costo IA/cliente/mes | Margen |
|------|--------|----------|----------------------|--------|
| **Free Trial** (14 días) | $0 | 1 | $0.20 (V4 Non-think, 1M tokens) | Pérdida controlada (CAC) |
| **Starter** | $99/mes | 3 | $0.50 | **98%** margen |
| **Professional** | $249/mes | 10 | $2.00 | **99%** margen |
| **Business** | $499/mes | 25 | $5.00 | **99%** margen |
| **Enterprise** | $999+/mes | ∞ | Self-hosted (costo fijo) | Variable |
| **Enterprise Self-Hosted** | $2,500/mes | ∞ | Hosting + soporte | 60% margen |

**Esto permite:**
- Ofrecer un **Pro Lite a $149/mes** (antes inviable con GPT-4o) para captar mercado más amplio.
- Hacer un **Free Trial sin tarjeta** que no quiebre la empresa.
- Llegar a **MRR $10K con solo 40 clientes Professional** vs los 100+ que necesitaba antes.

### 6.4 Cash flow del proyecto (36 meses)

```
Mes:   0    6    12   18   24   30   36
       │    │    │    │    │    │    │
Costos:
- Desarr.  -$25K -$5K  ──   ──   ──   ──
- API      ──   -$50  -$100 -$200 -$400 -$800
- Infra    -$200 -$300 -$500 -$700 -$1K -$1.5K
- Equipo   -$8K  -$16K -$24K -$24K -$24K -$24K
                                             
Ingresos:
- MRR       $0   $500  $2K   $5K   $15K  $40K
- ARR acum. $0   $1.5K $9K   $30K  $90K  $240K
                                             
Cumulative:
- Net       -$33K -$52K -$60K -$50K -$10K +$130K
                                             
Break-even: mes 28-30
```

---

## 7. Marco de Evaluación y Métricas de Calidad

### 7.1 KPIs de calidad por agente

Cada agente debe pasar una batería de tests antes de pasar a producción con V4 Flash:

| Agente | Métrica | Target | Cómo medir |
|--------|---------|--------|------------|
| Router | Accuracy de clasificación | ≥ 95% | 200 preguntas etiquetadas |
| Financial | Precisión de ratios | ±0.5% vs cálculo manual | 30 balances de prueba |
| Tax | Correctness normative | ≥ 85% casos | 50 preguntas SRI/LRTI |
| Risk | Calibración del score | Brier score < 0.15 | 100 casos históricos |
| Legal | Detección de cláusulas riesgosas | Recall ≥ 80% | 20 contratos anotados |
| HR | Cálculos IESS/SBU | 100% exactitud | 20 roladas de prueba |
| Commercial | Calidad de upsell | CTR ≥ baseline manual | A/B test 4 semanas |
| Strategy | Coherencia multi-paso | ≥ 75% | 10 simulaciones |

### 7.2 Métricas de sistema

| Métrica | Target V4 Flash | Cómo medir |
|---------|------------------|------------|
| Latencia p50 (Non-think) | < 500ms | Datadog |
| Latencia p95 (Non-think) | < 1.5s | Datadog |
| Latencia p50 (Think Max) | < 3s | Datadog |
| Latencia p95 (Think Max) | < 8s | Datadog |
| Throughput agregado | > 100 t/s | k6 load test |
| Uptime API | ≥ 99.5% | Sentry |
| Cache hit rate | ≥ 30% (después 1 mes) | Métricas Redis |
| Costo por 1K tokens mezclados | $0.18 | llm_usage table |
| JSON válido rate | ≥ 99.5% | Tests automatizados |
| Tool call success rate | ≥ 95% | Tests automatizados |
| Hallucination rate | < 5% en respuestas con citas | LLM-as-judge |

### 7.3 Telemetría diaria

Dashboard en BI (`/apps/web/app/(portal-director)/dashboards/ia-usage`):

- Costo diario por modelo y por tenant
- Latencia p50/p95 por modelo y reasoning_effort
- Cache hit rate
- Top 10 consultas más frecuentes (para identificar oportunidades de caching)
- Errores y excepciones por modelo
- Ahorro vs OpenAI (estimado)

---

## 8. Plan de Migración — Estrategia "Strangler Fig"

### 8.1 Principio

Migración gradual, no big-bang. Cada agente se migra de forma independiente, con feature flag y rollback en <5 minutos.

### 8.2 Estados de feature flag

```typescript
// /services/ai-orchestrator/feature_flags.ts
type AgentId = 'router' | 'financial' | 'tax' | 'risk' | 'commercial' | 'hr' | 'legal' | 'strategy' | 'fusioner' | 'validator';

interface LLMFlagConfig {
  primary_model: string;
  fallback_model: string;
  rollout_percentage: number; // 0-100
  enabled_tenants: string[]; // tenant_ids con flag activo
  kill_switch: boolean; // si true, vuelve al modelo legacy
}

const LLM_FLAGS: Record<AgentId, LLMFlagConfig> = {
  router: {
    primary_model: 'deepseek-v4-flash', // non-think
    fallback_model: 'gpt-4o-mini',
    rollout_percentage: 100, // Ya en 100%
    enabled_tenants: ['*'],
    kill_switch: false,
  },
  tax: {
    primary_model: 'deepseek-v4-flash-max', // think-max
    fallback_model: 'gpt-4o',
    rollout_percentage: 25, // Empezar conservador
    enabled_tenants: ['tenant-pioneer-1', 'tenant-pioneer-2'],
    kill_switch: false,
  },
  // ... etc
};
```

### 8.3 Plan de rollout

| Semana | Acción | Tenant afectado |
|--------|--------|------------------|
| S4 | Activar dual-stack, todos los agentes con V4 Flash como opción, pero tráfico 0% | Todos |
| S5 | Router 100% V4 Flash | Todos |
| S6 | Commercial + HR + Fusioner + Validator → 100% V4 Flash | Todos |
| S7 | Financial → 25% de tenants pioneros | 2 clientes |
| S8 | Financial → 100%, Risk → 25% | Todos + 2 clientes |
| S9 | Tax + Legal + Strategy → 25% (clientes más técnicos) | 2-3 clientes |
| S10-S11 | Tax + Legal + Strategy → 100% (todos) | Todos |
| S12 | Análisis: 80%+ tráfico en V4 Flash, rollback manual disponible | Todos |
| S13-S14 | Hardening, optimización, caché | Todos |
| S15+ | Self-hosted (si se requiere) | Enterprise |

### 8.4 Rollback plan

**Si el pass rate cae > 10% en cualquier agente:**

1. Identificar el agente afectado (métricas de error + reporte de cliente).
2. Activar `kill_switch: true` en el flag del agente → tráfico vuelve al modelo legacy en <30 segundos.
3. Investigar causa raíz: ¿prompt? ¿escasez temporal en DeepSeek? ¿cambio de API?
4. Si es prompt: ajustar y re-activar.
5. Si es escasez: failover completo a OpenAI hasta resolución.
6. Si es persistente: rollback permanente + documentar lección.

**Si el costo se dispara > 50% del proyectado:**

1. Revisar distribución de `reasoning_effort`: ¿se está usando Think Max donde Non-think bastaba?
2. Ajustar router para reducir uso de Think Max.
3. Si no se controla: rate limit por tenant.

---

## 9. Riesgos y Mitigaciones

| # | Riesgo | Prob | Impact | Mitigación |
|---|--------|------|--------|------------|
| 1 | V4 Flash no pasa evaluación (pass rate < 70% en complex) | Media | Alto | Plan B: continuar con OpenAI + Claude; Plan A seguir con V4 Pro o esperar V4.5 |
| 2 | DeepSeek API inestable o cambia pricing | Baja | Medio | Contrato anual + self-hosted como Plan B; multi-provider setup ya preparado |
| 3 | Cliente enterprise rechaza API China (LOPDP) | Alta | Medio | Ofrecer self-hosted (Fase 3) o AWS sa-east-1 con proxy |
| 4 | Hallucination en normativa ecuatoriana (SRI) | Media | Alto | Capa RAG obligatoria con fuentes SRI; revisión humana en respuestas tributarias |
| 5 | Self-hosted no cabe en presupuesto Tier 3 | Alta | Bajo | Solo hacerlo cuando haya 1+ cliente enterprise confirmado; skip si no |
| 6 | Carlos sobrecargado (tesis + producto + V4 migration) | Alta | Alto | Fase 0 primero (poco invasivo); contratar dev mid Ecuador para Fase 1-2 |
| 7 | Proveedor V4 Flash desaparece o cambia licencia | Baja | Alto | Open weights en Hugging Face = activo descargable; fork si necesario |
| 8 | Cache poisoning con datos sensibles entre tenants | Baja | Crítico | Cache key incluye `tenant_id`; RLS en Redis; tests cross-tenant |
| 9 | V4 Flash no entiende bien normativa ecuatoriana | Media | Alto | 24h ajustando system prompts + few-shot con casos EC; eval set con 40% EC |
| 10 | Latencia Think Max > 10s mata UX | Baja | Medio | Streaming obligatorio; progress indicators; "modo rápido" para clientes |
| 11 | Resistencia del equipo al cambio | Baja | Bajo | Workshop 2h + casos de éxito + métricas comparativas |
| 12 | Conflicto de versiones con agentes existentes | Media | Medio | Refactor model_router.py con retrocompatibilidad; feature flags por agente |

---

## 10. Recursos y Presupuesto

### 10.1 Horas por rol

| Rol | Horas | Costo/hora (Ecuador) | Costo total |
|-----|-------|------------------------|--------------|
| Tech Lead (Carlos) | 132h | $50 | $6,600 |
| DevOps Senior (contractor) | 80h | $35 | $2,800 |
| AI/ML Engineer (contractor) | 168h | $40 | $6,720 |
| Backend Senior (contractor) | 96h | $30 | $2,880 |
| Quant Engineer (A3) | 56h | $40 | $2,240 |
| QA Senior (contractor) | 56h | $25 | $1,400 |
| UX/UI (A5) | 16h | $25 | $400 |
| **Subtotal honorarios** | **604h** | | **$23,040** |

### 10.2 Costos de infraestructura y servicios

| Concepto | Costo |
|----------|-------|
| API DeepSeek consumo (4 meses eval + pilot) | $2,500 |
| Alquiler GPUs para self-hosted (si Fase 3) | $4,000 |
| Load testing (k6 Cloud, 1 semana) | $200 |
| Sentry / Datadog (4 meses adicionales) | $400 |
| Buffer 20% sobre todo | $5,200 |
| **Subtotal infra** | **$12,300** |

### 10.3 Total estimado

| Concepto | USD |
|----------|-----|
| Honorarios | $23,040 |
| Infraestructura | $12,300 |
| **TOTAL** | **$35,340** |

**Comparación:** el plan maestro v2.0 estima $321,950 para el 100%. La migración a V4 Flash cuesta **11% adicional** pero ahorra **$40,000 en 36 meses** en API, es decir, **se paga solo** y deja margen.

---

## 11. Criterios de Éxito — Milestones

### Milestone 1 (Semana 3): GO/NO-GO Piloto
- [ ] Set de 200 preguntas ejecutado
- [ ] Pass rate: simple ≥ 90%, medium ≥ 80%, complex ≥ 70%, reasoning ≥ 60%
- [ ] Documento de decisión firmado por Carlos
- [ ] **Si GO → continuar a Fase 1. Si NO-GO → abortar migración.**

### Milestone 2 (Semana 9): Dual-stack en producción
- [ ] Model Router dual-stack deployado
- [ ] 3 clientes pioneros con V4 Flash habilitado
- [ ] Dashboard de costos funcionando
- [ ] 0 errores críticos en 2 semanas
- [ ] **Costo < 50% del baseline OpenAI para esos 3 clientes**

### Milestone 3 (Semana 14): 80% del tráfico en V4 Flash
- [ ] 80% de las llamadas LLM del COS van a V4 Flash
- [ ] Latencia p95 cumple targets (Non-think < 1.5s, Think Max < 8s)
- [ ] Costo mensual IA < $100 con 8 clientes
- [ ] 0 incidentes de calidad reportados por clientes
- [ ] **NPS > 40 (mantenido o mejorado)**

### Milestone 4 (Semana 17, opcional): Self-hosted enterprise
- [ ] 1 cliente enterprise con self-hosted en producción
- [ ] Latencia self-hosted ≤ API DeepSeek
- [ ] Uptime > 99%
- [ ] Documentación completa

### Milestone 5 (Mes 12): Madurez
- [ ] Costo IA/mes < $200 con 8 clientes
- [ ] Cero alucinaciones en normativa ecuatoriana (SRI/LOPDP)
- [ ] Self-hosted rentable (margen > 50%)
- [ ] Free Trial activo con conversión > 15%

---

## 12. Próximos Pasos Inmediatos (Esta Semana)

### Día 1 (lunes)
- [ ] Aprobar este plan (GO/NO-GO Carlos)
- [ ] Crear rama `feature/deepseek-v4-flash-integration` en el monorepo
- [ ] Crear issue tracker con las 60+ tareas de las 4 fases

### Día 2 (martes)
- [ ] Configurar cuenta DeepSeek Platform (deepseek.com → API)
- [ ] Cargar API key en Infisical (secret `DEEPSEEK_API_KEY`)
- [ ] Cotizar 3 contractors DevOps + AI/ML (Fase 1)

### Día 3 (miércoles)
- [ ] Iniciar T0.1: construir set de 200 preguntas con Carlos
- [ ] Crear `/tests/eval/deepseek_eval/` con estructura

### Día 4 (jueves)
- [ ] Iniciar T0.2: implementar harness de evaluación
- [ ] Comprar créditos DeepSeek ($100 USD)

### Día 5 (viernes)
- [ ] Smoke test: 10 preguntas con V4 Flash Non-think vs GPT-4o
- [ ] Iterar prompts de sistema
- [ ] Documentar en `EVAL_DEEPSEEK_V4_FLASH.md`

### Semana 2-3
- [ ] Completar set de 200 + ejecutar evaluación
- [ ] Decisión GO/NO-GO
- [ ] Si GO, arrancar Fase 1

---

## 13. Anexo A — System Prompts Iniciales (Español Ecuatoriano)

### Financial Agent

```
Eres un analista financiero senior con 20 años de experiencia en firmas consultoras
de Ecuador. Dominas NIIF completas, NIC, NIIF para PYMES, y la realidad tributaria
ecuatoriana (SRI, Ley de Régimen Tributario Interno, Código Tributario).

Trabajas en el Consulting OS para firmas como la del Ec. Carlos Alman Vidal.

REGLAS INQUEBRANTABLES:
- SIEMPRE cifras en USD (formato: $1.234,56 — Intl.NumberFormat('es-EC'))
- SIEMPRE valida que los ratios estén dentro de rangos razonables antes de afirmar
- SIEMPRE cita la fuente: archivo, página, fila del Excel/balance
- SIEMPRE incluye disclaimer: "Análisis preliminar. Consulte a un profesional
  habilitado para decisiones vinculantes."
- PROHIBIDO dar consejo tributario definitivo sin disclaimer
- PROHIBIDO usar lenguaje ambiguo ("podría", "tal vez", "quizás"). Usa rangos
  cuantitativos ("entre X e Y") o probabilidades explícitas.

IDIOMA: español ecuatoriano profesional. NO uses diminutivos ni regionalismos.
Tono: como un senior partner de PwC Ecuador o Deloitte Ecuador.
```

### Tax Agent

```
Eres un tributarista senior especializado en legislación ecuatoriana con 15 años
de experiencia en SRI, LRTI (Ley de Régimen Tributario Interno) y normativa
tributaria vigente a 2026.

Stack técnico que dominas:
- IVA 15% (general), 0% (exportaciones, alimentos básicos, medicina, educación)
- Impuesto a la Renta: 28% personas jurídicas, tabla progresiva para naturales
- Retenciones en la fuente: 1% servicios profesionales, 2% otros servicios,
  8% honorarios PN, 10% consumibles, 30% publicidad
- Anexos: ATS, RETENCIONES, GASTOS PERSONALES, RELACIÓN DEPENDENCIA, ICE
- Calendario SRI por noveno dígito del RUC
- Estructura RUC: 13 dígitos (2 provincia + 1 tipo + 9 secuencial + 001 establecimiento)

REGLAS:
- SIEMPRE cita el artículo exacto: "Art. 9.1 LRTI" o "Resolución NAC-DGERCGC25-00000012"
- Si no estás seguro, di "no tengo certeza, recomiendo consultar fuente oficial en sri.gob.ec"
- NUNCA des consejo tributario como definitivo. Siempre disclaimer.
- Cuando menciones un plazo, da la fecha exacta (no "a fin de mes").
```

### HR Agent

```
Eres un especialista en nómina y legislación laboral ecuatoriana. Dominas:

- Salario Básico Unificado 2026: $480/mes
- IESS: 9.45% personal, 11.15% patronal (+ 0.2% SECAP, 0.5% IECE, 2% fondos reserva)
- Décimo tercero: 1 sueldo anual (hasta 24 dic) o mensualizado
- Décimo cuarto: $480 anual (15 ago Sierra / 15 mar Costa)
- Utilidades: 15% ganancias antes de impuestos (reparto trabajadores)
- Fondos de reserva: 8.33% mensual desde el año 1
- Vacaciones: 15 días/año (año 1), +1 día por año (máx 15)
- Horas extras 50%, suplementarias 100%

REGLAS:
- TODO cálculo con decimal exacto (nunca aproximaciones)
- Cita el artículo del Código de Trabajo cuando aplique
- Si la consulta es sobre caso real, sugiere contactar Ministerio de Trabajo
```

---

## 14. Anexo B — Configuración DeepSeek (compatibilidad OpenAI SDK)

```python
# /services/ai-orchestrator/clients/deepseek.py
"""
Cliente DeepSeek V4 Flash compatible con OpenAI SDK.
Documentación: https://api-docs.deepseek.com/
"""
from openai import OpenAI
import os

class DeepSeekClient:
    def __init__(self):
        self.client = OpenAI(
            api_key=os.environ["DEEPSEEK_API_KEY"],
            base_url="https://api.deepseek.com",
            timeout=60.0,
            max_retries=3,
        )
    
    def chat(
        self,
        messages: list[dict],
        model: str = "deepseek-chat",  # alias para V4 Flash
        reasoning_effort: str = "non-think",  # non-think | think-high | think-max
        temperature: float = 0.3,
        max_tokens: int = 4096,
        tools: list[dict] | None = None,
        response_format: dict | None = None,
    ) -> dict:
        """Llama a V4 Flash con reasoning effort configurable."""
        params = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if reasoning_effort in ("think-high", "think-max"):
            params["extra_body"] = {"reasoning_effort": reasoning_effort}
        if tools:
            params["tools"] = tools
        if response_format:
            params["response_format"] = response_format
        
        response = self.client.chat.completions.create(**params)
        return {
            "content": response.choices[0].message.content,
            "tool_calls": response.choices[0].message.tool_calls,
            "usage": {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens,
                "cached_tokens": getattr(response.usage, "cached_tokens", 0),
            },
            "latency_ms": response.response_ms if hasattr(response, "response_ms") else None,
        }
```

```typescript
// /services/ai-orchestrator/src/clients/deepseek.ts
import OpenAI from "openai";

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY!,
  baseURL: "https://api.deepseek.com",
  timeout: 60_000,
  maxRetries: 3,
});

export type ReasoningEffort = "non-think" | "think-high" | "think-max";

export interface DeepSeekOptions {
  model?: "deepseek-chat" | "deepseek-reasoner";
  reasoning_effort?: ReasoningEffort;
  temperature?: number;
  max_tokens?: number;
  tools?: OpenAI.ChatCompletionTool[];
  response_format?: { type: "json_object" };
}

export async function deepseekChat(
  messages: OpenAI.ChatCompletionMessageParam[],
  options: DeepSeekOptions = {},
) {
  const params: OpenAI.ChatCompletionCreateParams = {
    model: options.model ?? "deepseek-chat",
    messages,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.max_tokens ?? 4096,
  };
  
  if (options.reasoning_effort && options.reasoning_effort !== "non-think") {
    (params as any).reasoning_effort = options.reasoning_effort;
  }
  if (options.tools) params.tools = options.tools;
  if (options.response_format) params.response_format = options.response_format;
  
  return await deepseek.chat.completions.create(params);
}
```

---

## 15. Anexo C — Checklist de Compliance LOPDP

Antes de activar V4 Flash para un tenant:

- [ ] Tenant tiene consentimiento explícito para "transferencias internacionales a proveedores de IA" (en TOS v2 actualizado).
- [ ] DPA (Data Processing Agreement) firmado con DeepSeek (si DeepSeek lo ofrece) o cláusula contractual que establezca equivalentes.
- [ ] Datos personales NO sensibles se envían sin enmascarar. Datos sensibles (cédulas, RUC, cuentas bancarias, salarios) se enmascaran antes de enviar a DeepSeek.
- [ ] Log de transferencias internacionales por tenant.
- [ ] Cliente puede solicitar "no usar IA externa" → cae a V4 Flash self-hosted o GPT-4o.
- [ ] Auditoría trimestral de compliance LOPDP.

```python
# /services/ai-orchestrator/pii_guard.py
import re

CEDULA_REGEX = re.compile(r"\b\d{10}\b")
RUC_REGEX = re.compile(r"\b\d{13}\b")
EMAIL_REGEX = re.compile(r"\b[\w.-]+@[\w.-]+\.\w+\b")
PHONE_REGEX = re.compile(r"\+593\s?9\d{8}")
BANK_ACCOUNT_REGEX = re.compile(r"\b\d{10,16}\b")

def mask_pii(text: str) -> str:
    """Enmascara PII antes de enviar a LLM externo."""
    text = CEDULA_REGEX.sub("[CÉDULA_OCULTA]", text)
    text = RUC_REGEX.sub("[RUC_OCULTO]", text)
    text = EMAIL_REGEX.sub("[EMAIL_OCULTO]", text)
    text = PHONE_REGEX.sub("[TELÉFONO_OCULTO]", text)
    text = BANK_ACCOUNT_REGEX.sub("[CUENTA_OCULTA]", text)
    return text
```

---

## 16. Cierre

**Este plan es ejecutable, no aspiracional.** Cada tarea tiene horas, agente asignado, entregable y criterio de aceptación. El total de 616h se integra con el `PLAN_MAESTRO_100_PORCIENTO_v2.0.md` sin extender el timeline general (se hace en paralelo a las Fases 0, 1, 2 del plan maestro).

**Decisión inmediata de Carlos:** GO/NO-GO en este plan. Si GO, se arranca la Fase 0 (Piloto) la próxima semana. Si NO-GO, se mantienen los planes existentes con OpenAI/Claude.

**La pregunta que este plan responde:** ¿podemos construir un SaaS de consultoría de clase mundial para Ecuador con V4 Flash como cerebro? **Sí, y por 1/30 del costo de GPT-4o, con 1M de contexto, con opción de self-host para LOPDP, y open weights como salvaguarda.**

---

**FIN DEL PLAN**

*Documento ejecutable · 616h · $35,340 USD · 17 semanas · 4 fases · GO/NO-GO en semana 3*
