import { z } from 'zod'

export const appointmentSchema = z.object({
  client_id: z.string().min(1, 'Cliente é obrigatório'),
  start_time: z.string().min(1, 'Data/hora de início é obrigatória'),
  end_time: z.string().min(1, 'Data/hora de fim é obrigatória'),
  notes: z.string().optional(),
  buffer_minutes: z.coerce.number().int().min(0).max(30).default(0),
  status: z
    .enum([
      'scheduled',
      'awaiting_confirmation',
      'confirmed',
      'completed',
      'canceled',
    ])
    .optional(),
})

export type AppointmentInput = z.infer<typeof appointmentSchema>
