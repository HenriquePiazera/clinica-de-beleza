import { z } from 'zod'

export const feedbackCategories = [
  'bug',
  'suggestion',
  'praise',
  'difficulty',
] as const

export const feedbackSchema = z.object({
  nps_score: z.coerce
    .number()
    .int()
    .min(0, 'Selecione uma nota de 0 a 10')
    .max(10, 'Selecione uma nota de 0 a 10'),
  category: z.enum(feedbackCategories),
  message: z
    .string()
    .trim()
    .min(10, 'Descreva com pelo menos 10 caracteres')
    .max(2000, 'Mensagem muito longa (máx. 2000 caracteres)'),
  can_contact: z
    .union([z.literal('true'), z.literal('false'), z.literal('on'), z.undefined()])
    .transform((value) => value === 'true' || value === 'on'),
})
