import { notFound } from 'next/navigation'
import { refreshAndRedirect } from '@/lib/refresh'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { FormErrorBanner } from '@/components/forms/form-error-banner'
import { DestructiveActionButton } from '@/components/forms/destructive-action-button'
import { SubmitButton } from '@/components/forms/submit-button'
import { ResettableForm } from '@/components/forms/resettable-form'
import { formKeyFromSearchParams } from '@/lib/form-key'
import { CopyReminderButton } from '@/features/appointments/copy-reminder-button'
import {
  getAppointmentAction,
  updateAppointmentAction,
  cancelAppointmentAction,
} from '@/features/appointments/actions'
import { listClientsAction } from '@/features/clients/actions'
import { toDatetimeLocalValue, getMinDatetimeLocalValue } from '@/lib/datetime'
import {
  APPOINTMENT_STATUS_LABELS,
  selectFieldClassName,
} from '@/lib/labels'
import { getAppointmentStatusBadgeVariant } from '@/lib/status-badges'

export default async function AppointmentDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { error?: string; refreshed?: string | string[] }
}) {
  const appointment = await getAppointmentAction(params.id)
  if (!appointment) notFound()

  const clients = await listClientsAction()
  const minDatetime = getMinDatetimeLocalValue()
  const isCanceled = appointment.status === 'canceled'
  const formKey = formKeyFromSearchParams(searchParams)
  const errorMessage = searchParams.error
    ? decodeURIComponent(searchParams.error)
    : null

  async function handleUpdate(formData: FormData) {
    'use server'
    const result = await updateAppointmentAction(params.id, formData)
    if (result.success) refreshAndRedirect('/appointments')
    refreshAndRedirect(
      `/appointments/${params.id}?error=${encodeURIComponent(result.error ?? 'Erro ao salvar')}`
    )
  }

  async function handleCancel() {
    'use server'
    await cancelAppointmentAction(params.id)
    refreshAndRedirect('/appointments')
  }

  return (
    <div>
      <PageHeader
        title={appointment.client_name}
        description="Editar agendamento"
        backHref="/appointments"
      />
      <FormErrorBanner message={errorMessage} />
      <Card className="mb-6">
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground text-sm">Status atual</span>
            <Badge variant={getAppointmentStatusBadgeVariant(appointment.status)}>
              {APPOINTMENT_STATUS_LABELS[appointment.status] ??
                appointment.status}
            </Badge>
          </div>

          {isCanceled ? (
            <p className="text-muted-foreground text-sm">
              Agendamento cancelado. Altere o status abaixo para reativar, se
              necessário.
            </p>
          ) : null}

          <ResettableForm formKey={formKey} action={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client_id">Cliente *</Label>
              <select
                id="client_id"
                name="client_id"
                required
                defaultValue={appointment.client_id}
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
              <Label htmlFor="start_time">Início *</Label>
              <Input
                id="start_time"
                name="start_time"
                type="datetime-local"
                required
                min={minDatetime}
                defaultValue={toDatetimeLocalValue(appointment.start_time)}
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
                defaultValue={toDatetimeLocalValue(appointment.end_time)}
                className="min-h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buffer_minutes">Margem após atendimento (min)</Label>
              <select
                id="buffer_minutes"
                name="buffer_minutes"
                defaultValue={String(appointment.buffer_minutes)}
                className={selectFieldClassName}
              >
                <option value="0">0 min</option>
                <option value="10">10 min</option>
                <option value="15">15 min</option>
                <option value="30">30 min</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={appointment.status}
                className={selectFieldClassName}
              >
                {Object.entries(APPOINTMENT_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={2}
                defaultValue={appointment.notes ?? ''}
              />
            </div>
            <SubmitButton>Salvar alterações</SubmitButton>
          </ResettableForm>

          {!isCanceled ? (
            <CopyReminderButton appointmentId={appointment.id} />
          ) : null}
        </CardContent>
      </Card>

      {!isCanceled ? (
        <DestructiveActionButton
          action={handleCancel}
          buttonLabel="Cancelar agendamento"
          title="Cancelar agendamento?"
          description="O horário ficará marcado como cancelado na agenda. Você pode reativar alterando o status depois."
        />
      ) : null}
    </div>
  )
}
