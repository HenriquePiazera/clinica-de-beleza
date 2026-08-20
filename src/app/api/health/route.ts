import { NextResponse } from 'next/server'
import { isResendConfigured } from '@/services/email.service'
import { getAppBaseUrlSync } from '@/lib/app-url'

export async function GET() {
  const pushConfigured = Boolean(
    process.env.VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT
  )

  return NextResponse.json({
    status: 'ok',
    mode:
      process.env.DEMO_MODE === 'true'
        ? 'demo'
        : process.env.BILLING_ENABLED === 'true'
          ? 'billing'
          : 'beta',
    appUrl: getAppBaseUrlSync(),
    resend: isResendConfigured(),
    push: pushConfigured,
    timestamp: new Date().toISOString(),
  })
}
