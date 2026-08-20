import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CopyReminderButton } from '@/features/appointments/copy-reminder-button'
import { listAppointmentsAction } from '@/features/appointments/actions'
import { APPOINTMENT_STATUS_LABELS } from '@/lib/labels'
import { getAppointmentStatusBadgeVariant } from '@/lib/status-badges'

export default async function AppointmentsPage() {
  const appointments = await listAppointmentsAction()

  return (
    <div>
      <PageHeader
        title="Agenda"
        description="Seus agendamentos"
        backHref="/dashboard"
        actionHref="/appointments/new"
        actionLabel="Novo agendamento"
      />
      {appointments.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum agendamento cadastrado.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {appointments.map((appt) => (
            <li key={appt.id}>
              <Card>
                <CardContent className="space-y-3 py-4">
                  <Link
                    href={`/appointments/${appt.id}`}
                    className="block min-h-11 rounded-lg transition-colors hover:bg-muted/50 -mx-2 px-2 py-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{appt.client_name}</p>
                        <p className="text-muted-foreground text-sm">
                          {new Date(appt.start_time).toLocaleString('pt-BR')} —{' '}
                          {new Date(appt.end_time).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <Badge variant={getAppointmentStatusBadgeVariant(appt.status)}>
                        {APPOINTMENT_STATUS_LABELS[appt.status] ?? appt.status}
                      </Badge>
                    </div>
                  </Link>
                  {appt.status !== 'canceled' ? (
                    <CopyReminderButton appointmentId={appt.id} />
                  ) : null}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
