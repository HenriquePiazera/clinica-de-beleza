export const PAYMENT_METHOD_OPTIONS = [
  { value: 'pix', label: 'PIX' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'credit_card', label: 'Cartão de crédito' },
  { value: 'debit_card', label: 'Cartão de débito' },
  { value: 'transfer', label: 'Transferência' },
  { value: 'other', label: 'Outro' },
] as const

const methodLabels: Record<string, string> = Object.fromEntries(
  PAYMENT_METHOD_OPTIONS.map((o) => [o.value, o.label])
)

export type PaymentMethodSplit = {
  method: string
  amount: number
}

export function getPaymentMethodLabel(method: string): string {
  return methodLabels[method] ?? method
}

export function parsePaymentMethodSplits(
  value: unknown
): PaymentMethodSplit[] | null {
  if (!Array.isArray(value)) return null
  const splits: PaymentMethodSplit[] = []
  for (const item of value) {
    if (
      !item ||
      typeof item !== 'object' ||
      typeof (item as { method?: unknown }).method !== 'string' ||
      typeof (item as { amount?: unknown }).amount !== 'number' ||
      !Number.isFinite((item as { amount: number }).amount)
    ) {
      return null
    }
    splits.push({
      method: (item as { method: string }).method,
      amount: (item as { amount: number }).amount,
    })
  }
  return splits.length > 0 ? splits : null
}

export function formatPaymentMethodsSummary(
  paymentMethod: string,
  splits: PaymentMethodSplit[] | null | undefined,
  amount: number
): string {
  const list =
    splits && splits.length > 0
      ? splits
      : [{ method: paymentMethod, amount }]

  return list
    .map(
      (s) =>
        `${getPaymentMethodLabel(s.method)} (${s.amount.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        })})`
    )
    .join(' + ')
}
