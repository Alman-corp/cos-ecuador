# DeepSeek V4 Flash — Evaluation Harness para COS Ecuador

Harness de evaluación para medir la calidad de **DeepSeek V4 Flash** en el contexto del Consulting Operating System (COS) Ecuador. Compara el rendimiento contra GPT-4o-mini y Claude Haiku 4 en 200 preguntas reales del dominio ecuatoriano (SRI, NIIF, LOPDP, Código de Trabajo, normativa SuperCias).

**Parte del Plan Maestro de Implementación de DeepSeek V4 Flash** — Fase 0 (Piloto de Evaluación).

---

## Quick Start

### 1. Instalar dependencias

```bash
cd cos/tests/eval/deepseek_eval
python -m venv .venv
source .venv/bin/activate   # En Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configurar API keys

```bash
cp .env.example .env
# Editar .env con tus API keys reales
```

Obtén tus keys en:
- **DeepSeek**: https://platform.deepseek.com/api_keys
- **OpenAI**: https://platform.openai.com/api-keys
- **Anthropic**: https://console.anthropic.com/

### 3. Smoke test (10 preguntas)

```bash
python harness.py --limit 10
```

### 4. Evaluación completa (200 preguntas, ~30-60 min)

```bash
python harness.py
```

### 5. Solo una categoría

```bash
python harness.py --category tributario_ec
python harness.py --category edge_cases
```

### 6. Solo una dificultad

```bash
python harness.py --difficulty reasoning
```

### 7. Comparar modelos (recomendado al final)

```bash
python harness.py --model gpt-4o-mini --output results/gpt4omini.json
python harness.py --model claude-haiku-4 --output results/claude.json
python harness.py --model deepseek-v4-flash --output results/deepseek.json
```

---

## Estructura

```
deepseek_eval/
├── README.md              ← Este archivo
├── config.yaml            ← Configuración de modelos, scoring, thresholds
├── harness.py             ← Orquestador de evaluación
├── requirements.txt       ← Dependencias Python
├── .env.example           ← Template de variables de entorno
├── .env                   ← (NO commitear) API keys reales
├── questions/             ← Set de 200 preguntas
│   ├── q001-q030_es_general.jsonl
│   ├── q031-q050_clasificacion_docs.jsonl
│   ├── q051-q070_extraccion_datos.jsonl
│   ├── q071-q090_resumen_balance.jsonl
│   ├── q091-q120_tributario_ec.jsonl
│   ├── q121-q140_clausulas_legales.jsonl
│   ├── q141-q160_diagnostico_financiero.jsonl
│   ├── q161-q180_multi_hop_rag.jsonl
│   └── q181-q200_edge_cases.jsonl
├── results/               ← Resultados crudos (JSON)
├── reports/               ← Reportes agregados (JSON)
└── prompts/               ← Prompts auxiliares
    └── judge_prompt.txt
```

---

## Set de evaluación (200 preguntas)

| Categoría | Cantidad | Dificultad | Descripción |
|-----------|----------|------------|-------------|
| **es_general** | 30 | simple-complex | Español general, gramática, redacción profesional |
| **clasificacion_docs** | 20 | simple-complex | Clasificación de documentos ecuatorianos (facturas, retenciones, NIIF, contratos) |
| **extraccion_datos** | 20 | simple-complex | Extracción de RUC, cédula, montos, fechas, etc. |
| **resumen_balance** | 20 | medium-reasoning | Resúmenes, ratios, tendencias de balances |
| **tributario_ec** | 30 | medium-complex | IVA, IR, retenciones, ATS, SRI, ICE, RIMPE, RIVU |
| **clausulas_legales** | 20 | medium-complex | Análisis de cláusulas contractuales en derecho ecuatoriano |
| **diagnostico_financiero** | 20 | complex-reasoning | Diagnóstico integral con FODA, Z-Score, recomendaciones |
| **multi_hop_rag** | 20 | complex-reasoning | Razonamiento sobre múltiples documentos cruzados |
| **edge_cases** | 20 | complex-reasoning | LOPDP, sesgos, crisis, PII, soberanía de datos, etc. |
| **TOTAL** | **200** | | |

**Distribución por dificultad:**
- Simple: 60 preguntas (30%)
- Medium: 40 preguntas (20%)
- Complex: 70 preguntas (35%)
- Reasoning: 30 preguntas (15%)

---

## Criterios de GO/NO-GO

### Thresholds por dificultad (configurables en `config.yaml`)

| Dificultad | Pass rate mínimo | Justificación |
|------------|------------------|---------------|
| Simple | ≥ 90% | Tareas que ya hace bien cualquier modelo |
| Medium | ≥ 80% | Análisis estándar |
| Complex | ≥ 70% | Razonamiento sobre normativa |
| Reasoning | ≥ 60% | Casos multi-paso y edge cases |

### Thresholds por categoría

| Categoría | Pass rate mínimo | Justificación |
|-----------|------------------|---------------|
| extracción_datos | ≥ 90% | Determinístico, alta exigencia |
| es_general | ≥ 85% | Español estándar |
| clasificacion_docs | ≥ 85% | Patrones conocidos |
| edge_cases | ≥ 80% | Casos límite pero críticos |
| resumen_balance | ≥ 80% | Análisis con criterios objetivos |
| tributario_ec | ≥ 75% | Normativa específica (más estricto) |
| clausulas_legales | ≥ 75% | Derecho ecuatoriano |
| diagnostico_financiero | ≥ 70% | Análisis complejo |
| multi_hop_rag | ≥ 70% | Razonamiento multi-documento |

### Decisión final

- **GO** si: todas las dificultades + todas las categorías + 0 errores
- **NO-GO** si: alguna falla crítica
- **PIVOT** si: resultados mixtos, extender 1 semana con prompts ajustados

---

## Output

El harness genera dos archivos por ejecución:

### `results/results_<model>_<timestamp>.json`
Detalle de cada pregunta: respuesta del modelo, tokens, costo, score, error.

### `reports/report_<model>_<timestamp>.json`
Métricas agregadas: pass rate global, por dificultad, por categoría, costos, latencia.

Adicionalmente, en consola se muestra una tabla resumen con Rich.

---

## Costos estimados

Para 200 preguntas con V4 Flash (mix 50% Non-think, 30% Think High, 20% Think Max):

- ~5M tokens input
- ~1.5M tokens output
- Costo total: ~$1.20 USD

Para GPT-4o-mini: ~$0.90 USD.
Para Claude Haiku 4: ~$3.50 USD.

---

## Próximos pasos

Una vez ejecutado el smoke test y la evaluación completa:

1. **Revisar el reporte** en `reports/`
2. **Comparar modelos** ejecutando los 3 y contrastando resultados
3. **Analizar las preguntas fallidas** — ¿son gaps del modelo o del set?
4. **Ajustar prompts** si hay categoría con pass rate < target
5. **Decisión GO/NO-GO** documentada en `EVAL_DEEPSEEK_V4_FLASH.md`
6. **Si GO**: continuar con Fase 1 (integración API dual-stack)

---

## Referencias

- **Plan Maestro**: `PLAN_DEEPSEEK_V4_FLASH_COS_ECUADOR.md` (raíz del workspace)
- **Documentación DeepSeek API**: https://api-docs.deepseek.com/
- **Hugging Face V4 Flash**: https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash
- **OpenRouter benchmarks**: https://openrouter.ai/deepseek/deepseek-v4-flash

---

**Mantenido por**: Carlos Alman Vidal + equipo COS Ecuador
**Última actualización**: Julio 2026
