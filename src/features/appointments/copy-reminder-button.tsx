'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { getReminderMessageAction } from '@/features/appointments/actions'

export function CopyReminderButton({
  appointmentId,
}: {
  appointmentId: string
}) {
  const [status, setStatus] = useState<string | null>(null)

  async function handleCopy() {
    setStatus(null)
    const result = await getReminderMessageAction(appointmentId)
    if (!result.success) {
      setStatus('error' in result ? result.error : 'Erro ao gerar lembrete')
      return
    }
    if (!result.data?.message) {
      setStatus('Erro ao gerar lembrete')
      return
    }
    await navigator.clipboard.writeText(result.data.message)
    setStatus('Lembrete copiado!')
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="secondary"
        className="min-h-11"
        onClick={() => void handleCopy()}
      >
        Copiar lembrete
      </Button>
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
    </div>
  )
}
