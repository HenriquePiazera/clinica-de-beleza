'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateFeedbackStatusAction } from '@/features/internal/actions'
import { FEEDBACK_STATUS_LABELS } from '@/lib/labels'
import { selectFieldClassName } from '@/lib/labels'
import type { FeedbackStatus } from '@/generated/prisma/client'

type FeedbackStatusSelectProps = {
  feedbackId: string
  currentStatus: FeedbackStatus
}

export function FeedbackStatusSelect({
  feedbackId,
  currentStatus,
}: FeedbackStatusSelectProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <select
      name="status"
      defaultValue={currentStatus}
      disabled={isPending}
      className={selectFieldClassName}
      onChange={(event) => {
        const status = event.target.value as FeedbackStatus
        startTransition(async () => {
          await updateFeedbackStatusAction(feedbackId, status)
          router.refresh()
        })
      }}
    >
      {Object.entries(FEEDBACK_STATUS_LABELS).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  )
}
