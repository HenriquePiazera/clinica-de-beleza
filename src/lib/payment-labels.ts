const methodLabels: Record<string, string> = {
  cash: 'Dinheiro',
  pix: 'PIX',
  credit_card: 'Cartão de crédito',
  debit_card: 'Cartão de débito',
  transfer: 'Transferência',
  other: 'Outro',
}

export function getPaymentMethodLabel(method: string): string {
  return methodLabels[method] ?? method
}
