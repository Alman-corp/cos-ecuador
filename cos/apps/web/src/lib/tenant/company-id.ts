import { headers as nextHeaders, cookies as nextCookies } from "next/headers"

const HEADER_NAME = "x-company-id"
const COOKIE_NAME = "cos_company_id"

export async function getCompanyId(): Promise<string | null> {
  const h = await nextHeaders()
  return h.get(HEADER_NAME) ?? null
}

export async function getCompanyIdFromCookies(): Promise<string | null> {
  const c = await nextCookies()
  return c.get(COOKIE_NAME)?.value ?? null
}

export async function resolveCompanyId(): Promise<string | null> {
  const fromHeader = await getCompanyId()
  if (fromHeader) return fromHeader

  const fromCookie = await getCompanyIdFromCookies()
  if (fromCookie) return fromCookie

  return null
}

export async function requireCompanyId(): Promise<string> {
  const id = await resolveCompanyId()
  if (!id) throw new Error("No company context — multi-tenant access denied")
  return id
}

export function setCompanyIdCookie(value: string): string {
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
}
