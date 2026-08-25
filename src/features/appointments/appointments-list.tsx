'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CopyReminderButton } from '@/features/appointments/copy-reminder-button'
import type { AppointmentDTO } from '@/features/appointments/actions'
import { formatDisplayDateTime } from '@/lib/datetime'
import { APPOINTMENT_STATUS_LABELS } from '@/lib/labels'
import { needsConfirmationFollowUp } from '@/lib/appointment-status'
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
  appointments: AppointmentDTO[]
}

export function AppointmentsList({ appointments }: Props) {
  const [nameQuery, setNameQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  const filtered = useMemo(() => {
    const q = nameQuery.trim().toLowerCase()
    const list = appointments.filter((appt) => {
      const nameOk = !q || appt.client_name.toLowerCase().includes(q)
      const dateOk = matchesLocalDate(appt.start_time, dateFilter)
      return nameOk && dateOk
    })

    list.sort((a, b) => {
      const aAlert = needsConfirmationFollowUp(a.status, a.start_time) ? 0 : 1
      const bAlert = needsConfirmationFollowUp(b.status, b.start_time) ? 0 : 1
      if (aAlert !== bAlert) return aAlert - bAlert
      const diff =
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      return sortOrder === 'asc' ? diff : -diff
    })

    return list
  }, [appointments, nameQuery, dateFilter, sortOrder])

  return (
    <div className="space-y-4">
      <ListSearchToolbar
        nameQuery={nameQuery}
        onNameQueryChange={setNameQuery}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
      />

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-8 text-center">
            {appointments.length === 0
              ? 'Nenhum agendamento cadastrado.'
              : 'Nenhum agendamento encontrado com estes filtros.'}
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {filtered.map((appt) => {
            const needsConfirm = needsConfirmationFollowUp(
              appt.status,
              appt.start_time
            )
            return (
              <li key={appt.id}>
                <Card
                  className={cn(appointmentCardClassName(appt.status))}
                >
                  <CardContent className="space-y-3 py-4">
                    {needsConfirm ? (
                      <CardStatusAlert>
                        Confirmação pendente: entre em contato com a cliente e
                        altere o status para Confirmado, Cancelado ou Excluir o
                        agendamento.
                      </CardStatusAlert>
                    ) : null}
                    <Link
                      href={`/appointments/${appt.id}`}
                      className="hover:bg-muted/50 -mx-2 block min-h-11 rounded-lg px-2 py-1 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{appt.client_name}</p>
                          <p className="text-muted-foreground text-sm">
                            {formatDisplayDateTime(appt.start_time)} —{' '}
                            {new Date(appt.end_time).toLocaleTimeString(
                              'pt-BR',
                              {
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </p>
                        </div>
                        <Badge
                          variant={getAppointmentStatusBadgeVariant(
                            appt.status
                          )}
                        >
                          {APPOINTMENT_STATUS_LABELS[appt.status] ??
                            appt.status}
                        </Badge>
                      </div>
                    </Link>
                    {appt.status !== 'canceled' ? (
                      <CopyReminderButton appointmentId={appt.id} />
                    ) : null}
                  </CardContent>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
