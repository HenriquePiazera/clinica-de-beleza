import { PageHeader } from '@/components/layout/page-header'
import { NewClientForm } from '@/features/clients/new-client-form'

export default function NewClientPage() {
  return (
    <div>
      <PageHeader
        title="Novo cliente"
        description="Cadastre um novo cliente"
        backHref="/clients"
      />
      <NewClientForm />
    </div>
  )
}
