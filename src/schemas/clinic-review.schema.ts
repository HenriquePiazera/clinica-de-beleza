import { z } from 'zod'

export const clinicReviewSchema = z.object({
  author_name: z
    .string()
    .trim()
    .min(2, 'Informe seu nome')
    .max(80, 'Nome muito longo'),
  rating: z.coerce
    .number()
    .int()
    .min(1, 'Escolha uma nota de 1 a 5')
    .max(5, 'Escolha uma nota de 1 a 5'),
  message: z
    .string()
    .trim()
    .min(10, 'Escreva pelo menos 10 caracteres')
    .max(1000, 'Mensagem muito longa (máx. 1000)'),
  allow_publish: z
    .union([
      z.literal('true'),
      z.literal('false'),
      z.literal('on'),
      z.undefined(),
    ])
    .transform((value) => value === 'true' || value === 'on'),
})

export type ClinicReviewInput = z.infer<typeof clinicReviewSchema>
