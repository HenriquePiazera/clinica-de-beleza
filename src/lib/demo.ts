import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export const DEMO_COOKIE_NAME = 'demo_access_token'

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === 'true'
}

export function getDemoSessionHours(): number {
  const raw = Number(process.env.DEMO_SESSION_HOURS ?? '2')
  if (!Number.isFinite(raw) || raw <= 0) return 2
  return raw
}

function parseEmailList(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

/** Contas que nunca expiram (dono da demo / você). */
export function isDemoBypassEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const bypass = parseEmailList(process.env.DEMO_BYPASS_EMAILS)
  const owners = parseEmailList(process.env.PLATFORM_OWNER_EMAILS)
  const allowed = new Set([...bypass, ...owners])
  return allowed.has(email.trim().toLowerCase())
}

export type DemoAccessStatus =
  | { status: 'disabled' }
  | { status: 'bypass' }
  | { status: 'active'; expiresAt: Date; remainingMs: number }
  | { status: 'missing' }
  | { status: 'expired' }

export async function getDemoAccessStatus(
  email?: string | null
): Promise<DemoAccessStatus> {
  if (!isDemoMode()) {
    return { status: 'disabled' }
  }

  if (isDemoBypassEmail(email)) {
    return { status: 'bypass' }
  }

  const cookieStore = await cookies()
  const token = cookieStore.get(DEMO_COOKIE_NAME)?.value
  if (!token) {
    return { status: 'missing' }
  }

  const link = await prisma.demoAccessLink.findFirst({
    where: { token },
  })

  if (!link || link.revoked_at) {
    return { status: 'expired' }
  }

  if (!link.started_at || !link.expires_at) {
    return { status: 'missing' }
  }

  const now = Date.now()
  if (link.expires_at.getTime() <= now) {
    return { status: 'expired' }
  }

  return {
    status: 'active',
    expiresAt: link.expires_at,
    remainingMs: link.expires_at.getTime() - now,
  }
}

export async function assertDemoAccessAllowed(
  email?: string | null
): Promise<boolean> {
  const status = await getDemoAccessStatus(email)
  return (
    status.status === 'disabled' ||
    status.status === 'bypass' ||
    status.status === 'active'
  )
}

export function demoCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  }
}
