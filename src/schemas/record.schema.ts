import { z } from 'zod'

export const serviceRecordSchema = z.object({
  appointment_id: z.string().min(1),
  client_id: z.string().min(1),
  description: z.string().min(1, 'Descrição é obrigatória'),
  evolution: z.string().optional(),
})

export type ServiceRecordInput = z.infer<typeof serviceRecordSchema>
