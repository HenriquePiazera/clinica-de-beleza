import { TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  children: React.ReactNode
  className?: string
}

/** Alerta administrativo no card (ícone + texto; sem borda piscante). */
export function CardStatusAlert({ children, className }: Props) {
  return (
    <div
      role="alert"
      className={cn('flex items-start gap-2.5 text-sm text-warning', className)}
    >
      <TriangleAlert
        className="mt-0.5 size-5 shrink-0"
        aria-hidden
        strokeWidth={2.25}
      />
      <p className="font-medium leading-snug text-foreground">{children}</p>
    </div>
  )
}
