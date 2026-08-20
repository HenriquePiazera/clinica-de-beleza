import type { VariantProps } from 'class-variance-authority'
import { badgeVariants } from '@/components/ui/badge'

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
