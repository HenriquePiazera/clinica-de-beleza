import { notFound } from 'next/navigation'
import { refreshAndRedirect } from '@/lib/refresh'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SubmitButton } from '@/components/forms/submit-button'
import { ResettableForm } from '@/components/forms/resettable-form'
import { formKeyFromSearchParams } from '@/lib/form-key'
import {
  getServiceAction,
  updateServiceAction,
} from '@/features/services/actions'
import {
  ServicePhotoFields,
  ServicePhotoPreview,
} from '@/features/services/service-photo-fields'

export default async function EditServicePage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams?: { refreshed?: string | string[]; error?: string }
}) {
  const service = await getServiceAction(params.id)
  if (!service) notFound()
  const formKey = formKeyFromSearchParams(searchParams)

  return (
    <div>
      <PageHeader
        title="Editar serviço"
        description={service.name}
        backHref="/settings/services"
      />

      <Card>
        <CardContent className="pt-6">
          <div className="mb-6 flex items-center gap-4">
            <ServicePhotoPreview service={service} />
            <p className="text-muted-foreground text-sm">
              A foto aparece na página pública de agendamento.
            </p>
          </div>

          <ResettableForm
            formKey={formKey}
            action={async (formData) => {
              'use server'
              const result = await updateServiceAction(params.id, formData)
              if (result.success) refreshAndRedirect('/settings/services')
              refreshAndRedirect(`/settings/services/${params.id}?error=1`)
            }}
            encType="multipart/form-data"
            className="grid gap-4 sm:grid-cols-2"
          >
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={service.name}
                className="min-h-11"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={service.description ?? ''}
              />
            </div>
            <ServicePhotoFields
              currentPhotoUrl={service.photo_url}
              showRemove
            />
            <div className="space-y-2">
              <Label htmlFor="duration_minutes">Duração (min) *</Label>
              <Input
                id="duration_minutes"
                name="duration_minutes"
                type="number"
                min={15}
                step={15}
                defaultValue={service.duration_minutes}
                required
                className="min-h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min={0}
                step="0.01"
                defaultValue={service.price ?? ''}
                className="min-h-11"
              />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <input
                id="is_active"
                name="is_active"
                type="checkbox"
                defaultChecked={service.is_active}
              />
              <Label htmlFor="is_active">Ativo na página pública</Label>
            </div>
            <div className="sm:col-span-2">
              <SubmitButton>Salvar alterações</SubmitButton>
            </div>
          </ResettableForm>
        </CardContent>
      </Card>
    </div>
  )
}
