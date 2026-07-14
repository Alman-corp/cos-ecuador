export function validateRUC(ruc: string): boolean {
  if (!/^\d{13}$/.test(ruc)) return false

  const provincia = parseInt(ruc.substring(0, 2), 10)
  if (provincia < 1 || provincia > 24) return false

  const tercerDigito = parseInt(ruc[2], 10)
  if (tercerDigito < 0 || tercerDigito > 6) return false

  const establecimiento = parseInt(ruc.substring(10, 13), 10)
  if (establecimiento < 1) return false

  if (tercerDigito <= 5) {
    return validarModulo10(ruc.substring(0, 9), ruc[9])
  }

  if (tercerDigito === 6) {
    return validarModulo11(ruc.substring(0, 8), ruc[8], 6)
  }

  if (tercerDigito === 9) {
    return validarModulo11(ruc.substring(0, 8), ruc[8], 6)
  }

  return true
}

export function validateCedula(cedula: string): boolean {
  if (!/^\d{10}$/.test(cedula)) return false

  const provincia = parseInt(cedula.substring(0, 2), 10)
  if (provincia < 1 || provincia > 24) return false

  const tercerDigito = parseInt(cedula[2], 10)
  if (tercerDigito > 5) return false

  return validarModulo10(cedula.substring(0, 9), cedula[9])
}

function validarModulo10(digits: string, checkDigit: string): boolean {
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2]
  let suma = 0

  for (let i = 0; i < digits.length; i++) {
    let valor = parseInt(digits[i], 10) * coeficientes[i]
    if (valor >= 10) valor -= 9
    suma += valor
  }

  const residuo = suma % 10
  const digitoVerificador = residuo === 0 ? 0 : 10 - residuo

  return digitoVerificador === parseInt(checkDigit, 10)
}

function validarModulo11(digits: string, checkDigit: string, base: number): boolean {
  const coeficientes = [3, 2, 7, 6, 5, 4, 3, 2]
  let suma = 0

  for (let i = 0; i < digits.length; i++) {
    suma += parseInt(digits[i], 10) * coeficientes[i]
  }

  const residuo = suma % base
  const digitoVerificador = residuo === 0 ? 0 : base - residuo

  return digitoVerificador === parseInt(checkDigit, 10)
}
