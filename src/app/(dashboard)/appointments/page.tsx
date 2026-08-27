import { PageHeader } from '@/components/layout/page-header'
import { AppointmentsList } from '@/features/appointments/appointments-list'
import { listAppointmentsAction } from '@/features/appointments/actions'
import { auth } from '@/auth'
import { getClinicOwnerId, getTeamMembersForScheduling } from '@/lib/team'

export default async function AppointmentsPage() {
  const session = await auth()
  const appointments = await listAppointmentsAction()
  const ownerId = session?.user?.id
    ? await getClinicOwnerId(session.user.id)
    : null
  const teamMembers = ownerId ? await getTeamMembersForScheduling(ownerId) : []
  const showProfessional = teamMembers.length > 1

  return (
    <div>
      <PageHeader
        title="Agenda"
        description="Seus agendamentos"
        backHref="/dashboard"
        actionHref="/appointments/new"
        actionLabel="Novo agendamento"
      />
      <AppointmentsList
        appointments={appointments}
        showProfessional={showProfessional}
      />
    </div>
  )
}
