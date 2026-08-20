import { refreshAndRedirect } from '@/lib/refresh'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { listClientsAction } from '@/features/clients/actions'
import { listAppointmentsAction } from '@/features/appointments/actions'
import { createRecordAction } from '@/features/records/actions'
import { SubmitButton } from '@/components/forms/submit-button'
import { ResettableForm } from '@/components/forms/resettable-form'
import { formKeyFromSearchParams } from '@/lib/form-key'
import { selectFieldClassName } from '@/lib/labels'

export default async function NewRecordPage({
  searchParams,
}: {
  searchParams?: { refreshed?: string | string[]; error?: string }
}) {
  const [clients, appointments] = await Promise.all([
    listClientsAction(),
    listAppointmentsAction(),
  ])
  const formKey = formKeyFromSearchParams(searchParams)

  return (
    <div>
      <PageHeader title="Novo registro" backHref="/records" />
      <Card>
        <CardContent className="pt-6">
          <ResettableForm
            formKey={formKey}
            action={async (formData) => {
              'use server'
              const result = await createRecordAction(formData)
              if (result.success) refreshAndRedirect('/records')
              refreshAndRedirect('/records/new?error=1')
            }}
            className="space-y-4"
          >
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
              <Label htmlFor="appointment_id">Agendamento *</Label>
              <select
                id="appointment_id"
                name="appointment_id"
                required
                className={selectFieldClassName}
              >
                <option value="">Selecione</option>
                {appointments
                  .filter((a) => a.status !== 'canceled')
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.client_name} —{' '}
                      {new Date(a.start_time).toLocaleString('pt-BR')}
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
                placeholder="Descreva o que foi realizado no atendimento..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="evolution">Evolução</Label>
              <Textarea
                id="evolution"
                name="evolution"
                placeholder="Registre a evolução do cliente..."
                rows={3}
              />
            </div>
            <SubmitButton>Salvar registro</SubmitButton>
          </ResettableForm>
        </CardContent>
      </Card>
    </div>
  )
}
