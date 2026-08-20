import { PageHeader } from '@/components/layout/page-header'
import { FeedbackForm } from '@/features/feedback/feedback-form'

export default function FeedbackPage() {
  return (
    <div>
      <PageHeader
        title="Feedback"
        description="Ajude-nos a melhorar"
        backHref="/dashboard"
      />
      <FeedbackForm />
    </div>
  )
}
