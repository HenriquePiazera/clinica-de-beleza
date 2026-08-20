import { refreshAndRedirect } from '@/lib/refresh'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SubmitButton } from '@/components/forms/submit-button'
import { ResettableForm } from '@/components/forms/resettable-form'
import { formKeyFromSearchParams } from '@/lib/form-key'
import { DAY_LABELS } from '@/schemas/availability.schema'
import {
  listAvailabilityAction,
  createAvailabilityAction,
  deleteAvailabilityAction,
} from '@/features/availability/actions'
import { DestructiveActionButton } from '@/components/forms/destructive-action-button'

export default async function AvailabilitySettingsPage({
  searchParams,
}: {
  searchParams?: { refreshed?: string | string[]; error?: string }
}) {
  const rows = await listAvailabilityAction()
  const formKey = formKeyFromSearchParams(searchParams)

  return (
    <div>
      <PageHeader
        title="Horários de atendimento"
        description="Define quando clientes podem agendar pela página pública"
        backHref="/settings"
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Novo bloco de horário</CardTitle>
        </CardHeader>
        <CardContent>
          <ResettableForm
            formKey={formKey}
            action={async (formData) => {
              'use server'
              const result = await createAvailabilityAction(formData)
              if (result.success) refreshAndRedirect('/settings/availability')
              refreshAndRedirect('/settings/availability?error=1')
            }}
            className="grid gap-4 sm:grid-cols-3"
          >
            <div className="space-y-2">
              <Label htmlFor="day_of_week">Dia</Label>
              <select
                id="day_of_week"
                name="day_of_week"
                className="border-input bg-background min-h-11 w-full rounded-md border px-3 text-sm"
              >
                {DAY_LABELS.map((label, index) => (
                  <option key={label} value={index}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_time">Início</Label>
              <Input id="start_time" name="start_time" type="time" required className="min-h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">Fim</Label>
              <Input id="end_time" name="end_time" type="time" required className="min-h-11" />
            </div>
            <div className="flex items-center gap-2 sm:col-span-3">
              <input id="is_active" name="is_active" type="checkbox" defaultChecked />
              <Label htmlFor="is_active">Ativo</Label>
            </div>
            <div className="sm:col-span-3">
              <SubmitButton>Adicionar horário</SubmitButton>
            </div>
          </ResettableForm>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {rows.map((row) => (
          <Card key={row.id}>
            <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{DAY_LABELS[row.day_of_week]}</p>
                <p className="text-muted-foreground text-sm">
                  {row.start_time} — {row.end_time}
                  {!row.is_active ? ' (inativo)' : ''}
                </p>
              </div>
              <DestructiveActionButton
                buttonLabel="Excluir"
                title="Excluir horário"
                description="Excluir este bloco de horário?"
                action={async () => {
                  'use server'
                  await deleteAvailabilityAction(row.id)
                  refreshAndRedirect('/settings/availability')
                }}
              />
            </CardContent>
          </Card>
        ))}
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nenhum horário configurado. Clientes não verão datas disponíveis.
          </p>
        ) : null}
      </div>
    </div>
  )
}
