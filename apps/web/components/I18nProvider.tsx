"use client"

import { createContext, useContext } from "react"
import type { AppLocale, Dictionary } from "@/lib/i18n"

type I18nContextValue = {
  locale: AppLocale
  dict: Dictionary
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({
  children,
  locale,
  dict,
}: I18nContextValue & { children: React.ReactNode }) {
  return <I18nContext.Provider value={{ locale, dict }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const value = useContext(I18nContext)
  if (!value) {
    throw new Error("useI18n must be used inside I18nProvider")
  }
  return value
}
