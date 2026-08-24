'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ServiceRecordDTO } from '@/features/records/actions'
import type { PendingQueueItemDTO } from '@/features/appointments/actions'
import { formatDisplayDate, formatDisplayDateTime } from '@/lib/datetime'
import { APPOINTMENT_STATUS_LABELS } from '@/lib/labels'
import { isQueueItemPastMidnight } from '@/lib/appointment-status'
import {
  appointmentCardClassName,
  getAppointmentStatusBadgeVariant,
} from '@/lib/status-badges'
import { CardStatusAlert } from '@/components/lists/card-status-alert'
import {
  ListSearchToolbar,
  matchesLocalDate,
  type SortOrder,
} from '@/components/lists/list-search-toolbar'
import { cn } from '@/lib/utils'

type Props = {
  queue: PendingQueueItemDTO[]
  records: ServiceRecordDTO[]
}

export function RecordsList({ queue, records }: Props) {
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

  const filteredRecords = useMemo(() => {
    const q = nameQuery.trim().toLowerCase()
    const list = records.filter((item) => {
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
  }, [records, nameQuery, dateFilter, sortOrder])

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
          <h2 className="text-base font-semibold">Fila aguardando anotações</h2>
          <p className="text-muted-foreground text-sm">
            Atendimentos realizados ou cancelados sem registro no histórico.
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
                          Pendência atrasada: conclua as anotações para retirar
                          este atendimento da fila.
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
                          href={`/records/new?appointmentId=${item.appointment_id}&clientId=${item.client_id}`}
                        >
                          Registrar anotações
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
        <h2 className="text-base font-semibold">Registros concluídos</h2>
        {filteredRecords.length === 0 ? (
          <Card>
            <CardContent className="text-muted-foreground py-6 text-center text-sm">
              {records.length === 0
                ? 'Nenhum registro de atendimento.'
                : 'Nenhum registro encontrado com estes filtros.'}
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {filteredRecords.map((record) => (
              <li key={record.id}>
                <Link href={`/records/${record.id}`}>
                  <Card className="hover:bg-muted/50 transition-colors">
                    <CardContent className="min-h-11 py-4">
                      <p className="font-medium">{record.client_name}</p>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {formatDisplayDate(record.created_at)}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm">
                        {record.description}
                      </p>
                      {record.evolution ? (
                        <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
                          Evolução: {record.evolution}
                        </p>
                      ) : null}
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
