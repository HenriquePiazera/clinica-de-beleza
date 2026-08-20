import { headers } from 'next/headers'

function resolveEnvBaseUrl(): string {
  const explicit = process.env.NEXTAUTH_URL?.trim()
  if (explicit) return explicit.replace(/\/$/, '')
  return 'http://localhost:3000'
}

export async function getAppBaseUrl(): Promise<string> {
  try {
    const hdrs = await headers()
    const host = hdrs.get('x-forwarded-host') ?? hdrs.get('host')
    const proto = hdrs.get('x-forwarded-proto') ?? 'http'
    if (host) {
      return `${proto}://${host}`
    }
  } catch {
    // fora de request context (scripts, cron)
  }

  return resolveEnvBaseUrl()
}

export function getAppBaseUrlSync(): string {
  return resolveEnvBaseUrl()
}

/** URL pública estável para link/QR (prioriza NEXTAUTH_URL). */
export function getPublicAppBaseUrl(): string {
  return resolveEnvBaseUrl()
}
