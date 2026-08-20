import { getDemoAccessStatus, isDemoMode } from '@/lib/demo'
import { getDemoSessionHours } from '@/lib/demo'

export async function DemoBanner({ email }: { email?: string | null }) {
  if (!isDemoMode()) return null

  const status = await getDemoAccessStatus(email)
  if (status.status === 'bypass' || status.status === 'disabled') {
    return (
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900 sm:text-sm">
        Ambiente de demonstração — sem cobrança. Conta com acesso permanente.
      </div>
    )
  }

  if (status.status !== 'active') return null

  const hours = getDemoSessionHours()
  const remainingMin = Math.max(1, Math.ceil(status.remainingMs / 60_000))
  const label =
    remainingMin >= 60
      ? `${Math.floor(remainingMin / 60)}h ${remainingMin % 60}min`
      : `${remainingMin} min`

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900 sm:text-sm">
      Ambiente de demonstração — sessão limitada a {hours}h. Tempo restante:{' '}
      <span className="font-semibold">{label}</span>.
    </div>
  )
}
