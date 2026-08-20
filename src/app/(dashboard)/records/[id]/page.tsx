import { notFound } from 'next/navigation'
import { refreshAndRedirect } from '@/lib/refresh'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FormErrorBanner } from '@/components/forms/form-error-banner'
import { DestructiveActionButton } from '@/components/forms/destructive-action-button'
import { SubmitButton } from '@/components/forms/submit-button'
import { ResettableForm } from '@/components/forms/resettable-form'
import { formKeyFromSearchParams } from '@/lib/form-key'
import { listClientsAction } from '@/features/clients/actions'
import { listAppointmentsAction } from '@/features/appointments/actions'
import {
  getRecordAction,
  updateRecordAction,
  deleteRecordAction,
} from '@/features/records/actions'
import { selectFieldClassName } from '@/lib/labels'

export default async function RecordDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { error?: string; refreshed?: string | string[] }
}) {
  const record = await getRecordAction(params.id)
  if (!record) notFound()

  const [clients, appointments] = await Promise.all([
    listClientsAction(),
    listAppointmentsAction(),
  ])
  const formKey = formKeyFromSearchParams(searchParams)

  const errorMessage = searchParams.error
    ? decodeURIComponent(searchParams.error)
    : null

  async function handleUpdate(formData: FormData) {
    'use server'
    const result = await updateRecordAction(params.id, formData)
    if (result.success) refreshAndRedirect('/records')
    refreshAndRedirect(
      `/records/${params.id}?error=${encodeURIComponent(result.error ?? 'Erro ao salvar')}`
    )
  }

  async function handleDelete() {
    'use server'
    await deleteRecordAction(params.id)
    refreshAndRedirect('/records')
  }

  return (
    <div>
      <PageHeader
        title={record.client_name}
        description={`Registro de ${new Date(record.created_at).toLocaleString('pt-BR')}`}
        backHref="/records"
      />
      <FormErrorBanner message={errorMessage} />
      <Card className="mb-6">
        <CardContent className="pt-6">
          <ResettableForm formKey={formKey} action={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client_id">Cliente *</Label>
              <select
                id="client_id"
                name="client_id"
                required
                defaultValue={record.client_id}
                className={selectFieldClassName}
              >
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="appointment_id">Agendamento *</Label>
              <select
                id="appointment_id"
                name="appointment_id"
                required
                defaultValue={record.appointment_id}
                className={selectFieldClassName}
              >
                {appointments
                  .filter((appt) => appt.status !== 'canceled')
                  .map((appt) => (
                    <option key={appt.id} value={appt.id}>
                      {appt.client_name} —{' '}
                      {new Date(appt.start_time).toLocaleString('pt-BR')}
                    </option>
                  ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                name="description"
                required
                rows={3}
                defaultValue={record.description}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="evolution">Evolução</Label>
              <Textarea
                id="evolution"
                name="evolution"
                rows={3}
                defaultValue={record.evolution ?? ''}
              />
            </div>
            <SubmitButton>Salvar alterações</SubmitButton>
          </ResettableForm>
        </CardContent>
      </Card>

      <DestructiveActionButton
        action={handleDelete}
        buttonLabel="Excluir registro"
        title="Excluir registro de atendimento?"
        description="Esta ação é permanente e não pode ser desfeita."
      />
    </div>
  )
}
