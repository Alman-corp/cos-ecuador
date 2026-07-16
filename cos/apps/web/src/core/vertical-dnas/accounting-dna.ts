export const accountingDNA = {
  version: "1.0.0",
  lastUpdated: "2026-06-28",
  name: "Accounting Intelligence DNA",
  description: "Normas contables, tributación ecuatoriana, calendarios y reglas para automatización contable.",

  frameworks: [
    {
      name: "NIIF Completas",
      description: "Normas Internacionales de Información Financiera completas para empresas que cotizan en bolsa o de interés público.",
      applicableTo: "Compañías grandes y emisoras de valores",
    },
    {
      name: "NIIF para PYMES",
      description: "Versión simplificada de NIIF para pequeñas y medianas empresas. Sección 1-35.",
      applicableTo: "PYMES con ingresos < $5M, activos < $4M, empleados < 200",
    },
    {
      name: "NIC (Normas Internacionales de Contabilidad)",
      description: "Normas predecesoras de NIIF. Algunas siguen vigentes: NIC 1 (presentación), NIC 2 (inventarios), NIC 16 (propiedades), NIC 36 (deterioro).",
      applicableTo: "Todas las empresas bajo NIIF",
    },
  ],

  taxRules: [
    {
      name: "Impuesto a la Renta Sociedades",
      rate: "25%",
      applicable: "Sociedades ecuatorianas",
      notes: "Tasa general. 22% para empresas que reinvierten utilidades.",
      forms: ["Formulario 101"],
      deadline: "Abril del año siguiente",
    },
    {
      name: "Impuesto a la Renta Personas",
      rate: "Progresivo 0%-37%",
      applicable: "Personas naturales",
      notes: "Tabla progresiva con fracción básica exenta de $12,270 (2026).",
      forms: ["Formulario 102"],
      deadline: "Marzo del año siguiente",
    },
    {
      name: "IVA",
      rate: "12%",
      applicable: "Bienes y servicios generales",
      notes: "0% para exportaciones, alimentos básicos, salud, educación. Exenciones específicas.",
      forms: ["Formulario 104"],
      deadline: "Mensual (declarantes mensuales) o semestral (PYMES)",
    },
    {
      name: "Retenciones en la Fuente IR",
      rates: "1%, 2%, 8%, 10%",
      applicable: "Pagos a proveedores",
      notes: "Porcentaje según el tipo de renta. 1% bienes, 2% servicios, 8% honorarios, 10% arriendo.",
      forms: ["Formulario 103"],
      deadline: "Mensual, primeros 10 días del mes siguiente",
    },
    {
      name: "ICE",
      rates: "5%-200%",
      applicable: "Bienes específicos",
      notes: "Aplica a: cigarrillos (150%), bebidas alcohólicas (40-75%), vehículos (5-35%), plásticos, perfumes.",
      forms: ["Formulario 105"],
      deadline: "Mensual",
    },
  ],

  calendar: [
    { month: "Enero", obligations: ["Declaración IVA diciembre", "Declaración retenciones diciembre", "Anexo transaccional"] },
    { month: "Febrero", obligations: ["Declaración IVA enero", "Declaración retenciones enero", "Anexo transaccional"] },
    { month: "Marzo", obligations: ["Declaración IR personas (102)", "Declaración IVA febrero", "Declaración retenciones febrero"] },
    { month: "Abril", obligations: ["Declaración IR sociedades (101)", "Declaración IVA marzo", "Declaración retenciones marzo"] },
    { month: "Mayo", obligations: ["Declaración IVA abril", "Declaración retenciones abril"] },
    { month: "Junio", obligations: ["Declaración IVA mayo", "Declaración retenciones mayo", "Estados financieros primer semestre"] },
    { month: "Julio", obligations: ["Declaración IVA junio", "Declaración retenciones junio"] },
    { month: "Agosto", obligations: ["Declaración IVA julio", "Declaración retenciones julio"] },
    { month: "Septiembre", obligations: ["Declaración IVA agosto", "Declaración retenciones agosto"] },
    { month: "Octubre", obligations: ["Declaración IVA septiembre", "Declaración retenciones septiembre"] },
    { month: "Noviembre", obligations: ["Declaración IVA octubre", "Declaración retenciones octubre"] },
    { month: "Diciembre", obligations: ["Declaración IVA noviembre", "Declaración retenciones noviembre", "Cierre fiscal anual"] },
  ],

  reconciliations: [
    { name: "Conciliación Bancaria", frequency: "mensual", steps: ["Comparar saldo contable vs extracto", "Identificar diferencias", "Registrar ajustes", "Conciliar partidas pendientes"] },
    { name: "Conciliación Tributaria", frequency: "anual", steps: ["Comparar ingresos contables vs tributarios", "Calcular diferencias permanentes y temporales", "Calcular impuesto diferido", "Preparar conciliación tributaria (Anexo 18)"] },
    { name: "Conciliación IVA", frequency: "mensual", steps: ["Comparar IVA cobrado vs debitado", "Verificar retenciones IVA", "Calcular crédito tributario", "Presentar declaración"] },
  ],
}
