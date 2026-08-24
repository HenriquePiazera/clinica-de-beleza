import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { ClinicReviewForm } from '@/features/clinic-reviews/clinic-review-form'
import { Logo } from '@/components/layout/logo'
import { APP_NAME } from '@/lib/brand'

export default function AvaliarPage() {
  return (
    <div className="min-h-screen bg-[#f7f0eb]">
      <header className="border-b border-white/10 bg-[#1a1214] text-white">
        <div className="mx-auto flex min-h-14 max-w-lg items-center justify-between gap-3 px-4">
          <Logo href="/" size="sm" variant="header" />
          <Link
            href="/"
            className="text-sm text-white/70 underline-offset-2 hover:text-white hover:underline"
          >
            Início
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 py-8">
        <PageHeader
          title="Deixe seu depoimento"
          description={`Conte como foi sua experiência na ${APP_NAME}.`}
        />
        <ClinicReviewForm />
      </main>
    </div>
  )
}
