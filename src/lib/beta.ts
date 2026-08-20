export function getBetaAllowedEmails(): string[] {
  const raw = process.env.BETA_ALLOWED_EMAILS ?? ''
  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export function isBetaRegistrationOpen(): boolean {
  return getBetaAllowedEmails().length === 0
}

export function isEmailAllowedForBeta(email: string): boolean {
  const allowed = getBetaAllowedEmails()
  if (allowed.length === 0) return true
  return allowed.includes(email.trim().toLowerCase())
}
