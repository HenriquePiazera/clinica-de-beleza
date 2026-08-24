import { PageHeader } from '@/components/layout/page-header'
import { AppointmentsList } from '@/features/appointments/appointments-list'
import { listAppointmentsAction } from '@/features/appointments/actions'

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
      <AppointmentsList appointments={appointments} />
    </div>
  )
}
