export const financialDNA = {
  version: "1.0.0",
  lastUpdated: "2026-06-28",
  name: "Financial Intelligence DNA",
  description: "Reglas financieras, modelos, benchmarks y metodologías para el análisis financiero profundo.",

  models: [
    {
      name: "Modelo Dupont",
      formula: "ROE = (Net Income / Revenue) × (Revenue / Assets) × (Assets / Equity)",
      components: ["Margen Neto", "Rotación de Activos", "Apalancamiento Financiero"],
      useCase: "Descomponer el ROE para identificar qué palanca impulsa o limita la rentabilidad.",
    },
    {
      name: "Modelo DCF",
      formula: "Valor = Σ(FCFt / (1+WACC)^t) + (TV / (1+WACC)^n)",
      components: ["FCF Proyectado", "WACC", "Valor Terminal", "Deuda Neta"],
      useCase: "Valoración de empresas basada en flujos de caja futuros descontados.",
    },
    {
      name: "CAPM",
      formula: "Ke = Rf + β × (Rm - Rf)",
      components: ["Tasa Libre de Riesgo", "Beta", "Prima de Mercado"],
      useCase: "Cálculo del costo de capital propio para el WACC y valoración.",
    },
    {
      name: "WACC",
      formula: "WACC = (E/(D+E)) × Ke + (D/(D+E)) × Kd × (1-t)",
      components: ["Capital Propio", "Deuda", "Costo de Capital", "Escudo Fiscal"],
      useCase: "Tasa de descuento para valoración de empresas y evaluación de proyectos.",
    },
    {
      name: "EVA (Economic Value Added)",
      formula: "EVA = NOPAT - (Capital Invertido × WACC)",
      components: ["NOPAT", "Capital Invertido", "WACC"],
      useCase: "Medir si la empresa genera valor económico por encima del costo del capital.",
    },
    {
      name: "Altman Z-Score",
      formula: "Z = 1.2A + 1.4B + 3.3C + 0.6D + 1.0E",
      components: ["Capital de Trabajo/Activos", "Utilidades Retenidas/Activos", "EBIT/Activos", "Valor Mercado/Pasivos", "Ventas/Activos"],
      useCase: "Predicción de quiebra financiera. Z < 1.8: riesgo alto, Z > 3.0: seguro.",
    },
  ],

  keyIndicators: [
    { name: "Liquidez Corriente", formula: "AC / PC", healthy: "1.5 - 2.5", frequency: "mensual" },
    { name: "Prueba Ácida", formula: "(AC - Inventario) / PC", healthy: "1.0 - 1.5", frequency: "mensual" },
    { name: "Endeudamiento Patrimonial", formula: "Pasivo Total / Patrimonio", healthy: "0.5 - 1.5", frequency: "trimestral" },
    { name: "Cobertura de Intereses", formula: "EBIT / Gastos Financieros", healthy: "> 3.0", frequency: "trimestral" },
    { name: "Margen Neto", formula: "Utilidad Neta / Ventas", healthy: "> 8%", frequency: "mensual" },
    { name: "ROE", formula: "Utilidad Neta / Patrimonio", healthy: "> 15%", frequency: "trimestral" },
    { name: "ROA", formula: "Utilidad Neta / Activos Totales", healthy: "> 5%", frequency: "trimestral" },
    { name: "Rotación de Activos", formula: "Ventas / Activos Totales", healthy: "> 1.0", frequency: "anual" },
    { name: "Días de Cobro (DSO)", formula: "(Cuentas por Cobrar / Ventas) × 365", healthy: "< 45 días", frequency: "mensual" },
    { name: "Días de Inventario (DIO)", formula: "(Inventario / COGS) × 365", healthy: "< 60 días", frequency: "mensual" },
    { name: "Ciclo de Conversión de Efectivo", formula: "DIO + DSO - DPO", healthy: "< 90 días", frequency: "mensual" },
    { name: "EBITDA", formula: "Utilidad Operativa + Depreciación + Amortización", healthy: "> 0", frequency: "mensual" },
    { name: "Margen EBITDA", formula: "EBITDA / Ventas", healthy: "> 15%", frequency: "mensual" },
  ],

  benchmarks: [
    { sector: "Comercio", liquidity: "1.3-1.8", debtEquity: "1.5-2.5", netMargin: "3-8%", roe: "12-18%" },
    { sector: "Manufactura", liquidity: "1.5-2.0", debtEquity: "1.0-1.8", netMargin: "5-12%", roe: "10-20%" },
    { sector: "Construcción", liquidity: "1.2-1.5", debtEquity: "2.0-3.5", netMargin: "4-10%", roe: "8-15%" },
    { sector: "Servicios", liquidity: "1.4-1.9", debtEquity: "0.8-1.5", netMargin: "8-18%", roe: "15-25%" },
    { sector: "Tecnología", liquidity: "1.8-2.5", debtEquity: "0.3-0.8", netMargin: "12-25%", roe: "20-35%" },
    { sector: "Agricultura", liquidity: "1.6-2.2", debtEquity: "1.0-1.8", netMargin: "5-15%", roe: "8-16%" },
  ],

  scenarios: [
    { name: "Crecimiento Agresivo", variables: [{ name: "revenue", change: 0.2 }, { name: "cogs", change: 0.15 }, { name: "opex", change: 0.1 }] },
    { name: "Reestructuración", variables: [{ name: "debt", change: -0.3 }, { name: "interest", change: -0.3 }, { name: "equity", change: 0.2 }] },
    { name: "Optimización", variables: [{ name: "cogs", change: -0.1 }, { name: "opex", change: -0.15 }, { name: "inventory", change: -0.2 }] },
    { name: "Expansión", variables: [{ name: "revenue", change: 0.15 }, { name: "assets", change: 0.25 }, { name: "debt", change: 0.2 }] },
    { name: "Recesión", variables: [{ name: "revenue", change: -0.15 }, { name: "cogs", change: -0.05 }, { name: "provisions", change: 0.3 }] },
  ],
}
