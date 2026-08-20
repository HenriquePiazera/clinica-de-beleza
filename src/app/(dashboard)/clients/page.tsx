import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { listClientsAction } from '@/features/clients/actions'

export default async function ClientsPage() {
  const clients = await listClientsAction()

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Gerencie seus clientes"
        backHref="/dashboard"
        actionHref="/clients/new"
        actionLabel="Novo cliente"
      />
      {clients.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum cliente cadastrado ainda.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {clients.map((client) => (
            <li key={client.id}>
              <Link href={`/clients/${client.id}`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardContent className="flex min-h-11 items-center justify-between py-4">
                    <div>
                      <p className="font-medium">{client.name}</p>
                      <p className="text-muted-foreground text-sm">{client.phone}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
