import { PageHeader } from '@/components/layout/page-header'
import { listPaymentsAction } from '@/features/payments/actions'
import { listPendingFinanceQueueAction } from '@/features/appointments/actions'
import { PaymentsList } from '@/features/payments/payments-list'

export default async function PaymentsPage() {
  const [payments, queue] = await Promise.all([
    listPaymentsAction(),
    listPendingFinanceQueueAction(),
  ])

  return (
    <div>
      <PageHeader
        title="Financeiro"
        description="Fila de baixas e controle de recebimentos"
        backHref="/dashboard"
        actionHref="/payments/new"
        actionLabel="Novo pagamento"
      />
      <PaymentsList queue={queue} payments={payments} />
    </div>
  )
}
