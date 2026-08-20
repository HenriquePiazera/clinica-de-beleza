import { auth } from '@/auth'
import { assertDemoAccessAllowed } from '@/lib/demo'
import { ERROR_CODES } from '@/lib/error-codes'

export async function getSession() {
  return auth()
}

export async function requireUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error(ERROR_CODES.UNAUTHORIZED)
  }

  const demoOk = await assertDemoAccessAllowed(session.user.email)
  if (!demoOk) {
    throw new Error(ERROR_CODES.DEMO_SESSION_EXPIRED)
  }

  return session.user.id
}

export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string; errorCode?: string }

export function actionError(
  code: keyof typeof ERROR_CODES
): ActionResult<never> {
  return { success: false, error: ERROR_CODES[code], errorCode: code }
}

export function getClientIp(headers: Headers): string | undefined {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers.get('x-real-ip') ??
    undefined
  )
}
