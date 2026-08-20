import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const onlineSettingsLinks = [
  { href: '/settings/public', label: 'Página pública', description: 'Link, QR Code e perfil' },
  { href: '/settings/services', label: 'Serviços', description: 'O que clientes podem agendar' },
  {
    href: '/settings/availability',
    label: 'Horários',
    description: 'Agenda configurável por profissional',
  },
  {
    href: '/settings/notifications',
    label: 'Notificações',
    description: 'Antecedência do lembrete automático',
  },
  { href: '/settings/team', label: 'Equipe', description: 'Convidar outros profissionais' },
]

const financeSettingsLinks = [
  {
    href: '/settings/receipt',
    label: 'Recibos',
    description: 'Endereço e CPF/CNPJ para comprovantes',
  },
]

function SettingsLinkList({
  items,
}: {
  items: { href: string; label: string; description: string }[]
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="hover:bg-muted flex min-h-11 flex-col justify-center rounded-md border px-4 py-3 transition-colors sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="font-medium">{item.label}</span>
          <span className="text-muted-foreground text-sm">{item.description}</span>
        </Link>
      ))}
    </div>
  )
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Agendamento online e operação do negócio"
        backHref="/dashboard"
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agendamento online</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsLinkList items={onlineSettingsLinks} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsLinkList items={financeSettingsLinks} />
        </CardContent>
      </Card>
    </div>
  )
}
