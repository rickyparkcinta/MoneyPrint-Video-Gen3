import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { intlLocale, type AppLocale } from "@/lib/i18n"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string, locale: AppLocale = "en"): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string, locale: AppLocale = "en"): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date))
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export function formatCredits(credits: number, locale: AppLocale = "en"): string {
  return new Intl.NumberFormat(intlLocale(locale)).format(credits)
}

export function formatCurrency(amount: number, locale: AppLocale = "en"): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency: "USD",
  }).format(amount / 100)
}
