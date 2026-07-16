const isProduction = process.env.NODE_ENV === 'production'

function serializeError(err: any) {
  if (!(err instanceof Error)) return err
  return {
    message: err.message,
    name: err.name,
    stack: isProduction ? undefined : err.stack,
    ...(err as any).context,
  }
}

const REDACTED_FIELDS = new Set([
  'password', 'token', 'authorization', 'cookie', 'secret',
  'csrf', 'jwt', 'api_key', 'apikey', 'accessToken', 'accesstoken',
])

function redact(obj: any, depth = 0): any {
  if (depth > 5 || obj === null || obj === undefined) return obj
  if (typeof obj !== 'object') return obj

  if (Array.isArray(obj)) return obj.map((v) => redact(v, depth + 1))

  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[key] = REDACTED_FIELDS.has(key.toLowerCase().replace(/[_-]/g, ''))
      ? '[REDACTED]'
      : typeof value === 'object'
        ? redact(value, depth + 1)
        : value
  }
  return result
}

function serializeError(err: any): any {
  if (!(err instanceof Error)) return err
  return {
    message: err.message,
    name: err.name,
    stack: isProduction ? undefined : err.stack,
    ...(err as any).context,
  }
}

export const logger = {
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),

  child(bindings: Record<string, any>) {
    return {
      ...this,
      info: (msg: any, ...args: any[]) => this.info({ ...bindings, ...(typeof msg === 'object' ? msg : { msg }) }, ...args),
      warn: (msg: any, ...args: any[]) => this.warn({ ...bindings, ...(typeof msg === 'object' ? msg : { msg }) }, ...args),
      error: (msg: any, ...args: any[]) => this.error({ ...bindings, ...(typeof msg === 'object' ? msg : { msg }) }, ...args),
      debug: (msg: any, ...args: any[]) => this.debug({ ...bindings, ...(typeof msg === 'object' ? msg : { msg }) }, ...args),
    }
  },

  info(obj: any, msg?: string) {
    if (this.level === 'debug' || this.level === 'info') {
      const entry = { level: 'info', time: new Date().toISOString(), ...redact(obj), msg: msg || obj?.msg || '' }
      if (isProduction) console.log(JSON.stringify(entry))
      else console.log(`[INFO] ${msg || obj?.msg || ''}`, redact(obj))
    }
  },

  warn(obj: any, msg?: string) {
    const entry = { level: 'warn', time: new Date().toISOString(), ...redact(obj), msg: msg || obj?.msg || '' }
    if (isProduction) console.warn(JSON.stringify(entry))
    else console.warn(`[WARN] ${msg || obj?.msg || ''}`, redact(obj))
  },

  error(obj: any, msg?: string) {
    const err = obj?.err || obj
    const entry = {
      level: 'error',
      time: new Date().toISOString(),
      ...redact(obj),
      err: serializeError(err),
      msg: msg || obj?.msg || '',
    }
    if (isProduction) console.error(JSON.stringify(entry))
    else console.error(`[ERROR] ${msg || obj?.msg || ''}`, serializeError(err))
  },

  debug(obj: any, msg?: string) {
    if (this.level === 'debug') {
      const entry = { level: 'debug', time: new Date().toISOString(), ...redact(obj), msg: msg || obj?.msg || '' }
      if (isProduction) console.debug(JSON.stringify(entry))
      else console.debug(`[DEBUG] ${msg || obj?.msg || ''}`, redact(obj))
    }
  },
}

export function createRequestLogger(requestId: string, tenantId?: string) {
  return logger.child({
    request_id: requestId,
    tenant_id: tenantId,
  })
}