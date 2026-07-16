# Hardcoded Data Inventory

This document lists ALL pages/components containing hardcoded or mock sample data, and specifies what database query or API call should replace each.

## Dashboard (`src/app/(dashboard)/dashboard/page.tsx`)

| Data | Lines | What it is | Should be replaced by |
|---|---|---|---|
| `QUARTERLY_DATA` | 28-57 | Tesla Q1-Q4 2025 quarterly financials | `GET /api/financials/quarterly?ticker=TSLA` or `select * from financial_statements where period = 'quarterly'` |
| `FY_DATA` | 59-74 | Tesla FY 2025 annual financials | `GET /api/financials/annual?ticker=TSLA&year=2025` |
| `narrativeMetrics` | 109-117 | Narrative insight metrics list | Derived from API response above |
| `healthCells` | 119-128 | Health scores (liquidez, solvencia) | Computed from financial ratios API |
| `waterfallData` | 130-140 | Waterfall P&L breakdown | `GET /api/financials/waterfall?ticker=TSLA` |
| Chart3D `data` | 313-318 | Quarterly revenue bars | Derived from quarterly API data |
| AreaTrendChart `data` | 340-345 | Revenue/EBITDA trends | Derived from quarterly API data |
| KPI detail rows (hardcoded text) | 228-232, 242-246, 256-260, 269-273 | Hardcoded detail labels | Dynamic from period comparison API |
| Title "Tesla, Inc." | 176 | Company name hardcoded | `company.name` from company profile API |
| What-If sliders | 285-298 | Default values for revenue growth, margin, etc. | User-adjustable (acceptable as UI state) |

## Margins (`src/app/(dashboard)/margins/page.tsx`)

| Data | Lines | What it is | Should be replaced by |
|---|---|---|---|
| `tesla2025` | 10-18 | Tesla FY 2025 P&L data | `GET /api/financials/annual?ticker=TSLA&year=2025` |
| `ratios` | 26-31 | Margin ratios | Computed from P&L API |
| `narrativeMetrics` | 33-38 | Narrative metrics | Derived from P&L API |
| `radarMetrics` | 41-47 | Radar chart scores | Should come from benchmarking API or computed |
| `marginHealth` | 50-56 | Health grid cells | Derived from financial ratios API |
| `pnlData` | 59-69 | Detailed P&L table rows | `GET /api/financials/pnl?ticker=TSLA&year=2025` |
| `isNegative` | 71 | Tag list | Should be configurable from schema |
| `waterfallItems` | 76-86 | Waterfall items | Derived from P&L API |
| Title "Tesla 2025" | 95 | Company/year hardcoded | Dynamic from params or API |
| BE, Safety Margin, ROE cards | 190-200 | Computed metrics | Derived from P&L API |

## Valuation (`src/app/(dashboard)/valuation/page.tsx`)

| Data | Lines | What it is | Should be replaced by |
|---|---|---|---|
| `tesla` object | 8-17 | Tesla FY 2025 summary figures | `GET /api/financials/summary?ticker=TSLA` |
| `dcfRows` | 22-32 | DCF valuation rows | `GET /api/valuation/dcf?ticker=TSLA` |
| `mc` | 34-41 | Monte Carlo simulation results | `GET /api/valuation/monte-carlo?ticker=TSLA` |
| `valMetrics` | 43-48 | Valuation narrative metrics | Derived from valuation API |
| `valHealth` | 50-57 | Valuation health scores | Derived from multiples API |
| Sinergias data | 143-161 | Hardcoded synergy values | `GET /api/valuation/synergies?ticker=TSLA` |
| Title "Tesla, Inc." | 64 | Company name hardcoded | Dynamic from company profile API |

## Stress Simulator (`src/app/(dashboard)/stress-simulator/page.tsx`)

| Data | Lines | What it is | Should be replaced by |
|---|---|---|---|
| `initial` sliders | 9-16 | Default simulation params | User-adjustable (acceptable as UI state) |
| `monthlyKPI` | 18-26 | Monthly base KPI for Tesla | `GET /api/financials/monthly?ticker=TSLA&month=latest` |
| `scenarioSliders` | 47-51 | Optimista/Pesimista presets | Could be AI-generated from historical volatility |
| `narrativeMetrics` | 53-57 | Narrative metrics | Derived from projection results |
| Title "Tesla 2025" | 110 | Hardcoded company | Dynamic from API |

## Agents (`src/app/(dashboard)/agents/page.tsx`)

| Data | Lines | What it is | Should be replaced by |
|---|---|---|---|
| `AGENTS` array | 10-15 | Agent definitions (id, label, icon, color) | `GET /api/agents` or config file |
| ModelBadge colors | 20 | Tier color mapping | Should come from theme config |
| Suggestion chips | 296-298, 396-399 | Sample suggestions | `GET /api/agents/{id}/suggestions` |

## Data Hub (`src/app/(dashboard)/data-hub/page.tsx`)

| Data | Lines | What it is | Should be replaced by |
|---|---|---|---|
| `REQUIRED_COLUMNS` | 14 | Column validation list | Configurable via admin settings |
| `COLUMN_ALIASES` | 16-20 | Column name mapping | Configurable or from DB schema |
| Hardcoded `FinancialNarrative` metrics | 147-148 | Post-import narrative (Revenue Estimado) | Actual imported data aggregation |
| `handleImport` timeout | 108 | `setTimeout(r, 1500)` mock | Real `POST /api/data-hub/import` |

## Operations (`src/app/(dashboard)/operations/page.tsx`)

| Data | Lines | What it is | Should be replaced by |
|---|---|---|---|
| Various tabs | 19-29 | Tab definitions | Acceptable as UI config |
| Mock SLOs, checks, etc. | (various) | Synthetic data in state | Real data from DB via lib functions |

## RAG (`src/app/(dashboard)/rag/page.tsx`)

| Data | Lines | What it is | Should be replaced by |
|---|---|---|---|
| `sampleText` | 128 | Sample Tesla Q4 text | User input (acceptable as placeholder) |

## Landing Page (`src/components/landing/`)

| Data | Lines | What it is | Should be replaced by |
|---|---|---|---|
| `testimonials` (Testimonials.tsx) | 6 | Testimonial cards | `GET /api/testimonials` or CMS |
| `problems` (ProblemSection.tsx) | 6 | Problem statements | CMS or config |
| `plans` (Pricing.tsx) | 9 | Pricing tiers | `GET /api/pricing` or CMS |
| `metrics` (MetricsSection.tsx) | 43 | Statistics numbers | `GET /api/metrics` |
| `logos` (LogoCloud.tsx) | 5 | Client logos | `GET /api/clients/logos` |
| `features` (FeaturesBento.tsx) | 17 | Feature cards | `GET /api/features` or CMS |
| `layers` (ArchitectureSection.tsx) | 7 | Architecture layers | `GET /api/architecture` or CMS |
| `before`/`after` (SolutionSection.tsx) | 7, 15 | Before/after data | CMS or API |
| `footerLinks` (Footer.tsx) | 3 | Navigation links | Config from settings |

## Knowledge Graph (`src/app/(dashboard)/knowledge-graph/page.tsx`)

| Data | Lines | What it is | Should be replaced by |
|---|---|---|---|
| `TYPE_COLORS` | 11-19 | Entity type color mapping | Theme config or API |
| Graph data | (via useKnowledgeGraph) | Entity/relation data | `GET /api/knowledge-graph/entities` |

## Due Diligence (`src/components/due-diligence/`)

| Data | Lines | What it is | Should be replaced by |
|---|---|---|---|
| `CHECKS` (ValidateStep.tsx) | 6 | Validation checklist | `GET /api/due-diligence/{id}/checks` |
| `recentClients` (CompanyStep.tsx) | 35 | Recent client list | `GET /api/clients/recent` |
