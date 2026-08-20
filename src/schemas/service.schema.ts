import { z } from 'zod'

export const serviceSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(120),
  description: z.string().max(500).optional(),
  photo_url: z.string().url().optional().or(z.literal('')),
  duration_minutes: z.coerce.number().int().min(15).max(480),
  price: z.coerce.number().min(0).optional(),
  is_active: z.coerce.boolean().optional(),
  sort_order: z.coerce.number().int().min(0).optional(),
})

export type ServiceInput = z.infer<typeof serviceSchema>
