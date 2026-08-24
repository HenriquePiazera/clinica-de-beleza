import { PageHeader } from '@/components/layout/page-header'
import { listRecordsAction } from '@/features/records/actions'
import { listPendingHistoryQueueAction } from '@/features/appointments/actions'
import { RecordsList } from '@/features/records/records-list'

export default async function RecordsPage() {
  const [records, queue] = await Promise.all([
    listRecordsAction(),
    listPendingHistoryQueueAction(),
  ])

  return (
    <div>
      <PageHeader
        title="Histórico"
        description="Fila de anotações e registros de atendimento"
        backHref="/dashboard"
        actionHref="/records/new"
        actionLabel="Novo registro"
      />
      <RecordsList queue={queue} records={records} />
    </div>
  )
}
