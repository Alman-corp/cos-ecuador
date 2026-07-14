const DUE_DAY_MAP: Record<number, number> = {
  1: 10, 2: 12, 3: 14, 4: 16, 5: 18,
  6: 20, 7: 22, 8: 24, 9: 26, 0: 28,
}

export interface TaxObligation {
  type: 'IVA_MONTHLY' | 'RETENTION_AT_SOURCE' | 'ATS_ANNEX' | 'INCOME_TAX_ANNUAL' | 'PERSONAL_EXPENSES_ANNEX'
  period: string
  dueDate: string
  status: 'PENDING' | 'OVERDUE' | 'COMPLETED'
  description: string
  sriForm: string
}

export interface ClientCalendar {
  company: { name: string; ruc: string; ninthDigit: number }
  year: number
  obligations: TaxObligation[]
  summary: { total: number; pending: number; overdue: number; completed: number }
}

function calculateDueDate(year: number, month: number, ninthDigit: number): Date {
  const dueMonth = month === 12 ? 1 : month + 1
  const dueYear = month === 12 ? year + 1 : year
  const dueDay = DUE_DAY_MAP[ninthDigit] || 28
  const daysInMonth = new Date(dueYear, dueMonth, 0).getDate()
  const adjustedDay = Math.min(dueDay, daysInMonth)
  return new Date(dueYear, dueMonth - 1, adjustedDay, 23, 59, 59)
}

function calculateStatus(dueDate: Date): 'PENDING' | 'OVERDUE' | 'COMPLETED' {
  return dueDate < new Date() ? 'OVERDUE' : 'PENDING'
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function getMonthName(month: number): string { return MONTHS[month - 1] }

export function getClientCalendar(
  ruc: string,
  companyName: string,
  ninthDigit: number,
  year: number = 2026,
): ClientCalendar {
  const obligations: TaxObligation[] = []

  for (let month = 1; month <= 12; month++) {
    const dueDate = calculateDueDate(year, month, ninthDigit)
    obligations.push({
      type: 'IVA_MONTHLY',
      period: `${year}-${String(month).padStart(2, '0')}`,
      dueDate: dueDate.toISOString(),
      status: calculateStatus(dueDate),
      description: `Declaración IVA ${getMonthName(month)} ${year}`,
      sriForm: 'Formulario 104',
    })
    obligations.push({
      type: 'RETENTION_AT_SOURCE',
      period: `${year}-${String(month).padStart(2, '0')}`,
      dueDate: dueDate.toISOString(),
      status: calculateStatus(dueDate),
      description: `Retenciones en la fuente ${getMonthName(month)} ${year}`,
      sriForm: 'Formulario 103',
    })
  }

  for (let quarter = 1; quarter <= 4; quarter++) {
    const quarterMonth = quarter * 3
    const atsDate = calculateDueDate(year, quarterMonth + 1, ninthDigit)
    obligations.push({
      type: 'ATS_ANNEX',
      period: `${year}-Q${quarter}`,
      dueDate: atsDate.toISOString(),
      status: calculateStatus(atsDate),
      description: `Anexo Transaccional Simplificado Q${quarter} ${year}`,
      sriForm: 'Anexo ATS',
    })
  }

  const annualDate = new Date(year + 1, 3, Math.min(DUE_DAY_MAP[ninthDigit] || 28, 28), 23, 59, 59)
  obligations.push({
    type: 'INCOME_TAX_ANNUAL',
    period: `${year}`,
    dueDate: annualDate.toISOString(),
    status: calculateStatus(annualDate),
    description: `Declaración Impuesto a la Renta ${year}`,
    sriForm: 'Formulario 101',
  })

  const expensesDate = new Date(year + 1, 1, Math.min(DUE_DAY_MAP[ninthDigit] || 28, 28), 23, 59, 59)
  obligations.push({
    type: 'PERSONAL_EXPENSES_ANNEX',
    period: `${year}`,
    dueDate: expensesDate.toISOString(),
    status: calculateStatus(expensesDate),
    description: `Anexo de Gastos Personales ${year}`,
    sriForm: 'Anexo Gastos Personales',
  })

  obligations.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

  return {
    company: { name: companyName, ruc, ninthDigit },
    year,
    obligations,
    summary: {
      total: obligations.length,
      pending: obligations.filter((o) => o.status === 'PENDING').length,
      overdue: obligations.filter((o) => o.status === 'OVERDUE').length,
      completed: obligations.filter((o) => o.status === 'COMPLETED').length,
    },
  }
}

export function validateRUCEcuador(ruc: string): { valid: boolean; ninthDigit: number | null; provincia: string | null } {
  if (ruc.length !== 13 || !/^\d+$/.test(ruc)) return { valid: false, ninthDigit: null, provincia: null }

  const provinciaCode = ruc.slice(0, 2)
  const provincias: Record<string, string> = {
    '01': 'Azuay', '02': 'Bolívar', '03': 'Cañar', '04': 'Carchi',
    '05': 'Cotopaxi', '06': 'Chimborazo', '07': 'El Oro', '08': 'Esmeraldas',
    '09': 'Guayas', '10': 'Imbabura', '11': 'Loja', '12': 'Los Ríos',
    '13': 'Manabí', '14': 'Morona Santiago', '15': 'Napo', '16': 'Pastaza',
    '17': 'Pichincha', '18': 'Tungurahua', '19': 'Zamora Chinchipe',
    '20': 'Galápagos', '21': 'Sucumbíos', '22': 'Orellana',
    '23': 'Santo Domingo de los Tsáchilas', '24': 'Santa Elena',
  }
  if (!provincias[provinciaCode]) return { valid: false, ninthDigit: null, provincia: null }

  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2]
  let total = 0
  for (let i = 0; i < 9; i++) {
    let valor = parseInt(ruc[i]) * coeficientes[i]
    total += valor >= 10 ? valor - 9 : valor
  }
  const digitoVerificador = (10 - (total % 10)) % 10
  if (digitoVerificador !== parseInt(ruc[9])) return { valid: false, ninthDigit: null, provincia: null }

  return { valid: true, ninthDigit: parseInt(ruc[8]), provincia: provincias[provinciaCode] }
}
