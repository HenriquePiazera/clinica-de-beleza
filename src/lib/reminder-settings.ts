export const REMINDER_HOURS_OPTIONS = [1, 2, 4, 24] as const

export type ReminderHoursBefore = (typeof REMINDER_HOURS_OPTIONS)[number]

export const CONFIRMATION_HOURS_OPTIONS = [0, 1, 2, 4, 24] as const

export type ConfirmationHoursBefore = (typeof CONFIRMATION_HOURS_OPTIONS)[number]

export const DEFAULT_REMINDER_HOURS_BEFORE: ReminderHoursBefore = 24

export const DEFAULT_CONFIRMATION_HOURS_BEFORE: ConfirmationHoursBefore = 24

export const REMINDER_HOURS_LABELS: Record<ReminderHoursBefore, string> = {
  1: '1 hora antes',
  2: '2 horas antes',
  4: '4 horas antes',
  24: '24 horas antes',
}

export const CONFIRMATION_HOURS_LABELS: Record<ConfirmationHoursBefore, string> = {
  0: 'Somente no agendamento (sem reenvio)',
  1: '1 hora antes',
  2: '2 horas antes',
  4: '4 horas antes',
  24: '24 horas antes',
}

export function isReminderHoursBefore(value: number): value is ReminderHoursBefore {
  return REMINDER_HOURS_OPTIONS.includes(value as ReminderHoursBefore)
}

export function isConfirmationHoursBefore(
  value: number
): value is ConfirmationHoursBefore {
  return CONFIRMATION_HOURS_OPTIONS.includes(value as ConfirmationHoursBefore)
}

export function buildReminderLeadText(hoursBefore: ReminderHoursBefore): string {
  if (hoursBefore === 1) return 'em 1 hora'
  if (hoursBefore === 24) return 'amanhã'
  return `em ${hoursBefore} horas`
}

export function isAppointmentInReminderWindow(
  startTime: Date,
  hoursBefore: ReminderHoursBefore | Exclude<ConfirmationHoursBefore, 0>,
  now = new Date()
): boolean {
  const windowStart = new Date(now.getTime() + (hoursBefore - 1) * 60 * 60 * 1000)
  const windowEnd = new Date(now.getTime() + hoursBefore * 60 * 60 * 1000)
  return startTime >= windowStart && startTime <= windowEnd
}
