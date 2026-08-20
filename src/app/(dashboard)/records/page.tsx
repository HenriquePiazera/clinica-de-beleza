import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { listRecordsAction } from '@/features/records/actions'

export default async function RecordsPage() {
  const records = await listRecordsAction()

  return (
    <div>
      <PageHeader
        title="Histórico"
        description="Registros de atendimento"
        backHref="/dashboard"
        actionHref="/records/new"
        actionLabel="Novo registro"
      />
      {records.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum registro de atendimento.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {records.map((record) => (
            <li key={record.id}>
              <Link href={`/records/${record.id}`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardContent className="min-h-11 py-4">
                    <p className="font-medium">{record.client_name}</p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {new Date(record.created_at).toLocaleString('pt-BR')}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm">{record.description}</p>
                    {record.evolution ? (
                      <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
                        Evolução: {record.evolution}
                      </p>
                    ) : null}
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
