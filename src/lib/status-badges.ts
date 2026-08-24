import type { VariantProps } from 'class-variance-authority'
import { badgeVariants } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>

export function getAppointmentStatusBadgeVariant(
  status: string
): BadgeVariant {
  switch (status) {
    case 'confirmed':
    case 'completed':
      return 'success'
    case 'awaiting_confirmation':
      return 'warning'
    case 'scheduled':
      return 'info'
    case 'canceled':
      return 'destructive'
    default:
      return 'secondary'
  }
}

export function getPaymentStatusBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case 'paid':
      return 'success'
    case 'pending':
      return 'warning'
    case 'canceled':
      return 'destructive'
    default:
      return 'secondary'
  }
}

/** Borda/fundo do card conforme status do agendamento. */
export function getAppointmentStatusCardClass(status: string): string {
  switch (status) {
    case 'confirmed':
    case 'completed':
      return 'border-success/45 bg-success/5'
    case 'awaiting_confirmation':
      return 'border-warning/50 bg-warning/10'
    case 'scheduled':
      return 'border-info/45 bg-info/5'
    case 'canceled':
      return 'border-destructive/40 bg-destructive/5'
    default:
      return ''
  }
}

/** Destaque laranja pulsante para alerta administrativo. */
export function getAlertCardClass(): string {
  return 'animate-alert-pulse border-2 border-warning bg-warning/40 ring-2 ring-warning shadow-[0_0_0_2px_rgba(224,138,60,0.35)]'
}

export function getPaymentStatusCardClass(status: string): string {
  switch (status) {
    case 'paid':
      return 'border-success/45 bg-success/5'
    case 'pending':
      return 'border-warning/50 bg-warning/10'
    case 'canceled':
      return 'border-destructive/40 bg-destructive/5'
    default:
      return ''
  }
}

export function appointmentCardClassName(
  status: string,
  options?: { alert?: boolean }
): string {
  if (options?.alert) return getAlertCardClass()
  return cn(getAppointmentStatusCardClass(status))
}
