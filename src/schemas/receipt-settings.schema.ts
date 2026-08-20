import { z } from 'zod'

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .or(z.literal(''))
    .transform((value) => value?.trim() || undefined)

function normalizeTaxId(value: string | undefined): string | undefined {
  if (!value) return undefined
  const digits = value.replace(/\D/g, '')
  if (digits.length === 0) return undefined
  return digits
}

export const receiptSettingsSchema = z.object({
  receipt_tax_id: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform(normalizeTaxId)
    .refine(
      (value) => !value || value.length === 11 || value.length === 14,
      'Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.'
    ),
  receipt_street: optionalText(120),
  receipt_address_number: optionalText(20),
  receipt_complement: optionalText(60),
  receipt_neighborhood: optionalText(80),
  receipt_city: optionalText(80),
  receipt_state: optionalText(2).transform((value) => value?.toUpperCase()),
  receipt_postal_code: optionalText(9),
})

export type ReceiptSettingsInput = z.infer<typeof receiptSettingsSchema>
