import { z } from 'zod'

export const clientSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  phone: z.string().min(8, 'Telefone inválido'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  birth_date: z.string().optional(),
  notes: z.string().optional(),
})

export type ClientInput = z.infer<typeof clientSchema>
