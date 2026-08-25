import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  DEMO_COOKIE_NAME,
  demoCookieOptions,
  getDemoSessionHours,
  isDemoMode,
} from '@/lib/demo'
import { getAppBaseUrlSync } from '@/lib/app-url'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  context: { params: { token: string } }
) {
  const { token } = context.params
  const baseUrl = getAppBaseUrlSync().replace(/\/$/, '')

  if (!isDemoMode()) {
    return NextResponse.redirect(`${baseUrl}/login`)
  }

  const link = await prisma.demoAccessLink.findFirst({
    where: { token },
  })

  if (!link || link.revoked_at) {
    return NextResponse.redirect(`${baseUrl}/demo-expired`)
  }

  const hours = getDemoSessionHours()
  const now = new Date()

  if (link.expires_at && link.expires_at.getTime() <= now.getTime()) {
    return NextResponse.redirect(`${baseUrl}/demo-expired`)
  }

  let expiresAt = link.expires_at
  if (!link.started_at || !expiresAt) {
    expiresAt = new Date(now.getTime() + hours * 60 * 60 * 1000)
    await prisma.demoAccessLink.update({
      where: { id: link.id },
      data: {
        started_at: now,
        expires_at: expiresAt,
      },
    })
  }

  const remainingSeconds = Math.max(
    60,
    Math.floor((expiresAt.getTime() - now.getTime()) / 1000)
  )

  const response = NextResponse.redirect(`${baseUrl}/login?demo=1`)
  response.cookies.set(
    DEMO_COOKIE_NAME,
    token,
    demoCookieOptions(remainingSeconds)
  )
  return response
}
