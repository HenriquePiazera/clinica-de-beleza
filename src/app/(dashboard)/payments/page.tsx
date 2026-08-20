import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { listPaymentsAction } from '@/features/payments/actions'
import { getPaymentMethodLabel } from '@/lib/payment-labels'
import { getPaymentStatusBadgeVariant } from '@/lib/status-badges'

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  canceled: 'Cancelado',
}

export default async function PaymentsPage() {
  const payments = await listPaymentsAction()

  return (
    <div>
      <PageHeader
        title="Financeiro"
        description="Controle de recebimentos"
        backHref="/dashboard"
        actionHref="/payments/new"
        actionLabel="Novo pagamento"
      />
      {payments.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum pagamento registrado.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {payments.map((payment) => (
            <li key={payment.id}>
              <Card>
                <CardContent className="flex min-h-11 items-center justify-between py-4">
                  <div>
                    <p className="font-medium">{payment.client_name}</p>
                    <p className="text-muted-foreground text-sm">
                      {getPaymentMethodLabel(payment.payment_method)} —{' '}
                      {new Date(payment.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {payment.amount.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </p>
                    <Badge
                      variant={getPaymentStatusBadgeVariant(payment.status)}
                      className="mt-1"
                    >
                      {statusLabels[payment.status] ?? payment.status}
                    </Badge>
                    {payment.status === 'paid' ? (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="mt-3 min-h-11 w-full sm:w-auto"
                      >
                        <Link href={`/payments/${payment.id}/receipt`}>
                          Emitir recibo
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
