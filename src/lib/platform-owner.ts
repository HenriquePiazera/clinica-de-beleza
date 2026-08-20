import { auth } from '@/auth'
import { ERROR_CODES } from '@/lib/error-codes'

export function getPlatformOwnerEmails(): string[] {
  const raw = process.env.PLATFORM_OWNER_EMAILS ?? ''
  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export function isPlatformOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const owners = getPlatformOwnerEmails()
  if (owners.length === 0) return false
  return owners.includes(email.trim().toLowerCase())
}

export async function isPlatformOwner(): Promise<boolean> {
  const session = await auth()
  return isPlatformOwnerEmail(session?.user?.email)
}

export async function requirePlatformOwner(): Promise<{
  userId: string
  email: string
}> {
  const session = await auth()
  const userId = session?.user?.id
  const email = session?.user?.email

  if (!userId || !email) {
    throw new Error(ERROR_CODES.UNAUTHORIZED)
  }

  if (!isPlatformOwnerEmail(email)) {
    throw new Error(ERROR_CODES.FORBIDDEN)
  }

  return { userId, email }
}
