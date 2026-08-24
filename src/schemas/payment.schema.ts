import { z } from 'zod'

export const paymentMethodEnum = z.enum([
  'cash',
  'pix',
  'credit_card',
  'debit_card',
  'transfer',
  'other',
])

export const paymentSplitSchema = z.object({
  method: paymentMethodEnum,
  amount: z.coerce.number().positive('Valor deve ser maior que zero'),
})

export const paymentSchema = z
  .object({
    client_id: z.string().min(1),
    appointment_id: z.string().optional(),
    amount: z.coerce.number().positive('Valor deve ser maior que zero'),
    payment_method: paymentMethodEnum,
    method_splits: z.array(paymentSplitSchema).min(1).max(6).optional(),
    notes: z.string().trim().max(1000).optional(),
    status: z.enum(['pending', 'paid', 'canceled']).default('pending'),
    paid_at: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.method_splits?.length) return
    const sum = data.method_splits.reduce((acc, s) => acc + s.amount, 0)
    if (Math.abs(sum - data.amount) > 0.009) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A soma dos métodos deve ser igual ao valor total',
        path: ['method_splits'],
      })
    }
  })

export type PaymentInput = z.infer<typeof paymentSchema>
export type PaymentSplitInput = z.infer<typeof paymentSplitSchema>
