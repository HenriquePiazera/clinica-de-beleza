import { refreshAndRedirect } from '@/lib/refresh'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { SubmitButton } from '@/components/forms/submit-button'
import { ResettableForm } from '@/components/forms/resettable-form'
import { formKeyFromSearchParams } from '@/lib/form-key'
import {
  getNotificationSettingsAction,
  updateNotificationSettingsAction,
} from '@/features/settings/actions'
import {
  CONFIRMATION_HOURS_LABELS,
  CONFIRMATION_HOURS_OPTIONS,
  REMINDER_HOURS_LABELS,
  REMINDER_HOURS_OPTIONS,
} from '@/lib/reminder-settings'

export default async function NotificationSettingsPage({
  searchParams,
}: {
  searchParams?: { refreshed?: string | string[]; error?: string }
}) {
  const settings = await getNotificationSettingsAction()
  const formKey = formKeyFromSearchParams(searchParams)

  return (
    <div>
      <PageHeader
        title="Notificações"
        description="Antecedência dos lembretes e reenvios de confirmação"
        backHref="/settings"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preferências automáticas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!settings.auto_reminders_enabled ? (
            <p className="text-muted-foreground text-sm">
              Seu plano atual não inclui lembretes automáticos. As preferências
              abaixo serão usadas quando o recurso estiver disponível.
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">
              A confirmação inicial continua sendo enviada na hora do agendamento
              público. O cron roda a cada hora para lembretes e reenvios de
              confirmação pendentes.
            </p>
          )}

          <ResettableForm
            formKey={formKey}
            action={async (formData) => {
              'use server'
              const result = await updateNotificationSettingsAction(formData)
              if (result.success) refreshAndRedirect('/settings/notifications')
              refreshAndRedirect('/settings/notifications?error=1')
            }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="confirmation_hours_before">
                Reenviar confirmação (se ainda pendente)
              </Label>
              <select
                id="confirmation_hours_before"
                name="confirmation_hours_before"
                defaultValue={String(settings.confirmation_hours_before)}
                className="border-input bg-background min-h-11 w-full rounded-md border px-3 text-sm sm:max-w-md"
              >
                {CONFIRMATION_HOURS_OPTIONS.map((hours) => (
                  <option key={hours} value={hours}>
                    {CONFIRMATION_HOURS_LABELS[hours]}
                  </option>
                ))}
              </select>
              <p className="text-muted-foreground text-xs">
                Além do envio imediato ao agendar. Só dispara se o cliente ainda
                não confirmou.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminder_hours_before">Lembrete de atendimento</Label>
              <select
                id="reminder_hours_before"
                name="reminder_hours_before"
                defaultValue={String(settings.reminder_hours_before)}
                className="border-input bg-background min-h-11 w-full rounded-md border px-3 text-sm sm:max-w-md"
              >
                {REMINDER_HOURS_OPTIONS.map((hours) => (
                  <option key={hours} value={hours}>
                    {REMINDER_HOURS_LABELS[hours]}
                  </option>
                ))}
              </select>
            </div>

            <SubmitButton>Salvar preferências</SubmitButton>
          </ResettableForm>
        </CardContent>
      </Card>
    </div>
  )
}
