import { refreshAndRedirect } from '@/lib/refresh'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SubmitButton } from '@/components/forms/submit-button'
import {
  clearMockSmsMessagesAction,
  getMockSmsStatusAction,
  listMockSmsMessagesAction,
} from '@/features/mock-sms/actions'

const TYPE_LABELS: Record<string, string> = {
  confirmation: 'Confirmação',
  scheduled: 'Agendamento',
  reminder: 'Lembrete',
  cancellation: 'Cancelamento',
  reschedule: 'Reagendamento',
}

export default async function MockSmsInboxPage() {
  const [{ enabled }, messages] = await Promise.all([
    getMockSmsStatusAction(),
    listMockSmsMessagesAction(),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="SMS de teste"
        description="Simulação — mensagens não saem da clínica (custo R$ 0)"
        backHref="/settings/notifications"
      />

      <div
        className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        role="status"
      >
        {enabled ? (
          <>
            Canal <strong>SMS simulado</strong> ativo. Cada notificação com
            telefone grava o texto aqui — sem operadora e sem cobrança (também
            quando o e-mail envia).
          </>
        ) : (
          <>
            Canal desativado (<code className="text-xs">MOCK_SMS_ENABLED</code>
            ). Defina <code className="text-xs">true</code> no ambiente para
            gravar SMS de teste.
          </>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base">Caixa de envios</CardTitle>
          {messages.length > 0 ? (
            <form
              action={async () => {
                'use server'
                await clearMockSmsMessagesAction()
                refreshAndRedirect('/settings/notifications/sms')
              }}
              className="w-auto"
            >
              <SubmitButton className="min-h-11 w-auto px-4">
                Limpar caixa
              </SubmitButton>
            </form>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {messages.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhuma mensagem ainda. Faça um agendamento (com telefone da
              cliente) para ver o SMS simulado aqui.
            </p>
          ) : (
            <ul className="space-y-3">
              {messages.map((msg) => (
                <li
                  key={msg.id}
                  className="rounded-md border px-4 py-3 text-sm"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium">
                      {msg.client_name ?? 'Cliente'} · {msg.to_phone}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {msg.created_at.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {TYPE_LABELS[msg.notification_type] ?? msg.notification_type}
                    {msg.appointment_id
                      ? ` · agenda ${msg.appointment_id.slice(0, 8)}…`
                      : null}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap">{msg.body}</p>
                  {(() => {
                    const match = msg.body.match(
                      /(https?:\/\/\S*\/confirm\/[A-Za-z0-9]+)/
                    )
                    if (!match) return null
                    return (
                      <a
                        href={match[1]}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 mt-3 inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-medium"
                      >
                        Confirmar agendamento
                      </a>
                    )
                  })()}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
