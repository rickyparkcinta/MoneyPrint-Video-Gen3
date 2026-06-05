export const REFERRAL_COOKIE = "mp_referral_code"
export const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 90

export function normalizeReferralCode(value: string | null | undefined): string | null {
  const code = value?.trim().toUpperCase() ?? ""
  return /^MP[0-9A-F]{10}$/.test(code) ? code : null
}
