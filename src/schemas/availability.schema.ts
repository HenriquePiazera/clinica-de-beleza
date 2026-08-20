import { z } from 'zod'

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d/

function normalizeTime(value: string): string {
  const match = value.match(/^(\d{2}):(\d{2})/)
  return match ? `${match[1]}:${match[2]}` : value
}

export const availabilitySchema = z
  .object({
    day_of_week: z.coerce.number().int().min(0).max(6),
    start_time: z
      .string()
      .transform(normalizeTime)
      .refine((value) => timeRegex.test(value), 'Horário inválido (use HH:MM)'),
    end_time: z
      .string()
      .transform(normalizeTime)
      .refine((value) => timeRegex.test(value), 'Horário inválido (use HH:MM)'),
    is_active: z.coerce.boolean().optional(),
  })
  .refine((data) => data.start_time < data.end_time, {
    message: 'Horário de início deve ser anterior ao fim',
    path: ['end_time'],
  })

export type AvailabilityInput = z.infer<typeof availabilitySchema>

export const DAY_LABELS = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
] as const
