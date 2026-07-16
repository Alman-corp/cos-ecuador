import { describe, it, expect } from 'vitest'
import { sanitizeString, sanitizeObject } from '../../lib/security/sanitize'

describe('XSS Sanitization', () => {
  it('elimina tags de script', () => {
    expect(sanitizeString('<script>alert("xss")</script>')).toBe('')
  })

  it('elimina event handlers', () => {
    expect(sanitizeString('<img onerror="alert(1)" src="x">')).toBe('')
  })

  it('elimina javascript: URLs', () => {
    expect(sanitizeString('<a href="javascript:alert(1)">click</a>')).toBe('click')
  })

  it('mantiene texto limpio', () => {
    expect(sanitizeString('ACME Manufacturing S.A.')).toBe('ACME Manufacturing S.A.')
  })

  it('sanitiza objetos recursivamente', () => {
    const input = {
      name: '<script>alert(1)</script>ACME',
      nested: {
        description: '<img onerror="alert(1)" src="x">Descripción real',
      },
      tags: ['<b>bold</b>normal', 'clean'],
    }

    const result = sanitizeObject(input)
    expect(result.name).toBe('ACME')
    expect(result.nested.description).toBe('Descripción real')
    expect(result.tags[0]).toBe('normal')
    expect(result.tags[1]).toBe('clean')
  })

  it('maneja null y undefined', () => {
    expect(sanitizeObject(null)).toBeNull()
    expect(sanitizeObject(undefined)).toBeUndefined()
  })

  it('no modifica números ni booleanos', () => {
    expect(sanitizeObject(42)).toBe(42)
    expect(sanitizeObject(true)).toBe(true)
  })
})