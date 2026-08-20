import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { getPaymentReceiptAction } from '@/features/payments/actions'
import { PrintReceiptButton } from '@/features/payments/print-receipt-button'
import { formatAmountInWords } from '@/lib/receipt'

export default async function PaymentReceiptPage({
  params,
}: {
  params: { id: string }
}) {
  const result = await getPaymentReceiptAction(params.id)

  if (!result.success) {
    if (result.errorCode === 'PAYMENT_NOT_FOUND') notFound()

    return (
      <div>
        <PageHeader title="Recibo" backHref="/payments" />
        <p className="text-destructive text-sm">{result.error}</p>
        <Button asChild variant="outline" className="mt-4 min-h-11">
          <Link href="/payments">Voltar ao financeiro</Link>
        </Button>
      </div>
    )
  }

  const receipt = result.data
  if (!receipt) notFound()

  const paidAt = new Date(receipt.paid_at)
  const issuedAt = new Date(receipt.issued_at)
  const amountLabel = formatAmountInWords(receipt.amount)

  return (
    <div className="print:bg-white">
      <div className="mb-6 flex flex-col gap-3 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <PageHeader title="Recibo de pagamento" backHref="/payments" />
        <div className="flex flex-col gap-2 sm:flex-row">
          <PrintReceiptButton />
          <Button asChild variant="outline" className="min-h-11">
            <Link href="/settings/receipt">Editar dados do emitente</Link>
          </Button>
        </div>
      </div>

      <article className="mx-auto max-w-2xl rounded-lg border bg-card p-6 shadow-sm print:max-w-none print:border-0 print:p-0 print:shadow-none">
        <header className="space-y-1 border-b pb-4 text-center">
          <p className="text-muted-foreground text-xs uppercase tracking-wide print:text-black">
            Comprovante de pagamento
          </p>
          <h1 className="text-xl font-semibold">{receipt.professional.name}</h1>
          {receipt.professional.tax_id ? (
            <p className="text-sm">CPF/CNPJ: {receipt.professional.tax_id}</p>
          ) : null}
          {receipt.professional.address ? (
            <p className="text-muted-foreground text-sm print:text-black">
              {receipt.professional.address}
            </p>
          ) : null}
        </header>

        <div className="flex flex-wrap items-center justify-between gap-2 py-4 text-sm">
          <p>
            <span className="text-muted-foreground print:text-black">Recibo nº </span>
            <strong>{receipt.receipt_label}</strong>
          </p>
          <p>
            <span className="text-muted-foreground print:text-black">Emitido em </span>
            {issuedAt.toLocaleDateString('pt-BR')}
          </p>
        </div>

        <div className="space-y-4 text-sm leading-relaxed">
          <p>
            Recebi de <strong>{receipt.client.name}</strong> a quantia de{' '}
            <strong>{amountLabel}</strong>, paga em{' '}
            <strong>{paidAt.toLocaleDateString('pt-BR')}</strong> via{' '}
            <strong>{receipt.payment_method_label}</strong>, referente a{' '}
            <strong>{receipt.reference_description}</strong>.
          </p>

          <p className="text-muted-foreground text-xs print:text-black">
            Para maior clareza, firmo o presente recibo.
          </p>
        </div>

        <footer className="mt-10 space-y-8">
          <div className="border-t pt-8 text-center">
            <div className="mx-auto mb-2 h-px w-48 bg-foreground" />
            <p className="text-sm font-medium">{receipt.professional.name}</p>
            {receipt.professional.tax_id ? (
              <p className="text-muted-foreground text-xs print:text-black">
                {receipt.professional.tax_id}
              </p>
            ) : null}
          </div>

          <p className="text-muted-foreground text-center text-xs print:text-black">
            Documento emitido eletronicamente. Comprovante de pagamento — não
            constitui documento fiscal.
          </p>
        </footer>
      </article>
    </div>
  )
}
