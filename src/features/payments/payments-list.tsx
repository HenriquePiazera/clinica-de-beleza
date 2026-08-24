'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { PaymentDTO } from '@/features/payments/actions'
import type { PendingQueueItemDTO } from '@/features/appointments/actions'
import { formatDisplayDate, formatDisplayDateTime } from '@/lib/datetime'
import { APPOINTMENT_STATUS_LABELS } from '@/lib/labels'
import { isQueueItemPastMidnight } from '@/lib/appointment-status'
import {
  appointmentCardClassName,
  getAppointmentStatusBadgeVariant,
  getPaymentStatusBadgeVariant,
  getPaymentStatusCardClass,
} from '@/lib/status-badges'
import { formatPaymentMethodsSummary } from '@/lib/payment-labels'
import { CardStatusAlert } from '@/components/lists/card-status-alert'
import {
  ListSearchToolbar,
  matchesLocalDate,
  type SortOrder,
} from '@/components/lists/list-search-toolbar'
import { cn } from '@/lib/utils'

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  canceled: 'Cancelado',
}

type Props = {
  queue: PendingQueueItemDTO[]
  payments: PaymentDTO[]
}

export function PaymentsList({ queue, payments }: Props) {
  const [nameQuery, setNameQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const filteredQueue = useMemo(() => {
    const q = nameQuery.trim().toLowerCase()
    const list = queue.filter((item) => {
      const nameOk = !q || item.client_name.toLowerCase().includes(q)
      const dateOk = matchesLocalDate(item.start_time, dateFilter)
      return nameOk && dateOk
    })
    list.sort((a, b) => {
      const aOverdue = isQueueItemPastMidnight(a.start_time) ? 0 : 1
      const bOverdue = isQueueItemPastMidnight(b.start_time) ? 0 : 1
      if (aOverdue !== bOverdue) return aOverdue - bOverdue
      const diff =
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      return sortOrder === 'asc' ? diff : -diff
    })
    return list
  }, [queue, nameQuery, dateFilter, sortOrder])

  const filteredPayments = useMemo(() => {
    const q = nameQuery.trim().toLowerCase()
    const list = payments.filter((item) => {
      const nameOk = !q || item.client_name.toLowerCase().includes(q)
      const dateOk = matchesLocalDate(item.created_at, dateFilter)
      return nameOk && dateOk
    })
    list.sort((a, b) => {
      const diff =
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return sortOrder === 'asc' ? diff : -diff
    })
    return list
  }, [payments, nameQuery, dateFilter, sortOrder])

  return (
    <div className="space-y-6">
      <ListSearchToolbar
        nameQuery={nameQuery}
        onNameQueryChange={setNameQuery}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
      />

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Fila aguardando baixa</h2>
          <p className="text-muted-foreground text-sm">
            Atendimentos realizados ou cancelados sem pagamento registrado.
          </p>
        </div>
        {filteredQueue.length === 0 ? (
          <Card>
            <CardContent className="text-muted-foreground py-6 text-center text-sm">
              Nenhuma pendência na fila.
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {filteredQueue.map((item) => {
              const overdue = isQueueItemPastMidnight(item.start_time)
              return (
                <li key={item.appointment_id}>
                  <Card
                    className={cn(
                      appointmentCardClassName(item.status, {
                        alert: overdue,
                      })
                    )}
                  >
                    <CardContent className="space-y-3 py-4">
                      {overdue ? (
                        <CardStatusAlert>
                          Pendência atrasada: conclua a baixa para retirar este
                          atendimento da fila.
                        </CardStatusAlert>
                      ) : null}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{item.client_name}</p>
                          <p className="text-muted-foreground text-sm">
                            {formatDisplayDateTime(item.start_time)}
                          </p>
                        </div>
                        <Badge
                          variant={getAppointmentStatusBadgeVariant(
                            item.status
                          )}
                        >
                          {APPOINTMENT_STATUS_LABELS[item.status] ??
                            item.status}
                        </Badge>
                      </div>
                      <Button asChild className="min-h-11 w-full">
                        <Link
                          href={`/payments/new?appointmentId=${item.appointment_id}&clientId=${item.client_id}`}
                        >
                          Registrar baixa
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Pagamentos registrados</h2>
        {filteredPayments.length === 0 ? (
          <Card>
            <CardContent className="text-muted-foreground py-6 text-center text-sm">
              {payments.length === 0
                ? 'Nenhum pagamento registrado.'
                : 'Nenhum pagamento encontrado com estes filtros.'}
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {filteredPayments.map((payment) => (
              <li key={payment.id}>
                <Card className={cn(getPaymentStatusCardClass(payment.status))}>
                  <CardContent className="space-y-3 py-4">
                    <div className="flex min-h-11 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">{payment.client_name}</p>
                        <p className="text-muted-foreground text-sm">
                          {formatDisplayDate(payment.created_at)}
                        </p>
                        <p className="mt-2 text-sm">
                          {formatPaymentMethodsSummary(
                            payment.payment_method,
                            payment.method_splits,
                            payment.amount
                          )}
                        </p>
                        {payment.notes ? (
                          <p className="text-muted-foreground mt-2 text-sm">
                            Obs.: {payment.notes}
                          </p>
                        ) : null}
                      </div>
                      <div className="shrink-0 text-right">
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
                      </div>
                    </div>
                    {payment.status === 'paid' ? (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="min-h-11 w-full sm:w-auto"
                      >
                        <Link href={`/payments/${payment.id}/receipt`}>
                          Emitir recibo
                        </Link>
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
