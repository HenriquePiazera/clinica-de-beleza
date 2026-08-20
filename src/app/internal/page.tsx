import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatBrl } from '@/lib/cash-flow-demo'
import {
  deleteExpenseAction,
  getCashFlowDashboardAction,
} from '@/features/cash-flow/actions'
import { ExpenseLaunchForm } from '@/components/cash-flow/expense-launch-form'
import { APP_NAME } from '@/lib/brand'

function MetricCard({
  title,
  value,
  hint,
  tone = 'default',
}: {
  title: string
  value: string
  hint?: string
  tone?: 'default' | 'positive' | 'negative' | 'warning'
}) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium leading-tight">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="min-w-0 pt-0">
        <p
          className={cn(
            'break-words text-lg font-semibold tabular-nums leading-tight sm:text-xl lg:text-2xl',
            tone === 'positive' && 'text-emerald-700',
            tone === 'negative' && 'text-destructive',
            tone === 'warning' && 'text-amber-700'
          )}
        >
          {value}
        </p>
        {hint ? (
          <p className="text-muted-foreground mt-1 text-xs leading-snug">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}

function statusBadge(status: 'paid' | 'pending' | 'overdue') {
  if (status === 'paid') return <Badge variant="secondary">Pago</Badge>
  if (status === 'pending') return <Badge variant="outline">Pendente</Badge>
  return <Badge variant="destructive">Em atraso</Badge>
}

export default async function CashFlowPage() {
  const data = await getCashFlowDashboardAction()
  const maxMonth = Math.max(
    1,
    ...data.months.flatMap((m) => [m.receivables, m.expenses])
  )

  const receivables = data.entries.filter((e) => e.type === 'receivable')
  const expenses = data.entries.filter((e) => e.type === 'expense')

  return (
    <div>
      <PageHeader
        title="Fluxo de caixa"
        description={`${APP_NAME} — recebíveis × gastos da clínica`}
        backHref="/dashboard"
      />

      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        Demonstração com dados de exemplo. Você pode lançar novas despesas abaixo.
      </div>

      <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Recebíveis (mês)"
          value={formatBrl(data.monthReceivables)}
          tone="positive"
        />
        <MetricCard
          title="Gastos (mês)"
          value={formatBrl(data.monthExpenses)}
          tone="negative"
        />
        <MetricCard
          title="Saldo do mês"
          value={formatBrl(data.monthBalance)}
          tone={data.monthBalance >= 0 ? 'positive' : 'negative'}
        />
        <MetricCard
          title="A receber"
          value={formatBrl(data.pendingReceivables)}
          hint="Pendentes"
          tone="warning"
        />
        <MetricCard
          title="Em atraso"
          value={formatBrl(data.overdueReceivables)}
          hint="Recebíveis vencidos"
          tone="negative"
        />
        <MetricCard
          title="A pagar"
          value={formatBrl(data.pendingExpenses)}
          hint="Despesas em aberto"
          tone="warning"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ExpenseLaunchForm />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evolução (6 meses)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.months.map((month) => {
              const recvPct = Math.max(
                8,
                Math.round((month.receivables / maxMonth) * 100)
              )
              const expPct = Math.max(
                8,
                Math.round((month.expenses / maxMonth) * 100)
              )
              const balance = month.receivables - month.expenses
              return (
                <div key={month.key} className="min-w-0 space-y-2">
                  <div className="flex min-w-0 items-center justify-between gap-2 text-sm">
                    <span className="shrink-0 font-medium capitalize">{month.label}</span>
                    <span
                      className={cn(
                        'min-w-0 truncate text-right text-xs font-medium tabular-nums sm:text-sm',
                        balance >= 0 ? 'text-emerald-700' : 'text-destructive'
                      )}
                    >
                      {formatBrl(balance)}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="text-muted-foreground w-14 shrink-0 text-xs sm:w-20">
                        Receber
                      </span>
                      <div className="bg-muted h-3 min-w-0 flex-1 overflow-hidden rounded-full">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${recvPct}%` }}
                        />
                      </div>
                      <span className="w-[4.75rem] shrink-0 text-right text-[11px] font-medium tabular-nums sm:w-28 sm:text-xs">
                        {formatBrl(month.receivables)}
                      </span>
                    </div>
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="text-muted-foreground w-14 shrink-0 text-xs sm:w-20">
                        Gastar
                      </span>
                      <div className="bg-muted h-3 min-w-0 flex-1 overflow-hidden rounded-full">
                        <div
                          className="h-full rounded-full bg-orange-500"
                          style={{ width: `${expPct}%` }}
                        />
                      </div>
                      <span className="w-[4.75rem] shrink-0 text-right text-[11px] font-medium tabular-nums sm:w-28 sm:text-xs">
                        {formatBrl(month.expenses)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recebíveis por categoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.byCategoryReceivables.length === 0 ? (
              <p className="text-muted-foreground text-sm">Sem lançamentos.</p>
            ) : (
              data.byCategoryReceivables.map((row) => (
                <div
                  key={row.category}
                  className="flex min-h-11 min-w-0 items-center justify-between gap-3 text-sm"
                >
                  <span className="min-w-0 truncate">{row.category}</span>
                  <span className="shrink-0 font-medium tabular-nums text-emerald-700">
                    {formatBrl(row.total)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gastos por categoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.byCategoryExpenses.length === 0 ? (
              <p className="text-muted-foreground text-sm">Sem lançamentos.</p>
            ) : (
              data.byCategoryExpenses.map((row) => (
                <div
                  key={row.category}
                  className="flex min-h-11 min-w-0 items-center justify-between gap-3 text-sm"
                >
                  <span className="min-w-0 truncate">{row.category}</span>
                  <span className="shrink-0 font-medium tabular-nums text-destructive">
                    {formatBrl(row.total)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Recebíveis ({receivables.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {receivables.map((entry) => (
              <div
                key={entry.id}
                className="flex min-h-11 items-start justify-between gap-3 border-b pb-3 last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{entry.description}</p>
                  <p className="text-muted-foreground text-xs">
                    {entry.category} ·{' '}
                    {new Date(entry.entry_date).toLocaleDateString('pt-BR')}
                    {entry.notes ? ` · ${entry.notes}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-sm font-semibold tabular-nums text-emerald-700">
                    +{formatBrl(entry.amount)}
                  </span>
                  {statusBadge(entry.status)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Despesas ({expenses.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {expenses.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhuma despesa lançada ainda.
              </p>
            ) : (
              expenses.map((entry) => (
                <div
                  key={entry.id}
                  className="flex min-h-11 items-start justify-between gap-3 border-b pb-3 last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {entry.description}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {entry.category} ·{' '}
                      {new Date(entry.entry_date).toLocaleDateString('pt-BR')}
                      {entry.notes ? ` · ${entry.notes}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-semibold tabular-nums text-destructive">
                      −{formatBrl(entry.amount)}
                    </span>
                    {statusBadge(entry.status)}
                    <form action={deleteExpenseAction}>
                      <input type="hidden" name="id" value={entry.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-destructive"
                      >
                        Excluir
                      </Button>
                    </form>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
