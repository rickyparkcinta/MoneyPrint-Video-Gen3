import { cookies, headers } from "next/headers"
import { getDictionary, LOCALE_COOKIE, normalizeLocale, type AppLocale } from "@/lib/i18n"

export async function getCurrentLocale(): Promise<AppLocale> {
  const cookieStore = await cookies()
  const cookieLocale = normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value)
  if (cookieLocale) return cookieLocale

  const headerStore = await headers()
  const acceptLanguage = headerStore.get("accept-language") ?? ""
  const headerLocale = acceptLanguage
    .split(",")
    .map((entry) => normalizeLocale(entry.split(";")[0]?.trim()))
    .find(Boolean)

  return headerLocale ?? "en"
}

export async function getI18n() {
  const locale = await getCurrentLocale()
  return {
    locale,
    dict: getDictionary(locale),
  }
}
