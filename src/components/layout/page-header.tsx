import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BRAND } from '@/lib/brand'

export function PageHeader({
  title,
  description,
  backHref,
  backLabel = 'Voltar',
  actionHref,
  actionLabel,
}: {
  title: string
  description?: string
  backHref?: string
  backLabel?: string
  actionHref?: string
  actionLabel?: string
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        {backHref ? (
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="min-h-11 min-w-11 shrink-0 text-muted-foreground"
          >
            <Link href={backHref} aria-label={backLabel} title={backLabel}>
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
        ) : null}
        <div className="min-w-0">
          <h1 className={BRAND.pageTitle}>{title}</h1>
          {description ? (
            <p className={BRAND.pageDescription}>{description}</p>
          ) : null}
        </div>
      </div>
      {actionHref && actionLabel ? (
        <Button asChild className="min-h-11 shrink-0">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  )
}
