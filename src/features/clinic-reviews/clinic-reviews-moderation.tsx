'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  archiveClinicReviewAction,
  setReviewLandingVisibilityAction,
  type ClinicReviewDTO,
} from '@/features/clinic-reviews/actions'
import { formatDisplayDateTime } from '@/lib/datetime'

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  published: 'Publicado',
  archived: 'Arquivado',
}

type Props = {
  reviews: ClinicReviewDTO[]
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-warning text-sm" aria-label={`${rating} de 5`}>
      {'★'.repeat(rating)}
      <span className="text-muted-foreground">{'☆'.repeat(5 - rating)}</span>
    </span>
  )
}

export function ClinicReviewsModeration({ reviews }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function refreshAfter(action: () => Promise<unknown>) {
    startTransition(async () => {
      await action()
      router.refresh()
    })
  }

  const pendingList = reviews.filter((r) => r.status === 'pending')
  const publishedList = reviews.filter((r) => r.status === 'published')
  const archivedList = reviews.filter((r) => r.status === 'archived')
  const onLanding = publishedList.filter((r) => r.show_on_landing)
  const publishedOff = publishedList.filter((r) => !r.show_on_landing)

  function ReviewCard({ review }: { review: ClinicReviewDTO }) {
    return (
      <Card>
        <CardContent className="space-y-3 py-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">{review.author_name}</p>
              <Stars rating={review.rating} />
              <p className="text-muted-foreground mt-1 text-xs">
                {formatDisplayDateTime(review.created_at)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant="secondary">
                {statusLabels[review.status] ?? review.status}
              </Badge>
              {review.show_on_landing ? (
                <Badge variant="success">Na landing</Badge>
              ) : null}
              {!review.allow_publish ? (
                <Badge variant="destructive">Sem autorização</Badge>
              ) : null}
            </div>
          </div>
          <p className="text-sm leading-relaxed">{review.message}</p>
          {review.status !== 'archived' ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              {review.allow_publish && !review.show_on_landing ? (
                <Button
                  type="button"
                  className="min-h-11"
                  disabled={pending}
                  onClick={() =>
                    refreshAfter(() =>
                      setReviewLandingVisibilityAction(review.id, true)
                    )
                  }
                >
                  Mostrar na landing
                </Button>
              ) : null}
              {review.show_on_landing ? (
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  disabled={pending}
                  onClick={() =>
                    refreshAfter(() =>
                      setReviewLandingVisibilityAction(review.id, false)
                    )
                  }
                >
                  Tirar da landing
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                disabled={pending}
                onClick={() =>
                  refreshAfter(() => archiveClinicReviewAction(review.id))
                }
              >
                Arquivar
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    )
  }

  function Section({
    title,
    description,
    items,
  }: {
    title: string
    description: string
    items: ClinicReviewDTO[]
  }) {
    return (
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        {items.length === 0 ? (
          <Card>
            <CardContent className="text-muted-foreground py-6 text-center text-sm">
              Nenhum depoimento nesta lista.
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {items.map((review) => (
              <li key={review.id}>
                <ReviewCard review={review} />
              </li>
            ))}
          </ul>
        )}
      </section>
    )
  }

  return (
    <div className="space-y-8">
      <Section
        title="Pendentes"
        description="Novos envios aguardando sua decisão."
        items={pendingList}
      />
      <Section
        title="Na landing"
        description="Visíveis na página inicial do site."
        items={onLanding}
      />
      <Section
        title="Publicados (fora da landing)"
        description="Aprovados, mas ainda não exibidos no site."
        items={publishedOff}
      />
      <Section
        title="Arquivados"
        description="Ocultos da moderação ativa."
        items={archivedList}
      />
    </div>
  )
}
