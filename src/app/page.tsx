import type { Metadata } from 'next'
import { auth } from '@/auth'
import { LandingPage } from '@/components/landing/landing-page'
import { APP_NAME, APP_TAGLINE, APP_SLOGAN } from '@/lib/brand'

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description: `${APP_SLOGAN} Sistema de agenda e atendimento para clínicas, salões e profissionais.`,
}

export default async function HomePage() {
  const session = await auth()
  return <LandingPage isLoggedIn={Boolean(session?.user)} />
}
