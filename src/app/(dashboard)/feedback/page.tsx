import { PageHeader } from '@/components/layout/page-header'
import { listClinicReviewsAction } from '@/features/clinic-reviews/actions'
import { ClinicReviewsModeration } from '@/features/clinic-reviews/clinic-reviews-moderation'

export default async function FeedbackPage() {
  const reviews = await listClinicReviewsAction()

  return (
    <div>
      <PageHeader
        title="Depoimentos"
        description="Modere depoimentos fictícios de demonstração e escolha o que aparece na landing"
        backHref="/dashboard"
      />
      <ClinicReviewsModeration reviews={reviews} />
    </div>
  )
}
