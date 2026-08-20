import { notFound } from 'next/navigation'
import { refreshAndRedirect } from '@/lib/refresh'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  getClientAction,
  updateClientAction,
  deleteClientAction,
} from '@/features/clients/actions'
import {
  listAttachmentsAction,
  uploadAttachmentAction,
  deleteAttachmentAction,
} from '@/features/attachments/actions'
import { SubmitButton } from '@/components/forms/submit-button'
import { ResettableForm } from '@/components/forms/resettable-form'
import { formKeyFromSearchParams } from '@/lib/form-key'
import { DestructiveActionButton } from '@/components/forms/destructive-action-button'

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams?: { refreshed?: string | string[]; error?: string }
}) {
  const client = await getClientAction(params.id)
  if (!client) notFound()

  const attachments = await listAttachmentsAction(params.id)
  const formKey = formKeyFromSearchParams(searchParams)

  async function handleDeleteClient() {
    'use server'
    await deleteClientAction(params.id)
    refreshAndRedirect('/clients')
  }

  return (
    <div>
      <PageHeader
        title={client.name}
        description="Detalhes do cliente"
        backHref="/clients"
      />
      <Card className="mb-6">
        <CardContent className="pt-6">
          <ResettableForm
            formKey={`client-${formKey}`}
            action={async (formData) => {
              'use server'
              const result = await updateClientAction(params.id, formData)
              if (result.success) {
                refreshAndRedirect(`/clients/${params.id}`, '/clients')
              }
              refreshAndRedirect(`/clients/${params.id}?error=1`, '/clients')
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                defaultValue={client.name}
                required
                className="min-h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={client.phone}
                required
                className="min-h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={client.email ?? ''}
                className="min-h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={client.notes ?? ''}
                rows={3}
              />
            </div>
            <SubmitButton>Atualizar</SubmitButton>
          </ResettableForm>
          <DestructiveActionButton
            action={handleDeleteClient}
            buttonLabel="Excluir cliente"
            title="Excluir cliente?"
            description="Todos os agendamentos, registros e arquivos vinculados serão removidos permanentemente."
            className="mt-4 min-h-11 w-full"
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-4 font-medium">Arquivos</h2>
          <ResettableForm
            formKey={`upload-${formKey}`}
            action={async (formData) => {
              'use server'
              formData.set('client_id', params.id)
              const result = await uploadAttachmentAction(formData)
              if (result.success) {
                refreshAndRedirect(`/clients/${params.id}`)
              }
              refreshAndRedirect(`/clients/${params.id}?error=1`)
            }}
            className="mb-4 space-y-4"
          >
            <Input name="file" type="file" required className="min-h-11" />
            <SubmitButton>Enviar arquivo</SubmitButton>
          </ResettableForm>
          {attachments.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum arquivo anexado.</p>
          ) : (
            <ul className="space-y-2">
              {attachments.map((file) => (
                <li
                  key={file.id}
                  className="flex min-h-11 items-center justify-between rounded-lg border px-3"
                >
                  <span className="text-sm">{file.file_name}</span>
                  <DestructiveActionButton
                    action={async () => {
                      'use server'
                      const result = await deleteAttachmentAction(file.id)
                      if (result.success) {
                        refreshAndRedirect(`/clients/${params.id}`)
                      }
                      refreshAndRedirect(`/clients/${params.id}?error=1`)
                    }}
                    buttonLabel="Excluir"
                    title="Excluir arquivo?"
                    description={`O arquivo "${file.file_name}" será removido permanentemente.`}
                    variant="outline"
                    className="min-h-11 shrink-0 px-3"
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
