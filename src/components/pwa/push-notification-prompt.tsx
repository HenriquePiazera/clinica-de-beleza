'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  isPushAvailable,
  subscribeClientToPush,
} from '@/lib/push-client'

type Props = {
  slug: string
  clientPhone: string
  onSubscribed?: () => void
}

export function PushNotificationPrompt({
  slug,
  clientPhone,
  onSubscribed,
}: Props) {
  const [available, setAvailable] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    void isPushAvailable().then(setAvailable)
  }, [])

  if (!available || !clientPhone.trim()) return null
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    return null
  }

  async function handleEnable() {
    setLoading(true)
    setStatus(null)
    const ok = await subscribeClientToPush({
      slug,
      client_phone: clientPhone.trim(),
    })
    setLoading(false)
    if (ok) {
      setStatus('Notificações ativadas!')
      onSubscribed?.()
    } else {
      setStatus('Não foi possível ativar. Você ainda receberá e-mail se cadastrou.')
    }
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950">
      <p className="font-medium">Receba lembretes no celular (grátis)</p>
      <p className="text-muted-foreground mt-1 text-xs">
        Ative as notificações para confirmações e lembretes automáticos.
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2 min-h-9"
        disabled={loading}
        onClick={() => void handleEnable()}
      >
        {loading ? 'Ativando…' : 'Ativar notificações'}
      </Button>
      {status ? <p className="mt-2 text-xs">{status}</p> : null}
    </div>
  )
}
