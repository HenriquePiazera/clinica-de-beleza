import Link from 'next/link'
import { auth } from '@/auth'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getDashboardMetrics } from '@/services/dashboard-metrics.service'

export default async function DashboardPage() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return null

  const metrics = await getDashboardMetrics(userId)

  return (
    <div>
      <PageHeader
        title={`Olá, ${session?.user?.name?.split(' ')[0] ?? 'profissional'}`}
        description="Dashboard gerencial"
        backHref="/"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{metrics.totalClients}</p>
            <p className="text-muted-foreground mt-1 text-xs">
              {metrics.activeClients} ativos · {metrics.inactiveClients} inativos
            </p>
            <Link href="/clients" className="text-primary mt-2 inline-block text-sm hover:underline">
              Ver clientes
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Próximos agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{metrics.upcomingAppointments}</p>
            <Link href="/appointments" className="text-primary mt-2 inline-block text-sm hover:underline">
              Ver agenda
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Receita do mês</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {metrics.monthlyRevenue.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Ticket médio:{' '}
              {metrics.averageTicket.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </p>
            <Link href="/payments" className="text-primary mt-2 inline-block text-sm hover:underline">
              Ver financeiro
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comparecimento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{metrics.attendanceRate}%</p>
            <p className="text-muted-foreground mt-1 text-xs">
              {metrics.appointmentsCompleted} realizados de {metrics.appointmentsCreated - metrics.appointmentsCanceled} não cancelados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Confirmação</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{metrics.confirmationRate}%</p>
            <p className="text-muted-foreground mt-1 text-xs">
              {metrics.appointmentsConfirmed} confirmados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cancelamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{metrics.appointmentsCanceled}</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Total de {metrics.appointmentsCreated} agendamentos
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
