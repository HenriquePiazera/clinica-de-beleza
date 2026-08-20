export type ReceiptAddressParts = {
  street?: string | null
  number?: string | null
  complement?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  postalCode?: string | null
}

export function formatTaxId(value: string | null | undefined): string | null {
  if (!value) return null
  const digits = value.replace(/\D/g, '')
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  if (digits.length === 14) {
    return digits.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      '$1.$2.$3/$4-$5'
    )
  }
  return value
}

export function formatPostalCode(value: string | null | undefined): string | null {
  if (!value) return null
  const digits = value.replace(/\D/g, '')
  if (digits.length === 8) {
    return digits.replace(/(\d{5})(\d{3})/, '$1-$2')
  }
  return value
}

export function formatReceiptAddress(parts: ReceiptAddressParts): string | null {
  const streetLine = [parts.street, parts.number].filter(Boolean).join(', ')
  const cityLine = [parts.city, parts.state].filter(Boolean).join(' — ')
  const lines = [
    streetLine,
    parts.complement,
    parts.neighborhood,
    cityLine,
    parts.postalCode ? `CEP ${formatPostalCode(parts.postalCode)}` : null,
  ].filter(Boolean)

  return lines.length > 0 ? lines.join(' · ') : null
}

export function formatReceiptNumber(
  receiptNumber: number,
  issuedAt: Date
): string {
  const year = issuedAt.getFullYear()
  return `${String(receiptNumber).padStart(3, '0')}/${year}`
}

export function formatAmountInWords(amount: number): string {
  return amount.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}
