'use client'

import { useEffect, useState, useTransition } from 'react'
import { generatePublicQrCodeAction } from '@/features/settings/actions'
import { Button } from '@/components/ui/button'

type Props = {
  publicUrl: string
}

export function PublicQrCode({ publicUrl }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    startTransition(async () => {
      const result = await generatePublicQrCodeAction()
      if (result.success && result.data?.dataUrl) {
        setDataUrl(result.data.dataUrl)
      } else {
        setError('Não foi possível gerar o QR Code.')
      }
    })
  }, [])

  async function copyLink() {
    await navigator.clipboard.writeText(publicUrl)
  }

  return (
    <div className="space-y-4">
      <div className="bg-muted break-all rounded-md p-3 text-sm">{publicUrl}</div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={copyLink} className="min-h-11">
          Copiar link
        </Button>
        <Button asChild variant="outline" className="min-h-11">
          <a href={publicUrl} target="_blank" rel="noreferrer">
            Abrir página
          </a>
        </Button>
      </div>
      {isPending ? (
        <p className="text-muted-foreground text-sm">Gerando QR Code...</p>
      ) : null}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={dataUrl} alt="QR Code da página pública" className="mx-auto max-w-[280px]" />
      ) : null}
    </div>
  )
}
