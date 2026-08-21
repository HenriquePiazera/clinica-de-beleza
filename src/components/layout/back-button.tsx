import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
  href: string
  label?: string
  className?: string
}

/** Link de voltar padrão (mobile-first, ≥ 44px). */
export function BackButton({ href, label = 'Voltar', className }: Props) {
  return (
    <Button
      asChild
      variant="ghost"
      className={cn(
        'text-muted-foreground hover:text-foreground min-h-11 gap-1.5 px-2',
        className
      )}
    >
      <Link href={href} aria-label={label}>
        <ArrowLeft className="size-5 shrink-0" />
        <span className="text-sm font-medium">{label}</span>
      </Link>
    </Button>
  )
}
