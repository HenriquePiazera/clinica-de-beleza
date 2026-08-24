import { refreshAndRedirect } from '@/lib/refresh'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { listClientsAction } from '@/features/clients/actions'
import { listAppointmentsAction } from '@/features/appointments/actions'
import { createPaymentAction } from '@/features/payments/actions'
import { PaymentMethodsFields } from '@/features/payments/payment-methods-fields'
import { SubmitButton } from '@/components/forms/submit-button'
import { ResettableForm } from '@/components/forms/resettable-form'
import { formKeyFromSearchParams } from '@/lib/form-key'
import { selectFieldClassName, APPOINTMENT_STATUS_LABELS } from '@/lib/labels'

function firstParam(value?: string | string[]): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export default async function NewPaymentPage({
  searchParams,
}: {
  searchParams?: {
    refreshed?: string | string[]
    error?: string
    appointmentId?: string | string[]
    clientId?: string | string[]
  }
}) {
  const [clients, appointments] = await Promise.all([
    listClientsAction(),
    listAppointmentsAction(),
  ])
  const formKey = formKeyFromSearchParams(searchParams)
  const appointmentId = firstParam(searchParams?.appointmentId)
  const clientId = firstParam(searchParams?.clientId)

  const selectedAppointment = appointmentId
    ? appointments.find((a) => a.id === appointmentId)
    : undefined
  const defaultClientId = clientId ?? selectedAppointment?.client_id ?? ''
  const defaultAppointmentId = selectedAppointment?.id ?? ''
  const defaultStatus =
    selectedAppointment?.status === 'canceled' ? 'canceled' : 'paid'

  return (
    <div>
      <PageHeader title="Novo pagamento" backHref="/payments" />
      <Card>
        <CardContent className="pt-6">
          {selectedAppointment ? (
            <p className="text-muted-foreground mb-4 text-sm">
              Preenchido a partir da fila: {selectedAppointment.client_name} (
              {APPOINTMENT_STATUS_LABELS[selectedAppointment.status] ??
                selectedAppointment.status}
              ).
            </p>
          ) : null}
          <ResettableForm
            formKey={formKey}
            action={async (formData) => {
              'use server'
              const result = await createPaymentAction(formData)
              if (result.success) refreshAndRedirect('/payments')
              refreshAndRedirect('/payments/new?error=1')
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="client_id">Cliente *</Label>
              <select
                id="client_id"
                name="client_id"
                required
                defaultValue={defaultClientId}
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
              <Label htmlFor="appointment_id">Agendamento (opcional)</Label>
              <select
                id="appointment_id"
                name="appointment_id"
                defaultValue={defaultAppointmentId}
                className={selectFieldClassName}
              >
                <option value="">Nenhum</option>
                {appointments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.client_name} —{' '}
                    {new Date(a.start_time).toLocaleDateString('pt-BR')} (
                    {APPOINTMENT_STATUS_LABELS[a.status] ?? a.status})
                  </option>
                ))}
              </select>
            </div>

            <PaymentMethodsFields idPrefix="new-payment" />

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <select
                id="status"
                name="status"
                defaultValue={defaultStatus}
                className={selectFieldClassName}
              >
                <option value="paid">Pago</option>
                <option value="pending">Pendente</option>
                <option value="canceled">Cancelado</option>
              </select>
            </div>
            <SubmitButton>Salvar pagamento</SubmitButton>
          </ResettableForm>
        </CardContent>
      </Card>
    </div>
  )
}
