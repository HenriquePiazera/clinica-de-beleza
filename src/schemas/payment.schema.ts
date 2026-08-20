import { z } from 'zod'

export const paymentSchema = z.object({
  client_id: z.string().min(1),
  appointment_id: z.string().optional(),
  amount: z.coerce.number().positive('Valor deve ser maior que zero'),
  payment_method: z.enum([
    'cash',
    'pix',
    'credit_card',
    'debit_card',
    'transfer',
    'other',
  ]),
  status: z.enum(['pending', 'paid', 'canceled']).default('pending'),
  paid_at: z.string().optional(),
})

export type PaymentInput = z.infer<typeof paymentSchema>
