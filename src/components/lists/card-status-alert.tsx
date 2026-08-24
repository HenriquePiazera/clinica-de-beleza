import { cn } from '@/lib/utils'

type Props = {
  children: React.ReactNode
  className?: string
}

/** Alerta visual laranja piscante (confirmação / fila atrasada). */
export function CardStatusAlert({ children, className }: Props) {
  return (
    <p
      role="alert"
      className={cn(
        'animate-alert-banner-blink rounded-md border-2 border-warning bg-warning/70 px-3 py-2.5 text-sm font-semibold text-warning-foreground shadow-sm',
        className
      )}
    >
      {children}
    </p>
  )
}
