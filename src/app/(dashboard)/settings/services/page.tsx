import { refreshAndRedirect } from '@/lib/refresh'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SubmitButton } from '@/components/forms/submit-button'
import { ResettableForm } from '@/components/forms/resettable-form'
import { formKeyFromSearchParams } from '@/lib/form-key'
import { listServicesAction, createServiceAction } from '@/features/services/actions'
import { DestructiveActionButton } from '@/components/forms/destructive-action-button'
import { deleteServiceAction } from '@/features/services/actions'
import {
  ServiceListItem,
  ServicePhotoFields,
} from '@/features/services/service-photo-fields'

export default async function ServicesSettingsPage({
  searchParams,
}: {
  searchParams?: { refreshed?: string | string[]; error?: string }
}) {
  const services = await listServicesAction()
  const formKey = formKeyFromSearchParams(searchParams)

  return (
    <div>
      <PageHeader
        title="Serviços"
        description="Serviços exibidos na página pública de agendamento"
        backHref="/settings"
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Novo serviço</CardTitle>
        </CardHeader>
        <CardContent>
          <ResettableForm
            formKey={formKey}
            action={async (formData) => {
              'use server'
              const result = await createServiceAction(formData)
              if (result.success) refreshAndRedirect('/settings/services')
              refreshAndRedirect('/settings/services?error=1')
            }}
            encType="multipart/form-data"
            className="grid gap-4 sm:grid-cols-2"
          >
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" name="name" required className="min-h-11" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" name="description" rows={2} />
            </div>
            <ServicePhotoFields />
            <div className="space-y-2">
              <Label htmlFor="duration_minutes">Duração (min) *</Label>
              <Input
                id="duration_minutes"
                name="duration_minutes"
                type="number"
                min={15}
                step={15}
                defaultValue={60}
                required
                className="min-h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$)</Label>
              <Input id="price" name="price" type="number" min={0} step="0.01" className="min-h-11" />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <input id="is_active" name="is_active" type="checkbox" defaultChecked />
              <Label htmlFor="is_active">Ativo na página pública</Label>
            </div>
            <div className="sm:col-span-2">
              <SubmitButton>Adicionar serviço</SubmitButton>
            </div>
          </ResettableForm>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {services.map((service) => (
          <Card key={service.id}>
            <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <ServiceListItem
                service={service}
                editHref={`/settings/services/${service.id}`}
              />
              <DestructiveActionButton
                buttonLabel="Excluir"
                title="Excluir serviço"
                description={`Excluir o serviço "${service.name}"?`}
                action={async () => {
                  'use server'
                  await deleteServiceAction(service.id)
                  refreshAndRedirect('/settings/services')
                }}
              />
            </CardContent>
          </Card>
        ))}
        {services.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum serviço cadastrado.</p>
        ) : null}
      </div>
    </div>
  )
}
