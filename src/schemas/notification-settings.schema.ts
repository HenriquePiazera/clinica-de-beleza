import { z } from 'zod'
import {
  CONFIRMATION_HOURS_OPTIONS,
  REMINDER_HOURS_OPTIONS,
} from '@/lib/reminder-settings'

export const notificationSettingsSchema = z.object({
  reminder_hours_before: z.coerce
    .number()
    .int()
    .refine(
      (value) =>
        REMINDER_HOURS_OPTIONS.includes(
          value as (typeof REMINDER_HOURS_OPTIONS)[number]
        ),
      { message: 'Antecedência de lembrete inválida.' }
    ),
  confirmation_hours_before: z.coerce
    .number()
    .int()
    .refine(
      (value) =>
        CONFIRMATION_HOURS_OPTIONS.includes(
          value as (typeof CONFIRMATION_HOURS_OPTIONS)[number]
        ),
      { message: 'Antecedência de confirmação inválida.' }
    ),
})
