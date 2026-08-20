import { redirect } from 'next/navigation'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { getDemoSessionHours, isDemoMode } from '@/lib/demo'
import { getAppBaseUrlSync } from '@/lib/app-url'

/** Mantido para scripts / uso interno; ativação pública é via Route Handler. */
export async function activateDemoAccessToken(token: string): Promise<void> {
  if (!isDemoMode()) {
    redirect('/login')
  }

  const link = await prisma.demoAccessLink.findFirst({
    where: { token },
  })

  if (!link || link.revoked_at) {
    redirect('/demo-expired')
  }

  const now = new Date()
  if (link.expires_at && link.expires_at.getTime() <= now.getTime()) {
    redirect('/demo-expired')
  }

  if (!link.started_at || !link.expires_at) {
    const hours = getDemoSessionHours()
    await prisma.demoAccessLink.update({
      where: { id: link.id },
      data: {
        started_at: now,
        expires_at: new Date(now.getTime() + hours * 60 * 60 * 1000),
      },
    })
  }

  redirect(`/demo/${token}`)
}

export async function createDemoAccessLink(label?: string): Promise<{
  token: string
  url: string
}> {
  const token = randomBytes(24).toString('hex')
  await prisma.demoAccessLink.create({
    data: {
      token,
      label: label?.trim() || null,
    },
  })

  const baseUrl = getAppBaseUrlSync().replace(/\/$/, '')
  return {
    token,
    url: `${baseUrl}/demo/${token}`,
  }
}
