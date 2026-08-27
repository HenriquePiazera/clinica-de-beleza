import { refreshAndRedirect } from '@/lib/refresh'
import { auth } from '@/auth'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { listClientsAction } from '@/features/clients/actions'
import { createAppointmentAction } from '@/features/appointments/actions'
import { SubmitButton } from '@/components/forms/submit-button'
import { ResettableForm } from '@/components/forms/resettable-form'
import { formKeyFromSearchParams } from '@/lib/form-key'
import { selectFieldClassName } from '@/lib/labels'
import { getMinDatetimeLocalValue } from '@/lib/datetime'
import { getClinicOwnerId, getTeamProfessionals } from '@/lib/team'

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams?: { refreshed?: string | string[]; error?: string }
}) {
  const session = await auth()
  const clients = await listClientsAction()
  const minDatetime = getMinDatetimeLocalValue()
  const formKey = formKeyFromSearchParams(searchParams)

  const ownerId = session?.user?.id
    ? await getClinicOwnerId(session.user.id)
    : null
  const professionals = ownerId ? await getTeamProfessionals(ownerId) : []
  const showProfessionalPicker = professionals.length > 1
  const defaultProfessionalId =
    session?.user?.id &&
    professionals.some((p) => p.id === session.user!.id)
      ? session.user.id
      : professionals[0]?.id

  return (
    <div>
      <PageHeader title="Novo agendamento" backHref="/appointments" />
      <Card>
        <CardContent className="pt-6">
          <ResettableForm
            formKey={formKey}
            action={async (formData) => {
              'use server'
              const result = await createAppointmentAction(formData)
              if (result.success) refreshAndRedirect('/appointments')
              refreshAndRedirect('/appointments/new?error=1')
            }}
            className="space-y-4"
          >
            {showProfessionalPicker ? (
              <div className="space-y-2">
                <Label htmlFor="professional_user_id">Profissional *</Label>
                <select
                  id="professional_user_id"
                  name="professional_user_id"
                  required
                  defaultValue={defaultProfessionalId}
                  className={selectFieldClassName}
                >
                  {professionals.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="client_id">Cliente *</Label>
              <select
                id="client_id"
                name="client_id"
                required
                className={selectFieldClassName}
              >
                <option value="">Selecione</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_time">Início *</Label>
              <Input
                id="start_time"
                name="start_time"
                type="datetime-local"
                required
                min={minDatetime}
                className="min-h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">Fim *</Label>
              <Input
                id="end_time"
                name="end_time"
                type="datetime-local"
                required
                min={minDatetime}
                className="min-h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buffer_minutes">Margem após atendimento (min)</Label>
              <select
                id="buffer_minutes"
                name="buffer_minutes"
                defaultValue="0"
                className={selectFieldClassName}
              >
                <option value="0">0 min</option>
                <option value="10">10 min</option>
                <option value="15">15 min</option>
                <option value="30">30 min</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" name="notes" rows={2} />
            </div>
            <SubmitButton>Salvar agendamento</SubmitButton>
          </ResettableForm>
        </CardContent>
      </Card>
    </div>
  )
}
