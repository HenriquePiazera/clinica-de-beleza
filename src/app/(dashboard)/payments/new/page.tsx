import { refreshAndRedirect } from '@/lib/refresh'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { listClientsAction } from '@/features/clients/actions'
import { listAppointmentsAction } from '@/features/appointments/actions'
import { createPaymentAction } from '@/features/payments/actions'
import { SubmitButton } from '@/components/forms/submit-button'
import { ResettableForm } from '@/components/forms/resettable-form'
import { formKeyFromSearchParams } from '@/lib/form-key'

export default async function NewPaymentPage({
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
      <PageHeader title="Novo pagamento" backHref="/payments" />
      <Card>
        <CardContent className="pt-6">
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
                className="border-input bg-background flex min-h-11 w-full rounded-md border px-3 text-sm"
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
                className="border-input bg-background flex min-h-11 w-full rounded-md border px-3 text-sm"
              >
                <option value="">Nenhum</option>
                {appointments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.client_name} — {new Date(a.start_time).toLocaleDateString('pt-BR')}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$) *</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                className="min-h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_method">Forma de pagamento *</Label>
              <select
                id="payment_method"
                name="payment_method"
                required
                className="border-input bg-background flex min-h-11 w-full rounded-md border px-3 text-sm"
              >
                <option value="pix">PIX</option>
                <option value="cash">Dinheiro</option>
                <option value="credit_card">Cartão de crédito</option>
                <option value="debit_card">Cartão de débito</option>
                <option value="transfer">Transferência</option>
                <option value="other">Outro</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <select
                id="status"
                name="status"
                defaultValue="paid"
                className="border-input bg-background flex min-h-11 w-full rounded-md border px-3 text-sm"
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
