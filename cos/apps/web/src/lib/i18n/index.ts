import { es } from "./es"
import { en } from "./en"

export type Locale = "es" | "en"

const translations: Record<Locale, typeof es> = { es, en }

export function t(locale: Locale, path: string): string {
  const keys = path.split(".")
  let value: any = translations[locale]
  for (const key of keys) {
    value = value?.[key]
  }
  return typeof value === "string" ? value : path
}

export function useTranslation(locale: Locale) {
  return {
    t: (path: string) => t(locale, path),
    locale,
  }
}
