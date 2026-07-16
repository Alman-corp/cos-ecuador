# Eval Suite Guide — COS

> Generado por llm-engineer el 2026-07-11

---

## Overview

COS has two eval suites:

| File | Scope | Test Cases | Status |
|------|-------|-----------|--------|
| `src/lib/eval-suite.ts` | Main suite — multi-agent (financial, forecaster, researcher, synthesizer) | 12 tests, weighted scoring | ✅ Active |
| `src/lib/ai/eval-suite.ts` | Simplified suite — golden questions, keyword matching | 5 questions | ⚠️ Duplicate — consider merging into main |

---

## Golden Set Structure

### Main Suite (`src/lib/eval-suite.ts`)

```typescript
interface TestCase {
  id: string        // UUID
  agentId: string   // "financial" | "forecaster" | "researcher" | "synthesizer"
  input: string     // User query
  expected: string[] // Keywords that must appear in response
  category: string  // "metrics" | "trends" | "risk" | "benchmark" | ...
  weight: number    // 1-3 importance weight
}

interface EvalResult {
  testId: string
  agentId: string
  passed: boolean
  score: number     // 0-100 (penalized per missing keyword)
  latency: number   // ms
  missing: string[]
  timestamp: number
}
```

### Simplified Suite (`src/lib/ai/eval-suite.ts`)

```typescript
interface EvalResult {
  question: string
  response: string
  passesKeywords: boolean
  length: number
  missingKeywords: string[]
}
```

---

## How to Add Questions

### Main Suite

Edit `src/lib/eval-suite.ts`, add to `TEST_CASES` array:

```typescript
{
  id: crypto.randomUUID(),
  agentId: "financial",                     // must match an existing agent
  input: "¿Cuál es el margen EBITDA del último trimestre?",
  expected: ["margen", "EBITDA", "trimestre"],
  category: "metrics",                      // use existing category or add new
  weight: 3,                                // 1-3
}
```

Rules:
- `agentId` must match one of: `financial`, `forecaster`, `researcher`, `synthesizer`
- `expected` keywords are case-insensitive matched
- `weight` affects aggregate scoring (higher = more important)
- `category` is for grouping in reports — use existing categories or extend

### Simplified Suite

Edit `src/lib/ai/eval-suite.ts`, add to `GOLDEN_QUESTIONS`:

```typescript
{
  question: "¿Cuál es el riesgo más crítico?",
  keywords: ["riesgo", "crítico", "impacto"]
}
```

---

## Expected Metrics Format

### Per-Agent Summary (`getAggregatedScore`)

```typescript
{
  avgScore: number     // 0-100, mean score across all runs
  passRate: number     // 0-100%, percentage of tests passed
  avgLatency: number   // ms, mean response time
}
```

### Run Output (console)

```
[Eval Suite] 4/5 tests passed (80%)
```

### Persistence

Results stored in `localStorage` under key `cos-eval-results` (main suite only). Capped at 500 entries.

---

## CI Integration Guide

### Option 1: Vitest Wrapper

Create `tests/eval-suite.test.ts`:

```typescript
import { runEval, getAggregatedScore } from "@/lib/eval-suite"

describe("Eval Suite — Financial Agent", () => {
  it("should pass all financial tests", async () => {
    const mockResponder = async (input: string) => {
      // Use a real LLM or mock
      return "El margen EBITDA es 15.4% en el último trimestre..."
    }
    const results = await runEval("financial", mockResponder)
    const passed = results.filter(r => r.passed).length
    expect(passed).toBeGreaterThanOrEqual(3) // at least 3/5
  })
})
```

Run: `npx vitest run tests/eval-suite.test.ts`

### Option 2: GitHub Actions

Add to `.github/workflows/eval-suite.yml`:

```yaml
name: Eval Suite
on: [pull_request]
jobs:
  eval:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx vitest run tests/eval-suite.test.ts
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

### Option 3: CLI Script

```bash
# Run eval for all agents
node -e "require('@/lib/eval-suite').runEval('financial', async (q) => { /* call LLM */ })"
```

---

## Notes

- The simplified suite (`ai/eval-suite.ts`) is a lightweight subset — consider merging into main suite
- Keyword-based scoring is approximate; replace with LLM-as-judge for production
- Latency metrics require real LLM calls (mocked responses will show ~0ms)
- Test cases with `crypto.randomUUID()` IDs are regenerated on every import — this is expected for dev mode
