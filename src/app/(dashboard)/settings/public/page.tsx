import { refreshAndRedirect } from '@/lib/refresh'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SubmitButton } from '@/components/forms/submit-button'
import { ResettableForm } from '@/components/forms/resettable-form'
import { formKeyFromSearchParams } from '@/lib/form-key'
import {
  getAccountSettingsAction,
  updatePublicProfileAction,
} from '@/features/settings/actions'
import { PublicQrCode } from '@/features/settings/public-qr-code'
import { prisma } from '@/lib/prisma'
import { requireUserId } from '@/lib/session'

export default async function PublicSettingsPage({
  searchParams,
}: {
  searchParams?: { refreshed?: string | string[]; error?: string }
}) {
  const userId = await requireUserId()
  const account = await getAccountSettingsAction()
  const formKey = formKeyFromSearchParams(searchParams)

  const [servicesCount, availabilityCount] = await Promise.all([
    prisma.service.count({ where: { user_id: userId, is_active: true } }),
    prisma.availability.count({ where: { user_id: userId, is_active: true } }),
  ])

  const isReady = servicesCount > 0 && availabilityCount > 0

  return (
    <div>
      <PageHeader
        title="Página pública"
        description="Link e QR Code para clientes agendarem online"
        backHref="/settings"
      />

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status da agenda online</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Serviços ativos: <strong>{servicesCount}</strong>{' '}
              {servicesCount === 0 ? (
                <Link href="/settings/services" className="text-primary hover:underline">
                  (cadastrar)
                </Link>
              ) : null}
            </p>
            <p>
              Horários configurados: <strong>{availabilityCount}</strong>{' '}
              {availabilityCount === 0 ? (
                <Link href="/settings/availability" className="text-primary hover:underline">
                  (configurar)
                </Link>
              ) : null}
            </p>
            <p className={isReady ? 'text-primary' : 'text-amber-700'}>
              {isReady
                ? 'Sua página pública está pronta para receber agendamentos.'
                : 'Complete serviços e horários para liberar agendamentos.'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Perfil público</CardTitle>
          </CardHeader>
          <CardContent>
            <ResettableForm
              formKey={formKey}
              action={async (formData) => {
                'use server'
                const result = await updatePublicProfileAction(formData)
                if (result.success) refreshAndRedirect('/settings/public')
                refreshAndRedirect('/settings/public?error=1')
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="public_bio">Bio</Label>
                <Textarea
                  id="public_bio"
                  name="public_bio"
                  rows={3}
                  defaultValue={account.public_bio ?? ''}
                  placeholder="Breve descrição para seus clientes"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="public_photo_url">URL da foto</Label>
                <Input
                  id="public_photo_url"
                  name="public_photo_url"
                  type="url"
                  defaultValue={account.public_photo_url ?? ''}
                  className="min-h-11"
                />
              </div>
              <SubmitButton>Salvar perfil</SubmitButton>
            </ResettableForm>
          </CardContent>
        </Card>

        {account.public_url ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Compartilhar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <PublicQrCode publicUrl={account.public_url} />
              <p className="text-muted-foreground text-xs">
                O link usa a URL pública configurada em NEXTAUTH_URL (produção) ou
                o endereço atual do navegador (desenvolvimento). Para testar no
                celular em rede local, abra o app pelo IP do computador antes de
                copiar o QR Code.
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
