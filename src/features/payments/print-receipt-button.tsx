'use client'

import { Button } from '@/components/ui/button'

export function PrintReceiptButton() {
  return (
    <Button
      type="button"
      className="min-h-11 print:hidden"
      onClick={() => window.print()}
    >
      Imprimir / Salvar PDF
    </Button>
  )
}
