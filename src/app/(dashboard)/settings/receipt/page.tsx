import { refreshAndRedirect } from '@/lib/refresh'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { SubmitButton } from '@/components/forms/submit-button'
import { ResettableForm } from '@/components/forms/resettable-form'
import { formKeyFromSearchParams } from '@/lib/form-key'
import {
  getReceiptSettingsAction,
  updateReceiptSettingsAction,
} from '@/features/settings/actions'

export default async function ReceiptSettingsPage({
  searchParams,
}: {
  searchParams?: { refreshed?: string | string[]; error?: string }
}) {
  const settings = await getReceiptSettingsAction()
  const formKey = formKeyFromSearchParams(searchParams)
  const hasError = searchParams?.error === '1'

  return (
    <div>
      <PageHeader
        title="Recibos"
        description="Dados exibidos na emissão de comprovantes de pagamento"
        backHref="/settings"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados do emitente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Essas informações aparecem no recibo simples. Não substituem nota
            fiscal ou documento tributário.
          </p>

          {hasError ? (
            <p className="text-destructive text-sm">
              Não foi possível salvar. Verifique CPF/CNPJ e os demais campos.
            </p>
          ) : null}

          <ResettableForm
            formKey={formKey}
            action={async (formData) => {
              'use server'
              const result = await updateReceiptSettingsAction(formData)
              if (result.success) refreshAndRedirect('/settings/receipt')
              refreshAndRedirect('/settings/receipt?error=1')
            }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="receipt_tax_id">CPF ou CNPJ</Label>
              <Input
                id="receipt_tax_id"
                name="receipt_tax_id"
                defaultValue={settings.receipt_tax_id ?? ''}
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                className="min-h-11"
                inputMode="numeric"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="receipt_street">Logradouro</Label>
                <Input
                  id="receipt_street"
                  name="receipt_street"
                  defaultValue={settings.receipt_street ?? ''}
                  placeholder="Rua, avenida..."
                  className="min-h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="receipt_address_number">Número</Label>
                <Input
                  id="receipt_address_number"
                  name="receipt_address_number"
                  defaultValue={settings.receipt_address_number ?? ''}
                  placeholder="123"
                  className="min-h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="receipt_complement">Complemento</Label>
                <Input
                  id="receipt_complement"
                  name="receipt_complement"
                  defaultValue={settings.receipt_complement ?? ''}
                  placeholder="Sala, bloco..."
                  className="min-h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="receipt_neighborhood">Bairro</Label>
                <Input
                  id="receipt_neighborhood"
                  name="receipt_neighborhood"
                  defaultValue={settings.receipt_neighborhood ?? ''}
                  className="min-h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="receipt_postal_code">CEP</Label>
                <Input
                  id="receipt_postal_code"
                  name="receipt_postal_code"
                  defaultValue={settings.receipt_postal_code ?? ''}
                  placeholder="00000-000"
                  className="min-h-11"
                  inputMode="numeric"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="receipt_city">Cidade</Label>
                <Input
                  id="receipt_city"
                  name="receipt_city"
                  defaultValue={settings.receipt_city ?? ''}
                  className="min-h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="receipt_state">UF</Label>
                <Input
                  id="receipt_state"
                  name="receipt_state"
                  defaultValue={settings.receipt_state ?? ''}
                  placeholder="SP"
                  maxLength={2}
                  className="min-h-11 uppercase"
                />
              </div>
            </div>

            <SubmitButton>Salvar dados do recibo</SubmitButton>
          </ResettableForm>
        </CardContent>
      </Card>
    </div>
  )
}
