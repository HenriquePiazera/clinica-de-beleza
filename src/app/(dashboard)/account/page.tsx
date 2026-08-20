import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getAccountSettingsAction } from '@/features/settings/actions'
import { PLAN_LABELS, PLAN_STATUS_LABELS } from '@/lib/labels'
import { isBillingEnabled } from '@/lib/billing'

export default async function AccountPage() {
  const account = await getAccountSettingsAction()
  const billingOn = isBillingEnabled()

  const trialEndsLabel = account.trial_ends_at
    ? new Date(account.trial_ends_at).toLocaleDateString('pt-BR')
    : null

  return (
    <div>
      <PageHeader
        title="Conta"
        description="Seu perfil e plano"
        backHref="/dashboard"
      />
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex min-h-11 flex-col justify-center gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-muted-foreground">Nome</span>
              <span className="font-medium">{account.name}</span>
            </div>
            <div className="flex min-h-11 flex-col justify-center gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-muted-foreground">E-mail</span>
              <span className="break-all font-medium">{account.email}</span>
            </div>
            <div className="flex min-h-11 flex-col justify-center gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-muted-foreground">Membro desde</span>
              <span className="font-medium">
                {new Date(account.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plano</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex min-h-11 flex-col justify-center gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-muted-foreground">Plano atual</span>
              <Badge variant="secondary">
                {PLAN_LABELS[account.plan] ?? account.plan}
              </Badge>
            </div>
            <div className="flex min-h-11 flex-col justify-center gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="outline">
                {PLAN_STATUS_LABELS[account.plan_status] ?? account.plan_status}
              </Badge>
            </div>
            {trialEndsLabel ? (
              <div className="flex min-h-11 flex-col justify-center gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-muted-foreground">Trial até</span>
                <span className="font-medium">{trialEndsLabel}</span>
              </div>
            ) : null}
            {!billingOn ? (
              <p className="text-muted-foreground text-xs">
                Modo sem cobrança ativo — todas as funcionalidades liberadas até abrir CNPJ.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
