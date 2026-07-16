export interface IFRSConcept {
  code: string
  name: string
  definition: string
  type: "monetary" | "string" | "decimal" | "integer" | "date" | "boolean" | "perShare"
  balance: "debit" | "credit" | "none"
  periodType: "instant" | "duration"
  parentCode?: string
  references: string[]
  calculationWeight?: number
  isAbstract: boolean
  nillable: boolean
}

export const ifrsConcepts: IFRSConcept[] = [
  // ═══════════════════════════════════════════════════════════════
  // BALANCE SHEET — STATEMENT OF FINANCIAL POSITION
  // ═══════════════════════════════════════════════════════════════
  {
    code: "ifrs-full:Assets",
    name: "Activos",
    definition: "Recursos controlados por la entidad como resultado de eventos pasados, de los cuales se esperan beneficios económicos futuros.",
    type: "monetary", balance: "debit", periodType: "instant",
    references: ["NIC 1.55", "Marco Conceptual 4.4(a)"], isAbstract: true, nillable: false,
  },
  {
    code: "ifrs-full:CurrentAssets",
    name: "Activos Corrientes",
    definition: "Activos que se espera realizar, vender o consumir en el ciclo normal de operación o dentro de los 12 meses.",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:Assets", references: ["NIC 1.66", "NIC 1.57"], isAbstract: true, nillable: false, calculationWeight: 1,
  },
  {
    code: "ifrs-full:CashAndCashEquivalents",
    name: "Efectivo y Equivalentes al Efectivo",
    definition: "Efectivo en caja, depósitos a la vista e inversiones a corto plazo altamente líquidas con vencimiento original ≤ 3 meses.",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:CurrentAssets", references: ["NIC 7.6", "NIC 1.54(i)"], isAbstract: false, nillable: false, calculationWeight: 1,
  },
  {
    code: "ifrs-full:TradeAndOtherCurrentReceivables",
    name: "Cuentas por Cobrar Comerciales y Otras",
    definition: "Derechos de cobro por ventas de bienes o servicios en el curso normal de operación, más otros deudores corrientes.",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:CurrentAssets", references: ["NIC 1.54(h)", "NIIF 9"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:CurrentInventories",
    name: "Inventarios Corrientes",
    definition: "Activos mantenidos para venta en el curso normal, en proceso de producción o en forma de materiales o insumos.",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:CurrentAssets", references: ["NIC 2.6", "NIC 1.54(g)"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:CurrentTaxAssetsCurrent",
    name: "Activos por Impuestos Corrientes",
    definition: "Excedentes de pagos de impuestos sobre liquidaciones presentes o períodos anteriores, recuperables en el corto plazo.",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:CurrentAssets", references: ["NIC 12.5", "NIC 12.12"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:OtherCurrentAssets",
    name: "Otros Activos Corrientes",
    definition: "Activos corrientes no clasificados en las categorías anteriores.",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:CurrentAssets", references: ["NIC 1.55"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:NoncurrentAssets",
    name: "Activos No Corrientes",
    definition: "Activos que no cumplen los criterios para ser clasificados como corrientes.",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:Assets", references: ["NIC 1.66"], isAbstract: true, nillable: false, calculationWeight: 1,
  },
  {
    code: "ifrs-full:PropertyPlantAndEquipment",
    name: "Propiedades, Planta y Equipo",
    definition: "Activos tangibles mantenidos para uso en producción, suministro de bienes/servicios, arrendamiento o fines administrativos, esperados para usar más de un período.",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:NoncurrentAssets", references: ["NIC 16.6", "NIC 1.54(a)"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:IntangibleAssetsOtherThanGoodwill",
    name: "Activos Intangibles Distintos de Plusvalía",
    definition: "Activos no monetarios identificables sin sustancia física, como patentes, marcas, software, licencias.",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:NoncurrentAssets", references: ["NIC 38.8", "NIC 1.54(c)"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:Goodwill",
    name: "Plusvalía",
    definition: "Exceso del costo de una combinación de negocios sobre el interés de la adquirente en el valor razonable neto de activos y pasivos identificables.",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:NoncurrentAssets", references: ["NIIF 3.32", "NIC 1.54(c)"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:InvestmentProperty",
    name: "Propiedades de Inversión",
    definition: "Propiedades mantenidas para obtener rentas o apreciación de capital, no para uso en producción o venta ordinaria.",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:NoncurrentAssets", references: ["NIC 40.5", "NIC 1.54(b)"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:InvestmentsAccountedForUsingEquityMethod",
    name: "Inversiones Contabilizadas por el Método de Participación",
    definition: "Inversiones en asociadas y negocios conjuntos registradas bajo el método de participación.",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:NoncurrentAssets", references: ["NIC 28.10", "NIC 1.54(e)"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:DeferredTaxAssets",
    name: "Activos por Impuestos Diferidos",
    definition: "Impuestos recuperables en períodos futuros por diferencias temporarias deducibles, pérdidas fiscales no utilizadas o créditos no utilizados.",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:NoncurrentAssets", references: ["NIC 12.5", "NIC 12.24"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:OtherNoncurrentAssets",
    name: "Otros Activos No Corrientes",
    definition: "Activos no corrientes no clasificados en categorías anteriores.",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:NoncurrentAssets", references: ["NIC 1.55"], isAbstract: false, nillable: true, calculationWeight: 1,
  },

  // ═══════════════════════════════════════════════════════════════
  // LIABILITIES
  // ═══════════════════════════════════════════════════════════════
  {
    code: "ifrs-full:Liabilities",
    name: "Pasivos",
    definition: "Obligaciones presentes de la entidad surgidas de eventos pasados, cuya liquidación se espera que resulte en una salida de recursos.",
    type: "monetary", balance: "credit", periodType: "instant",
    references: ["NIC 1.55", "Marco Conceptual 4.4(b)"], isAbstract: true, nillable: false,
  },
  {
    code: "ifrs-full:CurrentLiabilities",
    name: "Pasivos Corrientes",
    definition: "Pasivos que se espera liquidar en el ciclo normal de operación o dentro de los 12 meses, o mantenidos para negociación.",
    type: "monetary", balance: "credit", periodType: "instant",
    parentCode: "ifrs-full:Liabilities", references: ["NIC 1.69", "NIC 1.60"], isAbstract: true, nillable: false, calculationWeight: 1,
  },
  {
    code: "ifrs-full:TradeAndOtherCurrentPayables",
    name: "Cuentas por Pagar Comerciales y Otras",
    definition: "Obligaciones de pago por bienes o servicios adquiridos en el curso normal de operación, más otros acreedores corrientes.",
    type: "monetary", balance: "credit", periodType: "instant",
    parentCode: "ifrs-full:CurrentLiabilities", references: ["NIC 1.54(k)", "NIIF 9"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:ShortTermBorrowings",
    name: "Préstamos a Corto Plazo",
    definition: "Obligaciones financieras con vencimiento ≤ 12 meses, incluyendo porciones corrientes de deuda a largo plazo.",
    type: "monetary", balance: "credit", periodType: "instant",
    parentCode: "ifrs-full:CurrentLiabilities", references: ["NIC 1.54(m)", "NIIF 9"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:CurrentTaxLiabilitiesCurrent",
    name: "Pasivos por Impuestos Corrientes",
    definition: "Obligaciones tributarias pendientes de pago relacionadas con el impuesto a la renta del período presente o anteriores.",
    type: "monetary", balance: "credit", periodType: "instant",
    parentCode: "ifrs-full:CurrentLiabilities", references: ["NIC 12.5", "NIC 12.12"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:OtherCurrentLiabilities",
    name: "Otros Pasivos Corrientes",
    definition: "Pasivos corrientes no clasificados en categorías anteriores como provisiones a corto plazo, ingresos diferidos, etc.",
    type: "monetary", balance: "credit", periodType: "instant",
    parentCode: "ifrs-full:CurrentLiabilities", references: ["NIC 1.55"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:NoncurrentLiabilities",
    name: "Pasivos No Corrientes",
    definition: "Pasivos que no cumplen los criterios para ser clasificados como corrientes.",
    type: "monetary", balance: "credit", periodType: "instant",
    parentCode: "ifrs-full:Liabilities", references: ["NIC 1.69"], isAbstract: true, nillable: false, calculationWeight: 1,
  },
  {
    code: "ifrs-full:LongTermBorrowings",
    name: "Préstamos a Largo Plazo",
    definition: "Obligaciones financieras con vencimiento > 12 meses, incluyendo bonos, préstamos bancarios y otras deudas financieras.",
    type: "monetary", balance: "credit", periodType: "instant",
    parentCode: "ifrs-full:NoncurrentLiabilities", references: ["NIC 1.54(m)", "NIIF 9"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:DeferredTaxLiabilities",
    name: "Pasivos por Impuestos Diferidos",
    definition: "Impuestos a pagar en períodos futuros por diferencias temporarias imponibles relacionadas con diferencias entre base contable y fiscal.",
    type: "monetary", balance: "credit", periodType: "instant",
    parentCode: "ifrs-full:NoncurrentLiabilities", references: ["NIC 12.5", "NIC 12.15"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:ProvisionsNoncurrent",
    name: "Provisiones No Corrientes",
    definition: "Pasivos de monto o vencimiento inciertos, pero estimables, con vencimiento esperado > 12 meses.",
    type: "monetary", balance: "credit", periodType: "instant",
    parentCode: "ifrs-full:NoncurrentLiabilities", references: ["NIC 37.14", "NIC 1.54(l)"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:OtherNoncurrentLiabilities",
    name: "Otros Pasivos No Corrientes",
    definition: "Pasivos no corrientes no clasificados en categorías anteriores.",
    type: "monetary", balance: "credit", periodType: "instant",
    parentCode: "ifrs-full:NoncurrentLiabilities", references: ["NIC 1.55"], isAbstract: false, nillable: true, calculationWeight: 1,
  },

  // ═══════════════════════════════════════════════════════════════
  // EQUITY
  // ═══════════════════════════════════════════════════════════════
  {
    code: "ifrs-full:Equity",
    name: "Patrimonio Neto",
    definition: "Participación residual en los activos de la entidad después de deducir todos sus pasivos.",
    type: "monetary", balance: "credit", periodType: "instant",
    references: ["NIC 1.55", "Marco Conceptual 4.4(c)"], isAbstract: true, nillable: false,
  },
  {
    code: "ifrs-full:IssuedCapital",
    name: "Capital Emitido",
    definition: "Valor nominal de las acciones emitidas y pagadas por los accionistas.",
    type: "monetary", balance: "credit", periodType: "instant",
    parentCode: "ifrs-full:Equity", references: ["NIC 1.54(r)", "NIC 1.78(a)"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:SharePremium",
    name: "Prima de Emisión",
    definition: "Exceso del precio de emisión sobre el valor nominal de las acciones.",
    type: "monetary", balance: "credit", periodType: "instant",
    parentCode: "ifrs-full:Equity", references: ["NIC 1.78(b)"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:RetainedEarnings",
    name: "Resultados Acumulados / Utilidades Retenidas",
    definition: "Ganancias acumuladas no distribuidas como dividendos ni capitalizadas.",
    type: "monetary", balance: "credit", periodType: "instant",
    parentCode: "ifrs-full:Equity", references: ["NIC 1.54(r)", "NIC 1.78(e)"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:OtherReserves",
    name: "Otras Reservas",
    definition: "Reservas de revaluación, reservas legales, reservas estatutarias y otras partidas de patrimonio no distribuidas.",
    type: "monetary", balance: "credit", periodType: "instant",
    parentCode: "ifrs-full:Equity", references: ["NIC 1.54(r)", "NIC 1.78(c)-(d)"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:NoncontrollingInterests",
    name: "Participaciones No Controladoras",
    definition: "Porción del patrimonio de una subsidiaria no atribuible a la controladora.",
    type: "monetary", balance: "credit", periodType: "instant",
    parentCode: "ifrs-full:Equity", references: ["NIIF 10.22", "NIC 1.54(q)"], isAbstract: false, nillable: true, calculationWeight: 1,
  },

  // ═══════════════════════════════════════════════════════════════
  // INCOME STATEMENT — STATEMENT OF PROFIT OR LOSS
  // ═══════════════════════════════════════════════════════════════
  {
    code: "ifrs-full:ProfitLoss",
    name: "Resultado del Período / Utilidad (Pérdida) Neta",
    definition: "Ingresos menos gastos, incluyendo ingresos y gastos de operaciones continuadas y discontinuadas.",
    type: "monetary", balance: "credit", periodType: "duration",
    references: ["NIC 1.81A(a)", "NIC 1.103"], isAbstract: true, nillable: false,
  },
  {
    code: "ifrs-full:Revenue",
    name: "Ingresos de Actividades Ordinarias",
    definition: "Entradas brutas de beneficios económicos recibidos o por recibir por ventas de bienes, prestación de servicios, intereses, regalías o dividendos en el curso normal de operación.",
    type: "monetary", balance: "credit", periodType: "duration",
    parentCode: "ifrs-full:ProfitLoss", references: ["NIIF 15.31", "NIC 1.82(a)"], isAbstract: false, nillable: false, calculationWeight: 1,
  },
  {
    code: "ifrs-full:CostOfSales",
    name: "Costo de Ventas",
    definition: "Costos directamente atribuibles a la generación de ingresos, incluyendo materiales, mano de obra directa y costos indirectos de producción.",
    type: "monetary", balance: "debit", periodType: "duration",
    parentCode: "ifrs-full:ProfitLoss", references: ["NIC 2.34", "NIC 1.103"], isAbstract: false, nillable: true, calculationWeight: -1,
  },
  {
    code: "ifrs-full:GrossProfit",
    name: "Utilidad Bruta",
    definition: "Ingresos menos costo de ventas. Indicador de eficiencia en producción y fijación de precios.",
    type: "monetary", balance: "credit", periodType: "duration",
    parentCode: "ifrs-full:ProfitLoss", references: ["NIC 1.103"], isAbstract: false, nillable: true,
  },
  {
    code: "ifrs-full:SellingAndDistributionExpenses",
    name: "Gastos de Ventas y Distribución",
    definition: "Gastos directamente relacionados con la venta y distribución de productos o servicios.",
    type: "monetary", balance: "debit", periodType: "duration",
    parentCode: "ifrs-full:ProfitLoss", references: ["NIC 1.103"], isAbstract: false, nillable: true, calculationWeight: -1,
  },
  {
    code: "ifrs-full:AdministrativeExpenses",
    name: "Gastos Administrativos",
    definition: "Gastos relacionados con la administración general de la entidad.",
    type: "monetary", balance: "debit", periodType: "duration",
    parentCode: "ifrs-full:ProfitLoss", references: ["NIC 1.103"], isAbstract: false, nillable: true, calculationWeight: -1,
  },
  {
    code: "ifrs-full:OtherOperatingIncome",
    name: "Otros Ingresos Operativos",
    definition: "Ingresos operativos no derivados de las actividades ordinarias principales.",
    type: "monetary", balance: "credit", periodType: "duration",
    parentCode: "ifrs-full:ProfitLoss", references: ["NIC 1.103"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:OperatingProfitLoss",
    name: "Utilidad (Pérdida) Operativa",
    definition: "Resultado de actividades operativas antes de ingresos/gastos financieros e impuestos.",
    type: "monetary", balance: "credit", periodType: "duration",
    parentCode: "ifrs-full:ProfitLoss", references: ["NIC 1.103"], isAbstract: false, nillable: true,
  },
  {
    code: "ifrs-full:FinanceIncome",
    name: "Ingresos Financieros",
    definition: "Ingresos por intereses, dividendos y otros rendimientos financieros.",
    type: "monetary", balance: "credit", periodType: "duration",
    parentCode: "ifrs-full:ProfitLoss", references: ["NIC 1.82(b)", "NIIF 7.20"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:FinanceCosts",
    name: "Costos Financieros",
    definition: "Gastos por intereses y otros costos de financiamiento.",
    type: "monetary", balance: "debit", periodType: "duration",
    parentCode: "ifrs-full:ProfitLoss", references: ["NIC 1.82(b)", "NIC 23.8", "NIIF 7.20"], isAbstract: false, nillable: true, calculationWeight: -1,
  },
  {
    code: "ifrs-full:ProfitLossBeforeTax",
    name: "Utilidad (Pérdida) Antes de Impuestos",
    definition: "Resultado antes del gasto por impuesto a las ganancias.",
    type: "monetary", balance: "credit", periodType: "duration",
    parentCode: "ifrs-full:ProfitLoss", references: ["NIC 1.82(d)", "NIC 12.79"], isAbstract: false, nillable: true,
  },
  {
    code: "ifrs-full:IncomeTaxExpenseContinuingOperations",
    name: "Gasto por Impuesto a las Ganancias",
    definition: "Total del impuesto corriente y diferido incluido en el resultado del período.",
    type: "monetary", balance: "debit", periodType: "duration",
    parentCode: "ifrs-full:ProfitLoss", references: ["NIC 12.5", "NIC 12.79"], isAbstract: false, nillable: true, calculationWeight: -1,
  },
  {
    code: "ifrs-full:ProfitLossFromContinuingOperations",
    name: "Resultado de Operaciones Continuadas",
    definition: "Resultado del período proveniente de operaciones que la entidad continúa realizando.",
    type: "monetary", balance: "credit", periodType: "duration",
    parentCode: "ifrs-full:ProfitLoss", references: ["NIIF 5.33(a)", "NIC 1.82(e)"], isAbstract: false, nillable: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // CASH FLOW STATEMENT
  // ═══════════════════════════════════════════════════════════════
  {
    code: "ifrs-full:NetCashFlowsFromOperatingActivities",
    name: "Flujos de Efectivo Netos de Actividades de Operación",
    definition: "Flujos de efectivo provenientes de las actividades principales generadoras de ingresos de la entidad.",
    type: "monetary", balance: "credit", periodType: "duration",
    references: ["NIC 7.10", "NIC 7.18"], isAbstract: false, nillable: true,
  },
  {
    code: "ifrs-full:NetCashFlowsFromInvestingActivities",
    name: "Flujos de Efectivo Netos de Actividades de Inversión",
    definition: "Flujos de efectivo por adquisición y disposición de activos a largo plazo y otras inversiones.",
    type: "monetary", balance: "credit", periodType: "duration",
    references: ["NIC 7.10", "NIC 7.16"], isAbstract: false, nillable: true,
  },
  {
    code: "ifrs-full:NetCashFlowsFromFinancingActivities",
    name: "Flujos de Efectivo Netos de Actividades de Financiación",
    definition: "Flujos de efectivo por transacciones con propietarios y obtención/repago de financiamiento.",
    type: "monetary", balance: "credit", periodType: "duration",
    references: ["NIC 7.10", "NIC 7.17"], isAbstract: false, nillable: true,
  },
  {
    code: "ifrs-full:CashAndCashEquivalentsPeriodIncreaseDecrease",
    name: "Aumento (Disminución) Neto de Efectivo",
    definition: "Suma de flujos netos de operación, inversión y financiación; variación neta del efectivo en el período.",
    type: "monetary", balance: "credit", periodType: "duration",
    references: ["NIC 7.45"], isAbstract: false, nillable: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // COMPREHENSIVE INCOME — OTHER COMPREHENSIVE INCOME
  // ═══════════════════════════════════════════════════════════════
  {
    code: "ifrs-full:OtherComprehensiveIncome",
    name: "Otro Resultado Integral",
    definition: "Partidas de ingresos y gastos no reconocidas en el resultado del período según NIIF.",
    type: "monetary", balance: "credit", periodType: "duration",
    references: ["NIC 1.81A(b)", "NIC 1.7"], isAbstract: true, nillable: true,
  },
  {
    code: "ifrs-full:OtherComprehensiveIncomeNetOfTax",
    name: "Otro Resultado Integral Neto de Impuestos",
    definition: "Otro resultado integral después del efecto de impuestos.",
    type: "monetary", balance: "credit", periodType: "duration",
    parentCode: "ifrs-full:OtherComprehensiveIncome", references: ["NIC 1.91"], isAbstract: false, nillable: true,
  },
  {
    code: "ifrs-full:ComprehensiveIncome",
    name: "Resultado Integral Total",
    definition: "Cambio en el patrimonio durante el período, excluyendo transacciones con propietarios. = Utilidad Neta + ORI.",
    type: "monetary", balance: "credit", periodType: "duration",
    references: ["NIC 1.81A(c)", "NIC 1.7"], isAbstract: false, nillable: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // EARNINGS PER SHARE
  // ═══════════════════════════════════════════════════════════════
  {
    code: "ifrs-full:BasicEarningsPerShare",
    name: "Ganancia Básica por Acción (GPA)",
    definition: "Resultado atribuible a tenedores de instrumentos de patrimonio dividido por número promedio ponderado de acciones.",
    type: "perShare", balance: "credit", periodType: "duration",
    references: ["NIC 33.66", "NIC 1.66"], isAbstract: false, nillable: true,
  },
  {
    code: "ifrs-full:DilutedEarningsPerShare",
    name: "Ganancia Diluida por Acción",
    definition: "GPA ajustado por el efecto de todas las acciones ordinarias potenciales dilutivas.",
    type: "perShare", balance: "credit", periodType: "duration",
    references: ["NIC 33.66"], isAbstract: false, nillable: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // NIIF 16 — ARRENDAMIENTOS (LEASES)
  // ═══════════════════════════════════════════════════════════════
  {
    code: "ifrs-full:RightOfUseAssets",
    name: "Activos por Derecho de Uso",
    definition: "Activo que representa el derecho del arrendatario a usar un activo subyacente durante el plazo del arrendamiento.",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:NoncurrentAssets", references: ["NIIF 16.22", "NIIF 16.47(a)"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:RightOfUseAssetsPPE",
    name: "Activos por Derecho de Uso — PPE",
    definition: "Activos por derecho de uso clasificados como propiedades, planta y equipo.",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:RightOfUseAssets", references: ["NIIF 16.47(a)"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:LeaseLiabilities",
    name: "Pasivos por Arrendamiento",
    definition: "Obligación del arrendatario de realizar pagos por arrendamiento, medida al valor presente de los pagos no pagados.",
    type: "monetary", balance: "credit", periodType: "instant",
    parentCode: "ifrs-full:NoncurrentLiabilities", references: ["NIIF 16.22", "NIIF 16.47(b)"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:CurrentLeaseLiabilities",
    name: "Pasivos por Arrendamiento — Corto Plazo",
    definition: "Porción corriente de los pasivos por arrendamiento con vencimiento ≤ 12 meses.",
    type: "monetary", balance: "credit", periodType: "instant",
    parentCode: "ifrs-full:CurrentLiabilities", references: ["NIIF 16.47(b)", "NIC 1.69"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:DepreciationRightOfUseAssets",
    name: "Depreciación de Activos por Derecho de Uso",
    definition: "Gasto por depreciación de activos por derecho de uso reconocido en el resultado del período.",
    type: "monetary", balance: "debit", periodType: "duration",
    parentCode: "ifrs-full:ProfitLoss", references: ["NIIF 16.30", "NIIF 16.53(a)"], isAbstract: false, nillable: true, calculationWeight: -1,
  },
  {
    code: "ifrs-full:InterestOnLeaseLiabilities",
    name: "Intereses sobre Pasivos por Arrendamiento",
    definition: "Gasto financiero por intereses devengados sobre pasivos por arrendamiento.",
    type: "monetary", balance: "debit", periodType: "duration",
    parentCode: "ifrs-full:ProfitLoss", references: ["NIIF 16.53(b)", "NIC 1.82(b)"], isAbstract: false, nillable: true, calculationWeight: -1,
  },
  {
    code: "ifrs-full:VariableLeasePayments",
    name: "Pagos Variables por Arrendamiento",
    definition: "Pagos por arrendamiento que varían debido a cambios en hechos o circunstancias posteriores al inicio del arrendamiento.",
    type: "monetary", balance: "debit", periodType: "duration",
    parentCode: "ifrs-full:ProfitLoss", references: ["NIIF 16.53(c)"], isAbstract: false, nillable: true, calculationWeight: -1,
  },

  // ═══════════════════════════════════════════════════════════════
  // NIIF 7 / NIIF 9 — INSTRUMENTOS FINANCIEROS
  // ═══════════════════════════════════════════════════════════════
  {
    code: "ifrs-full:FinancialAssets",
    name: "Activos Financieros",
    definition: "Efectivo, instrumentos de patrimonio de otras entidades, o derechos contractuales a recibir efectivo/u otros activos financieros.",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:Assets", references: ["NIC 32.11", "NIIF 9.2.1", "NIIF 7.8"], isAbstract: true, nillable: false, calculationWeight: 1,
  },
  {
    code: "ifrs-full:FinancialAssetsAtFairValueThroughProfitOrLoss",
    name: "Activos Financieros a Valor Razonable con Cambios en Resultados",
    definition: "Activos financieros medidos a valor razonable, con cambios reconocidos en resultados (incluye mantenidos para negociación).",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:FinancialAssets", references: ["NIIF 9.4.1.4", "NIIF 7.8(a)"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:FinancialAssetsAtFairValueThroughOCI",
    name: "Activos Financieros a Valor Razonable con Cambios en ORI",
    definition: "Instrumentos de patrimonio designados irrevocablemente a VR con cambios en ORI, e instrumentos de deuda a VR-ORI según modelo de negocio.",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:FinancialAssets", references: ["NIIF 9.4.1.2", "NIIF 9.5.7.5", "NIIF 7.8(h)"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:FinancialAssetsAtAmortisedCost",
    name: "Activos Financieros a Costo Amortizado",
    definition: "Activos financieros mantenidos bajo modelo de negocio de cobro de flujos contractuales, con pagos solo de principal e intereses.",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:FinancialAssets", references: ["NIIF 9.4.1.2", "NIIF 9.5.4.1", "NIIF 7.8(f)"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:DerivativeFinancialAssets",
    name: "Activos Financieros Derivados",
    definition: "Instrumentos derivados con valor razonable positivo (opciones, futuros, forwards, swaps) clasificados como activos financieros.",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:FinancialAssets", references: ["NIIF 9.4.1.4", "NIIF 7.8(a)", "NIC 32.11"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:FinancialLiabilities",
    name: "Pasivos Financieros",
    definition: "Obligaciones contractuales de entregar efectivo u otros activos financieros a otra entidad o intercambiar activos financieros en condiciones potencialmente desfavorables.",
    type: "monetary", balance: "credit", periodType: "instant",
    parentCode: "ifrs-full:Liabilities", references: ["NIC 32.11", "NIIF 9.2.1", "NIIF 7.8"], isAbstract: true, nillable: false, calculationWeight: 1,
  },
  {
    code: "ifrs-full:FinancialLiabilitiesAtFairValueThroughProfitOrLoss",
    name: "Pasivos Financieros a Valor Razonable con Cambios en Resultados",
    definition: "Pasivos financieros mantenidos para negociación o designados a VR con cambios en resultados.",
    type: "monetary", balance: "credit", periodType: "instant",
    parentCode: "ifrs-full:FinancialLiabilities", references: ["NIIF 9.4.2.2", "NIIF 7.8(e)"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:FinancialLiabilitiesAtAmortisedCost",
    name: "Pasivos Financieros a Costo Amortizado",
    definition: "Pasivos financieros no clasificados a VR con cambios en resultados, medidos usando el método de interés efectivo.",
    type: "monetary", balance: "credit", periodType: "instant",
    parentCode: "ifrs-full:FinancialLiabilities", references: ["NIIF 9.4.2.1", "NIIF 7.8(g)"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:DerivativeFinancialLiabilities",
    name: "Pasivos Financieros Derivados",
    definition: "Instrumentos derivados con valor razonable negativo (opciones, futuros, forwards, swaps) clasificados como pasivos financieros.",
    type: "monetary", balance: "credit", periodType: "instant",
    parentCode: "ifrs-full:FinancialLiabilities", references: ["NIIF 9.4.2.2", "NIIF 7.8(e)", "NIC 32.11"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:AllowanceForExpectedCreditLosses",
    name: "Pérdidas Crediticias Esperadas (Deterioro)",
    definition: "Deterioro de activos financieros medido como valor presente de las diferencias entre flujos contractuales y flujos esperados.",
    type: "monetary", balance: "credit", periodType: "instant",
    parentCode: "ifrs-full:FinancialAssets", references: ["NIIF 9.5.5.1", "NIIF 7.35B", "NIIF 9.5.5.15"], isAbstract: false, nillable: true, calculationWeight: -1,
  },
  {
    code: "ifrs-full:ImpairmentLossFinancialAssets",
    name: "Pérdida por Deterioro de Activos Financieros",
    definition: "Gasto por deterioro de activos financieros según modelo de pérdidas crediticias esperadas (ECL).",
    type: "monetary", balance: "debit", periodType: "duration",
    parentCode: "ifrs-full:ProfitLoss", references: ["NIIF 9.5.5.1", "NIIF 7.35B"], isAbstract: false, nillable: true, calculationWeight: -1,
  },

  // ═══════════════════════════════════════════════════════════════
  // NIC 19 — BENEFICIOS A EMPLEADOS
  // ═══════════════════════════════════════════════════════════════
  {
    code: "ifrs-full:EmployeeBenefitsExpense",
    name: "Gastos de Beneficios a Empleados",
    definition: "Total de remuneraciones, aportaciones, beneficios post-empleo y otros beneficios al personal.",
    type: "monetary", balance: "debit", periodType: "duration",
    parentCode: "ifrs-full:ProfitLoss", references: ["NIC 19.5", "NIC 1.104"], isAbstract: true, nillable: true, calculationWeight: -1,
  },
  {
    code: "ifrs-full:WagesAndSalaries",
    name: "Sueldos y Salarios",
    definition: "Remuneraciones fijas y variables pagadas a empleados por servicios prestados en el período.",
    type: "monetary", balance: "debit", periodType: "duration",
    parentCode: "ifrs-full:EmployeeBenefitsExpense", references: ["NIC 19.5", "NIC 19.10"], isAbstract: false, nillable: true, calculationWeight: -1,
  },
  {
    code: "ifrs-full:SocialSecurityContributions",
    name: "Aportaciones a la Seguridad Social",
    definition: "Aportaciones patronales a sistemas de seguridad social, salud, pensiones y otros fondos obligatorios.",
    type: "monetary", balance: "debit", periodType: "duration",
    parentCode: "ifrs-full:EmployeeBenefitsExpense", references: ["NIC 19.5"], isAbstract: false, nillable: true, calculationWeight: -1,
  },
  {
    code: "ifrs-full:ShortTermEmployeeBenefits",
    name: "Beneficios a Empleados a Corto Plazo",
    definition: "Beneficios cuyo pago se espera liquidar dentro de los 12 meses siguientes al cierre del período.",
    type: "monetary", balance: "debit", periodType: "duration",
    parentCode: "ifrs-full:EmployeeBenefitsExpense", references: ["NIC 19.9", "NIC 19.11"], isAbstract: false, nillable: true, calculationWeight: -1,
  },
  {
    code: "ifrs-full:DefinedBenefitObligation",
    name: "Obligación por Beneficios Definidos",
    definition: "Valor presente de las obligaciones de la entidad por planes de beneficios post-empleo de tipo definido, antes de deducir activos del plan.",
    type: "monetary", balance: "credit", periodType: "instant",
    parentCode: "ifrs-full:NoncurrentLiabilities", references: ["NIC 19.63", "NIC 19.57(a)"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:PlanAssets",
    name: "Activos del Plan",
    definition: "Activos mantenidos en un fondo de beneficios a largo plazo, dedicados exclusivamente al pago de beneficios a empleados.",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:NoncurrentAssets", references: ["NIC 19.8", "NIC 19.57(b)"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:DefinedBenefitPlanNetLiability",
    name: "Pasivo (Activo) Neto por Beneficios Definidos",
    definition: "Déficit o superávit de un plan de beneficios definidos = Obligación - Activos del Plan.",
    type: "monetary", balance: "credit", periodType: "instant",
    parentCode: "ifrs-full:NoncurrentLiabilities", references: ["NIC 19.63", "NIC 19.57(c)"], isAbstract: false, nillable: true,
  },
  {
    code: "ifrs-full:TerminationBenefits",
    name: "Beneficios por Terminación",
    definition: "Beneficios pagados como compensación por terminación anticipada de relación laboral.",
    type: "monetary", balance: "debit", periodType: "duration",
    parentCode: "ifrs-full:EmployeeBenefitsExpense", references: ["NIC 19.165", "NIC 19.170"], isAbstract: false, nillable: true, calculationWeight: -1,
  },
  {
    code: "ifrs-full:ShareBasedPaymentExpense",
    name: "Gasto por Pagos Basados en Acciones",
    definition: "Gasto reconocido por transacciones con pagos basados en acciones liquidadas con instrumentos de patrimonio o efectivo.",
    type: "monetary", balance: "debit", periodType: "duration",
    parentCode: "ifrs-full:ProfitLoss", references: ["NIIF 2.7", "NIIF 2.10"], isAbstract: false, nillable: true, calculationWeight: -1,
  },
  {
    code: "ifrs-full:ShareBasedPaymentReserve",
    name: "Reserva por Pagos Basados en Acciones",
    definition: "Reserva de patrimonio por transacciones con pagos basados en acciones liquidadas con instrumentos de patrimonio.",
    type: "monetary", balance: "credit", periodType: "instant",
    parentCode: "ifrs-full:Equity", references: ["NIIF 2.7", "NIIF 2.43"], isAbstract: false, nillable: true, calculationWeight: 1,
  },

  // ═══════════════════════════════════════════════════════════════
  // NIC 37 — PROVISIONES, PASIVOS CONTINGENTES
  // ═══════════════════════════════════════════════════════════════
  {
    code: "ifrs-full:Provisions",
    name: "Provisiones",
    definition: "Pasivos de monto o vencimiento inciertos, que cumplen con criterios de reconocimiento (obligación presente, salida probable, estimación fiable).",
    type: "monetary", balance: "credit", periodType: "instant",
    parentCode: "ifrs-full:Liabilities", references: ["NIC 37.14", "NIC 37.10"], isAbstract: true, nillable: false, calculationWeight: 1,
  },
  {
    code: "ifrs-full:ProvisionsCurrent",
    name: "Provisiones Corrientes",
    definition: "Provisiones cuyo vencimiento se espera dentro de los 12 meses.",
    type: "monetary", balance: "credit", periodType: "instant",
    parentCode: "ifrs-full:CurrentLiabilities", references: ["NIC 37.14"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:ProvisionForWarrantyObligations",
    name: "Provisión para Garantías",
    definition: "Obligación estimada por reparaciones o reemplazos bajo garantías otorgadas a clientes sobre productos vendidos.",
    type: "monetary", balance: "credit", periodType: "instant",
    parentCode: "ifrs-full:Provisions", references: ["NIC 37.14", "NIC 37.63"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:ProvisionForLegalClaims",
    name: "Provisión para Litigios",
    definition: "Obligación estimada por demandas legales, arbitrajes o reclamaciones judiciales con probabilidad de fallo desfavorable.",
    type: "monetary", balance: "credit", periodType: "instant",
    parentCode: "ifrs-full:Provisions", references: ["NIC 37.14", "NIC 37.63"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:ProvisionForRestructuring",
    name: "Provisión para Reestructuración",
    definition: "Obligación estimada por costos de reestructuración (indemnizaciones, cierre de instalaciones, etc.) cuando existe un plan formal y expectativa válida.",
    type: "monetary", balance: "credit", periodType: "instant",
    parentCode: "ifrs-full:Provisions", references: ["NIC 37.72", "NIC 37.71"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:ProvisionForEnvironmentalRemediation",
    name: "Provisión para Remediamiento Ambiental",
    definition: "Obligación estimada por costos de limpieza, restauración o remediación de daños ambientales.",
    type: "monetary", balance: "credit", periodType: "instant",
    parentCode: "ifrs-full:Provisions", references: ["NIC 37.14", "NIC 37.63"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:ProvisionForOnerousContracts",
    name: "Provisión para Contratos Onerosos",
    definition: "Obligación estimada por contratos donde los costos inevitables exceden los beneficios económicos esperados.",
    type: "monetary", balance: "credit", periodType: "instant",
    parentCode: "ifrs-full:Provisions", references: ["NIC 37.66", "NIC 37.68"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:ProvisionExpense",
    name: "Gasto por Provisiones",
    definition: "Incremento en el valor de provisiones reconocido en el resultado del período (dotación).",
    type: "monetary", balance: "debit", periodType: "duration",
    parentCode: "ifrs-full:ProfitLoss", references: ["NIC 37.59"], isAbstract: false, nillable: true, calculationWeight: -1,
  },

  // ═══════════════════════════════════════════════════════════════
  // NIC 36 — DETERIORO DE ACTIVOS (IMPAIRMENT)
  // ═══════════════════════════════════════════════════════════════
  {
    code: "ifrs-full:ImpairmentLoss",
    name: "Pérdida por Deterioro",
    definition: "Monto en que el valor en libros de un activo o UGE excede su importe recuperable.",
    type: "monetary", balance: "debit", periodType: "duration",
    parentCode: "ifrs-full:ProfitLoss", references: ["NIC 36.6", "NIC 36.59"], isAbstract: false, nillable: true, calculationWeight: -1,
  },
  {
    code: "ifrs-full:ImpairmentLossPPE",
    name: "Pérdida por Deterioro — PPE",
    definition: "Deterioro de propiedades, planta y equipo reconocido en resultados.",
    type: "monetary", balance: "debit", periodType: "duration",
    parentCode: "ifrs-full:ImpairmentLoss", references: ["NIC 36.6", "NIC 36.59"], isAbstract: false, nillable: true, calculationWeight: -1,
  },
  {
    code: "ifrs-full:ImpairmentLossGoodwill",
    name: "Pérdida por Deterioro — Plusvalía",
    definition: "Deterioro de plusvalía reconocido en resultados. No es reversible.",
    type: "monetary", balance: "debit", periodType: "duration",
    parentCode: "ifrs-full:ImpairmentLoss", references: ["NIC 36.90", "NIC 36.124"], isAbstract: false, nillable: true, calculationWeight: -1,
  },
  {
    code: "ifrs-full:ImpairmentLossIntangibles",
    name: "Pérdida por Deterioro — Intangibles",
    definition: "Deterioro de activos intangibles reconocido en resultados.",
    type: "monetary", balance: "debit", periodType: "duration",
    parentCode: "ifrs-full:ImpairmentLoss", references: ["NIC 36.6"], isAbstract: false, nillable: true, calculationWeight: -1,
  },
  {
    code: "ifrs-full:ReversalOfImpairmentLoss",
    name: "Reversión de Pérdida por Deterioro",
    definition: "Incremento en valor recuperable de un activo (excepto plusvalía) que revierte un deterioro previo.",
    type: "monetary", balance: "credit", periodType: "duration",
    parentCode: "ifrs-full:ProfitLoss", references: ["NIC 36.109", "NIC 36.124"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:RecoverableAmount",
    name: "Importe Recuperable",
    definition: "Mayor entre el valor razonable menos costos de venta y el valor en uso de un activo o UGE.",
    type: "monetary", balance: "credit", periodType: "instant",
    references: ["NIC 36.6", "NIC 36.18"], isAbstract: false, nillable: true,
  },
  {
    code: "ifrs-full:CashGeneratingUnit",
    name: "Unidad Generadora de Efectivo (UGE)",
    definition: "Grupo identificable de activos más pequeño que genera entradas de efectivo independientes de otros activos.",
    type: "string", balance: "none", periodType: "instant",
    references: ["NIC 36.6", "NIC 36.68"], isAbstract: false, nillable: true,
  },
  {
    code: "ifrs-full:DiscountRatePreTax",
    name: "Tasa de Descuento antes de Impuestos",
    definition: "Tasa que refleja el valor temporal del dinero y los riesgos específicos del activo para calcular el valor en uso.",
    type: "decimal", balance: "none", periodType: "instant",
    references: ["NIC 36.55", "NIC 36.56"], isAbstract: false, nillable: true,
  },
  {
    code: "ifrs-full:ValueInUse",
    name: "Valor en Uso",
    definition: "Valor presente de los flujos de efectivo futuros estimados que se espera obtener de un activo o UGE.",
    type: "monetary", balance: "credit", periodType: "instant",
    parentCode: "ifrs-full:RecoverableAmount", references: ["NIC 36.6", "NIC 36.31"], isAbstract: false, nillable: true,
  },
  {
    code: "ifrs-full:FairValueLessCostsToSell",
    name: "Valor Razonable menos Costos de Venta",
    definition: "Precio de venta de un activo en transacción ordenada entre participantes del mercado menos costos incrementales de disposición.",
    type: "monetary", balance: "credit", periodType: "instant",
    parentCode: "ifrs-full:RecoverableAmount", references: ["NIIF 13.9", "NIC 36.6"], isAbstract: false, nillable: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // NIIF 15 — INGRESOS DE CONTRATOS CON CLIENTES
  // ═══════════════════════════════════════════════════════════════
  {
    code: "ifrs-full:ContractAssets",
    name: "Activos por Contrato",
    definition: "Derecho a contraprestación a cambio de bienes o servicios transferidos al cliente cuando el derecho está condicionado a algo distinto del paso del tiempo.",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:CurrentAssets", references: ["NIIF 15.105", "NIIF 15.107"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:ContractLiabilities",
    name: "Pasivos por Contrato",
    definition: "Obligación de transferir bienes o servicios a un cliente por los cuales la entidad ha recibido contraprestación (o está vencida).",
    type: "monetary", balance: "credit", periodType: "instant",
    parentCode: "ifrs-full:CurrentLiabilities", references: ["NIIF 15.105", "NIIF 15.106"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:TradeReceivables",
    name: "Cuentas por Cobrar Comerciales",
    definition: "Derecho incondicional a contraprestación por bienes o servicios transferidos al cliente (solo vencimiento del tiempo).",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:TradeAndOtherCurrentReceivables", references: ["NIIF 15.108", "NIC 1.54(h)"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:PerformanceObligations",
    name: "Obligaciones de Desempeño",
    definition: "Promesas en un contrato de transferir bienes o servicios distintos al cliente.",
    type: "string", balance: "none", periodType: "instant",
    references: ["NIIF 15.22", "NIIF 15.119"], isAbstract: false, nillable: true,
  },
  {
    code: "ifrs-full:TransactionPrice",
    name: "Precio de la Transacción",
    definition: "Monto de contraprestación que una entidad espera tener derecho a recibir a cambio de transferir bienes/servicios, excluyendo montos cobrados por terceros.",
    type: "monetary", balance: "credit", periodType: "duration",
    references: ["NIIF 15.47", "NIIF 15.50"], isAbstract: false, nillable: true,
  },
  {
    code: "ifrs-full:RevenueFromContractsWithCustomers",
    name: "Ingresos por Contratos con Clientes",
    definition: "Ingresos reconocidos al transferir control de bienes o servicios al cliente, medidos al precio de transacción asignado a obligaciones cumplidas.",
    type: "monetary", balance: "credit", periodType: "duration",
    parentCode: "ifrs-full:Revenue", references: ["NIIF 15.31", "NIIF 15.119(a)"], isAbstract: false, nillable: true, calculationWeight: 1,
  },

  // ═══════════════════════════════════════════════════════════════
  // NIIF 3 — COMBINACIONES DE NEGOCIOS
  // ═══════════════════════════════════════════════════════════════
  {
    code: "ifrs-full:BusinessCombination",
    name: "Combinación de Negocios",
    definition: "Transacción en la que una entidad adquirente obtiene control de uno o más negocios.",
    type: "string", balance: "none", periodType: "instant",
    references: ["NIIF 3.1", "NIIF 3.4"], isAbstract: false, nillable: true,
  },
  {
    code: "ifrs-full:AcquisitionDateFairValue",
    name: "Valor Razonable en Fecha de Adquisición",
    definition: "Valor razonable de activos identificables adquiridos, pasivos asumidos y participación no controladora en la fecha de adquisición.",
    type: "monetary", balance: "debit", periodType: "instant",
    references: ["NIIF 3.18", "NIIF 3.19"], isAbstract: false, nillable: true,
  },
  {
    code: "ifrs-full:GoodwillArisingOnAcquisition",
    name: "Plusvalía por Adquisición",
    definition: "Exceso de (contraprestación + participación no controladora + participación previa) sobre activos netos identificables adquiridos.",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:Goodwill", references: ["NIIF 3.32", "NIIF 3.B37"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:GainOnBargainPurchase",
    name: "Ganancia por Compra en Términos Ventajosos",
    definition: "Exceso de activos netos identificables sobre el costo de adquisición; reconocido en resultados como ganancia inmediata.",
    type: "monetary", balance: "credit", periodType: "duration",
    references: ["NIIF 3.34", "NIIF 3.36"], isAbstract: false, nillable: true,
  },
  {
    code: "ifrs-full:NoncontrollingInterestMeasuredAtFairValue",
    name: "Participación No Controladora a Valor Razonable",
    definition: "Participación no controladora en una adquirida medida a su valor razonable en la fecha de adquisición.",
    type: "monetary", balance: "credit", periodType: "instant",
    parentCode: "ifrs-full:NoncontrollingInterests", references: ["NIIF 3.19", "NIIF 3.B44"], isAbstract: false, nillable: true, calculationWeight: 1,
  },

  // ═══════════════════════════════════════════════════════════════
  // NIC 21 — TASAS DE CAMBIO / MONEDA EXTRANJERA
  // ═══════════════════════════════════════════════════════════════
  {
    code: "ifrs-full:ExchangeDifferencesOnTranslation",
    name: "Diferencias de Cambio por Conversión",
    definition: "Diferencias resultantes de convertir estados financieros de una entidad extranjera de moneda funcional a moneda de presentación.",
    type: "monetary", balance: "credit", periodType: "duration",
    references: ["NIC 21.39", "NIC 21.30"], isAbstract: false, nillable: true,
  },
  {
    code: "ifrs-full:ExchangeDifferencesRealized",
    name: "Diferencias de Cambio Realizadas",
    definition: "Ganancias o pérdidas por liquidación de partidas monetarias en moneda extranjera o por conversión a tasas diferentes.",
    type: "monetary", balance: "credit", periodType: "duration",
    parentCode: "ifrs-full:ProfitLoss", references: ["NIC 21.28", "NIC 21.29"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:NetInvestmentInForeignOperation",
    name: "Inversión Neta en Operación Extranjera",
    definition: "Participación de la entidad en los activos netos de una operación en moneda extranjera.",
    type: "monetary", balance: "debit", periodType: "instant",
    references: ["NIC 21.8", "NIC 21.15"], isAbstract: false, nillable: true,
  },
  {
    code: "ifrs-full:ForeignCurrencyTranslationReserve",
    name: "Reserva de Conversión de Moneda Extranjera",
    definition: "Reserva de patrimonio que acumula diferencias de cambio por conversión de operaciones extranjeras.",
    type: "monetary", balance: "credit", periodType: "instant",
    parentCode: "ifrs-full:OtherReserves", references: ["NIC 21.39", "NIC 21.52(b)"], isAbstract: false, nillable: true, calculationWeight: 1,
  },

  // ═══════════════════════════════════════════════════════════════
  // NIC 24 — PARTES RELACIONADAS
  // ═══════════════════════════════════════════════════════════════
  {
    code: "ifrs-full:RelatedPartyTransactions",
    name: "Transacciones con Partes Relacionadas",
    definition: "Transferencia de recursos, servicios u obligaciones entre partes relacionadas, independientemente de si se considera precio.",
    type: "string", balance: "none", periodType: "duration",
    references: ["NIC 24.9", "NIC 24.17"], isAbstract: false, nillable: true,
  },
  {
    code: "ifrs-full:KeyManagementPersonnelCompensation",
    name: "Compensación del Personal Clave de la Gerencia",
    definition: "Total de beneficios a corto plazo, post-empleo, otros a largo plazo, por terminación y pagos basados en acciones al personal clave.",
    type: "monetary", balance: "debit", periodType: "duration",
    parentCode: "ifrs-full:EmployeeBenefitsExpense", references: ["NIC 24.17(a)", "NIC 24.9"], isAbstract: false, nillable: true, calculationWeight: -1,
  },

  // ═══════════════════════════════════════════════════════════════
  // NIIF 8 — SEGMENTOS DE OPERACIÓN
  // ═══════════════════════════════════════════════════════════════
  {
    code: "ifrs-full:SegmentRevenue",
    name: "Ingresos por Segmento",
    definition: "Ingresos de actividades ordinarias reportados por un segmento de operación, incluyendo ventas externas e intersegmentos.",
    type: "monetary", balance: "credit", periodType: "duration",
    parentCode: "ifrs-full:Revenue", references: ["NIIF 8.23(a)", "NIIF 8.5"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:SegmentProfitOrLoss",
    name: "Resultado por Segmento",
    definition: "Utilidad o pérdida de un segmento de operación reportada al principal tomador de decisiones operativas.",
    type: "monetary", balance: "credit", periodType: "duration",
    parentCode: "ifrs-full:ProfitLoss", references: ["NIIF 8.23(b)", "NIIF 8.5"], isAbstract: false, nillable: true,
  },
  {
    code: "ifrs-full:SegmentAssets",
    name: "Activos por Segmento",
    definition: "Activos de un segmento de operación utilizados en sus actividades operativas.",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:Assets", references: ["NIIF 8.23(c)", "NIIF 8.24(a)"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:SegmentLiabilities",
    name: "Pasivos por Segmento",
    definition: "Pasivos de un segmento de operación derivados de sus actividades operativas.",
    type: "monetary", balance: "credit", periodType: "instant",
    parentCode: "ifrs-full:Liabilities", references: ["NIIF 8.23(d)", "NIIF 8.24(b)"], isAbstract: false, nillable: true, calculationWeight: 1,
  },

  // ═══════════════════════════════════════════════════════════════
  // NIC 7 — DETALLE FLUJOS DE EFECTIVO
  // ═══════════════════════════════════════════════════════════════
  {
    code: "ifrs-full:InterestReceivedClassifiedAsOperating",
    name: "Intereses Recibidos — Operación",
    definition: "Intereses recibidos clasificados como actividades de operación (según política contable).",
    type: "monetary", balance: "credit", periodType: "duration",
    parentCode: "ifrs-full:NetCashFlowsFromOperatingActivities", references: ["NIC 7.33"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:InterestPaidClassifiedAsOperating",
    name: "Intereses Pagados — Operación",
    definition: "Intereses pagados clasificados como actividades de operación.",
    type: "monetary", balance: "debit", periodType: "duration",
    parentCode: "ifrs-full:NetCashFlowsFromOperatingActivities", references: ["NIC 7.33"], isAbstract: false, nillable: true, calculationWeight: -1,
  },
  {
    code: "ifrs-full:TaxPaidClassifiedAsOperating",
    name: "Impuestos Pagados — Operación",
    definition: "Pagos de impuesto a las ganancias clasificados como actividades de operación.",
    type: "monetary", balance: "debit", periodType: "duration",
    parentCode: "ifrs-full:NetCashFlowsFromOperatingActivities", references: ["NIC 7.35"], isAbstract: false, nillable: true, calculationWeight: -1,
  },
  {
    code: "ifrs-full:DividendsPaidClassifiedAsFinancing",
    name: "Dividendos Pagados — Financiación",
    definition: "Dividendos pagados clasificados como actividades de financiación.",
    type: "monetary", balance: "debit", periodType: "duration",
    parentCode: "ifrs-full:NetCashFlowsFromFinancingActivities", references: ["NIC 7.34"], isAbstract: false, nillable: true, calculationWeight: -1,
  },
  {
    code: "ifrs-full:AcquisitionOfPPEClassifiedAsInvesting",
    name: "Adquisición de PPE — Inversión",
    definition: "Pagos por compra de propiedades, planta y equipo clasificados como actividades de inversión.",
    type: "monetary", balance: "debit", periodType: "duration",
    parentCode: "ifrs-full:NetCashFlowsFromInvestingActivities", references: ["NIC 7.16(a)", "NIC 1.54(a)"], isAbstract: false, nillable: true, calculationWeight: -1,
  },
  {
    code: "ifrs-full:ProceedsFromSaleOfPPEClassifiedAsInvesting",
    name: "Venta de PPE — Inversión",
    definition: "Ingresos por venta de propiedades, planta y equipo clasificados como actividades de inversión.",
    type: "monetary", balance: "credit", periodType: "duration",
    parentCode: "ifrs-full:NetCashFlowsFromInvestingActivities", references: ["NIC 7.16(b)"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:ProceedsFromIssuingSharesClassifiedAsFinancing",
    name: "Emisión de Acciones — Financiación",
    definition: "Ingresos por emisión de instrumentos de patrimonio clasificados como actividades de financiación.",
    type: "monetary", balance: "credit", periodType: "duration",
    parentCode: "ifrs-full:NetCashFlowsFromFinancingActivities", references: ["NIC 7.17(a)"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:RepaymentOfBorrowingsClassifiedAsFinancing",
    name: "Pago de Préstamos — Financiación",
    definition: "Pagos para liquidar préstamos (porciones de principal) clasificados como actividades de financiación.",
    type: "monetary", balance: "debit", periodType: "duration",
    parentCode: "ifrs-full:NetCashFlowsFromFinancingActivities", references: ["NIC 7.17(d)"], isAbstract: false, nillable: true, calculationWeight: -1,
  },

  // ═══════════════════════════════════════════════════════════════
  // NIIF 5 — ACTIVOS NO CORRIENTES MANTENIDOS PARA LA VENTA
  // ═══════════════════════════════════════════════════════════════
  {
    code: "ifrs-full:NoncurrentAssetsHeldForSale",
    name: "Activos No Corrientes Mantenidos para la Venta",
    definition: "Activos cuyo valor en libros se recuperará mediante transacción de venta en lugar de uso continuado.",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:CurrentAssets", references: ["NIIF 5.6", "NIIF 5.38"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:DisposalGroupHeldForSale",
    name: "Grupo en Desapropiación Mantenido para la Venta",
    definition: "Grupo de activos a ser enajenados conjuntamente y pasivos directamente asociados en una sola transacción.",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:CurrentAssets", references: ["NIIF 5.4", "NIIF 5.38"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:LossOnDiscontinuedOperations",
    name: "Pérdida de Operaciones Discontinuadas",
    definition: "Resultado después de impuestos de operaciones discontinuadas, incluyendo ganancia/pérdida por disposición.",
    type: "monetary", balance: "debit", periodType: "duration",
    references: ["NIIF 5.33(b)", "NIC 1.82(e)"], isAbstract: false, nillable: true, calculationWeight: -1,
  },
  {
    code: "ifrs-full:ImpairmentLossOnNoncurrentAssetsHeldForSale",
    name: "Deterioro de Activos Mantenidos para la Venta",
    definition: "Pérdida por deterioro de activos clasificados como mantenidos para la venta cuando VR menos costos de venta es menor al valor en libros.",
    type: "monetary", balance: "debit", periodType: "duration",
    parentCode: "ifrs-full:ImpairmentLoss", references: ["NIIF 5.20", "NIIF 5.21"], isAbstract: false, nillable: true, calculationWeight: -1,
  },

  // ═══════════════════════════════════════════════════════════════
  // NIC 41 — AGRICULTURA
  // ═══════════════════════════════════════════════════════════════
  {
    code: "ifrs-full:BiologicalAssets",
    name: "Activos Biológicos",
    definition: "Animales vivos o plantas vivas controlados por la entidad como resultado de eventos pasados.",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:NoncurrentAssets", references: ["NIC 41.10", "NIC 41.5"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:AgriculturalProduce",
    name: "Productos Agrícolas",
    definition: "Productos cosechados de activos biológicos de la entidad (cosecha del período).",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:CurrentAssets", references: ["NIC 41.5", "NIC 41.13"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:GainOnBiologicalAssets",
    name: "Ganancia por Activos Biológicos",
    definition: "Cambio en valor razonable menos costos de venta de activos biológicos reconocido en resultados.",
    type: "monetary", balance: "credit", periodType: "duration",
    parentCode: "ifrs-full:ProfitLoss", references: ["NIC 41.26"], isAbstract: false, nillable: true, calculationWeight: 1,
  },

  // ═══════════════════════════════════════════════════════════════
  // NIC 16 — PROPIEDADES, PLANTA Y EQUIPO (DETALLE)
  // ═══════════════════════════════════════════════════════════════
  {
    code: "ifrs-full:LandAndBuildings",
    name: "Terrenos y Edificios",
    definition: "Terrenos y edificaciones ocupadas por la entidad para su uso en producción, administración o arrendamiento.",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:PropertyPlantAndEquipment", references: ["NIC 16.35", "NIC 16.37(a)"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:MachineryAndEquipment",
    name: "Maquinaria y Equipo",
    definition: "Maquinaria industrial, equipos productivos y herramientas utilizadas en el proceso de producción o servicios.",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:PropertyPlantAndEquipment", references: ["NIC 16.37(b)"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:Vehicles",
    name: "Vehículos",
    definition: "Vehículos de transporte, carga y uso administrativo propiedad de la entidad.",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:PropertyPlantAndEquipment", references: ["NIC 16.37(c)"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:FixturesAndFittings",
    name: "Muebles, Enseres y Equipos de Oficina",
    definition: "Mobiliario, equipos de oficina, sistemas de cómputo y otros activos de uso administrativo.",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:PropertyPlantAndEquipment", references: ["NIC 16.37(d)"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:ConstructionInProgress",
    name: "Construcciones en Curso",
    definition: "Activos en proceso de construcción o instalación, no disponibles para su uso hasta su finalización.",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:PropertyPlantAndEquipment", references: ["NIC 16.8", "NIC 16.37"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:AccumulatedDepreciationPPE",
    name: "Depreciación Acumulada — PPE",
    definition: "Monto total de depreciación reconocida sobre propiedades, planta y equipo desde su adquisición.",
    type: "monetary", balance: "credit", periodType: "instant",
    references: ["NIC 16.73(a)"], isAbstract: false, nillable: true, calculationWeight: -1,
  },
  {
    code: "ifrs-full:RevaluationSurplusPPE",
    name: "Superávit de Revaluación — PPE",
    definition: "Excedente por revaluación de propiedades, planta y equipo reconocido en otro resultado integral.",
    type: "monetary", balance: "credit", periodType: "instant",
    parentCode: "ifrs-full:OtherReserves", references: ["NIC 16.39", "NIC 16.40"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:DepreciationExpense",
    name: "Gasto por Depreciación",
    definition: "Distribución sistemática del costo depreciable de un activo a lo largo de su vida útil.",
    type: "monetary", balance: "debit", periodType: "duration",
    parentCode: "ifrs-full:ProfitLoss", references: ["NIC 16.50", "NIC 16.73(b)"], isAbstract: false, nillable: true, calculationWeight: -1,
  },
  {
    code: "ifrs-full:AmortizationExpense",
    name: "Gasto por Amortización",
    definition: "Distribución sistemática del costo de activos intangibles a lo largo de su vida útil.",
    type: "monetary", balance: "debit", periodType: "duration",
    parentCode: "ifrs-full:ProfitLoss", references: ["NIC 38.97", "NIC 38.118(b)"], isAbstract: false, nillable: true, calculationWeight: -1,
  },

  // ═══════════════════════════════════════════════════════════════
  // NIC 38 — INTANGIBLES (DETALLE)
  // ═══════════════════════════════════════════════════════════════
  {
    code: "ifrs-full:DevelopmentCosts",
    name: "Costos de Desarrollo",
    definition: "Desembolsos incurridos en la fase de desarrollo de proyectos internos que cumplen criterios de capitalización (NIC 38.57).",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:IntangibleAssetsOtherThanGoodwill", references: ["NIC 38.57", "NIC 38.126(b)"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:Brands",
    name: "Marcas",
    definition: "Activos intangibles identificables representados por nombres comerciales, marcas registradas y símbolos distintivos.",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:IntangibleAssetsOtherThanGoodwill", references: ["NIC 38.126(c)"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:SoftwareAndLicenses",
    name: "Software y Licencias",
    definition: "Programas informáticos, licencias de uso y derechos de software adquiridos o desarrollados internamente.",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:IntangibleAssetsOtherThanGoodwill", references: ["NIC 38.126(d)"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:PatentsAndIndustrialProperty",
    name: "Patentes y Propiedad Industrial",
    definition: "Derechos exclusivos de explotación de invenciones, modelos de utilidad y diseños industriales.",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:IntangibleAssetsOtherThanGoodwill", references: ["NIC 38.126(e)"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:ResearchExpense",
    name: "Gasto de Investigación",
    definition: "Desembolsos en investigación original no capitalizables, reconocidos como gasto en resultados.",
    type: "monetary", balance: "debit", periodType: "duration",
    parentCode: "ifrs-full:AdministrativeExpenses", references: ["NIC 38.54", "NIC 38.126(a)"], isAbstract: false, nillable: true, calculationWeight: -1,
  },
  {
    code: "ifrs-full:AccumulatedAmortizationIntangibles",
    name: "Amortización Acumulada — Intangibles",
    definition: "Monto total de amortización reconocida sobre activos intangibles desde su adquisición.",
    type: "monetary", balance: "credit", periodType: "instant",
    references: ["NIC 38.118(c)"], isAbstract: false, nillable: true, calculationWeight: -1,
  },

  // ═══════════════════════════════════════════════════════════════
  // NIC 12 — IMPUESTO A LAS GANANCIAS (DETALLE)
  // ═══════════════════════════════════════════════════════════════
  {
    code: "ifrs-full:CurrentTaxExpense",
    name: "Gasto por Impuesto Corriente",
    definition: "Impuesto por pagar (recuperable) por la ganancia fiscal del período, calculado según tasas vigentes.",
    type: "monetary", balance: "debit", periodType: "duration",
    parentCode: "ifrs-full:IncomeTaxExpenseContinuingOperations", references: ["NIC 12.5", "NIC 12.12"], isAbstract: false, nillable: true, calculationWeight: -1,
  },
  {
    code: "ifrs-full:DeferredTaxExpense",
    name: "Gasto (Ingreso) por Impuesto Diferido",
    definition: "Cambio neto en activos y pasivos por impuestos diferidos reconocido en resultados del período.",
    type: "monetary", balance: "debit", periodType: "duration",
    parentCode: "ifrs-full:IncomeTaxExpenseContinuingOperations", references: ["NIC 12.5", "NIC 12.15"], isAbstract: false, nillable: true, calculationWeight: -1,
  },
  {
    code: "ifrs-full:TemporaryDifferences",
    name: "Diferencias Temporarias",
    definition: "Diferencias entre el valor en libros de un activo o pasivo y su base fiscal.",
    type: "string", balance: "none", periodType: "instant",
    references: ["NIC 12.5"], isAbstract: false, nillable: true,
  },
  {
    code: "ifrs-full:TaxLossesCarriedForward",
    name: "Pérdidas Fiscales por Compensar",
    definition: "Pérdidas fiscales no utilizadas disponibles para compensar ganancias fiscales futuras.",
    type: "monetary", balance: "debit", periodType: "instant",
    references: ["NIC 12.34", "NIC 12.35"], isAbstract: false, nillable: true,
  },
  {
    code: "ifrs-full:EffectiveTaxRateReconciliation",
    name: "Conciliación Tasa Efectiva de Impuesto",
    definition: "Conciliación entre el gasto por impuesto esperado (a tasa nominal) y el gasto por impuesto real reconocido.",
    type: "string", balance: "none", periodType: "duration",
    references: ["NIC 12.81(c)"], isAbstract: false, nillable: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // NIC 33 — GANANCIAS POR ACCIÓN (DETALLE)
  // ═══════════════════════════════════════════════════════════════
  {
    code: "ifrs-full:WeightedAverageShares",
    name: "Número Promedio Ponderado de Acciones",
    definition: "Promedio ponderado de acciones ordinarias en circulación durante el período, ajustado por eventos de capitalización.",
    type: "decimal", balance: "none", periodType: "duration",
    references: ["NIC 33.66", "NIC 33.70"], isAbstract: false, nillable: true,
  },
  {
    code: "ifrs-full:DilutiveInstruments",
    name: "Instrumentos Dilutivos",
    definition: "Acciones ordinarias potenciales que reducen la ganancia por acción al ser convertidas o ejercidas.",
    type: "string", balance: "none", periodType: "duration",
    references: ["NIC 33.41", "NIC 33.43"], isAbstract: false, nillable: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // NIC 2 — INVENTARIOS (DETALLE)
  // ═══════════════════════════════════════════════════════════════
  {
    code: "ifrs-full:RawMaterials",
    name: "Materias Primas",
    definition: "Materiales y suministros directos e indirectos que serán consumidos en el proceso de producción.",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:CurrentInventories", references: ["NIC 2.8", "NIC 2.36(a)"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:WorkInProgress",
    name: "Productos en Proceso",
    definition: "Bienes parcialmente terminados que aún no están listos para la venta.",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:CurrentInventories", references: ["NIC 2.8", "NIC 2.36(b)"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:FinishedGoods",
    name: "Productos Terminados",
    definition: "Bienes completados y disponibles para la venta en el curso normal de operación.",
    type: "monetary", balance: "debit", periodType: "instant",
    parentCode: "ifrs-full:CurrentInventories", references: ["NIC 2.8", "NIC 2.36(c)"], isAbstract: false, nillable: true, calculationWeight: 1,
  },
  {
    code: "ifrs-full:InventoryWriteDown",
    name: "Deterioro de Inventarios (Castigo)",
    definition: "Reducción del valor de inventarios a su valor neto realizable cuando el costo excede el precio de venta estimado.",
    type: "monetary", balance: "debit", periodType: "duration",
    parentCode: "ifrs-full:CostOfSales", references: ["NIC 2.34", "NIC 2.28"], isAbstract: false, nillable: true, calculationWeight: -1,
  },
]

export const ifrsConceptMap = new Map(ifrsConcepts.map((c) => [c.code, c]))

export function getChildren(code: string): IFRSConcept[] {
  return ifrsConcepts.filter((c) => c.parentCode === code)
}

export function getTree(code: string): IFRSConcept[] {
  const result: IFRSConcept[] = []
  const queue = [code]
  while (queue.length > 0) {
    const current = queue.shift()!
    const concept = ifrsConceptMap.get(current)
    if (concept) result.push(concept)
    const children = getChildren(current)
    for (const child of children) {
      queue.push(child.code)
    }
  }
  return result
}

export function getRootConcepts(): IFRSConcept[] {
  return ifrsConcepts.filter((c) => !c.parentCode && !c.isAbstract)
}

export function getStatementConcepts(statement: "balance" | "income" | "cashflow"): IFRSConcept[] {
  switch (statement) {
    case "balance":
      return getTree("ifrs-full:Assets").concat(getTree("ifrs-full:Liabilities")).concat(getTree("ifrs-full:Equity"))
    case "income":
      return getTree("ifrs-full:ProfitLoss")
    case "cashflow":
      return ifrsConcepts.filter((c) => c.code.includes("CashFlow") || c.code.includes("NetCash"))
    default:
      return []
  }
}
