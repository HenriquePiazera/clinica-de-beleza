import type { Metadata } from 'next'
import { auth } from '@/auth'
import { LandingPage } from '@/components/landing/landing-page'
import { getLandingClinicData } from '@/features/landing/get-landing-data'
import { APP_NAME, APP_TAGLINE, APP_PRESENTATION } from '@/lib/brand'

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description: APP_PRESENTATION,
}

export const dynamic = 'force-dynamic'

export default async function LandingRoutePage() {
  const [session, clinic] = await Promise.all([auth(), getLandingClinicData()])
  return (
    <LandingPage
      isLoggedIn={Boolean(session?.user)}
      clinic={clinic}
    />
  )
}
