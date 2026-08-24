/** Status permitidos quando o horário do atendimento já passou. */
export const PAST_APPOINTMENT_STATUSES = ['completed', 'canceled'] as const

export type PastAppointmentStatus = (typeof PAST_APPOINTMENT_STATUSES)[number]

/** Janela para alerta de confirmação (horas antes do horário). */
export const CONFIRMATION_ALERT_HOURS = 12

export function isPastAppointmentStart(startTime: Date | string): boolean {
  return new Date(startTime).getTime() <= Date.now()
}

export function isAllowedPastAppointmentStatus(
  status: string
): status is PastAppointmentStatus {
  return (PAST_APPOINTMENT_STATUSES as readonly string[]).includes(status)
}

/**
 * Agendado / aguardando confirmação sem confirmar até 12h antes do horário.
 */
export function needsConfirmationFollowUp(
  status: string,
  startTime: Date | string,
  now = new Date()
): boolean {
  if (status !== 'scheduled' && status !== 'awaiting_confirmation') {
    return false
  }
  const startMs = new Date(startTime).getTime()
  const alertFrom = startMs - CONFIRMATION_ALERT_HOURS * 60 * 60 * 1000
  return now.getTime() >= alertFrom
}

/**
 * Item da fila (histórico/financeiro): alerta após 00:00 do dia seguinte
 * ao atendimento.
 */
export function isQueueItemPastMidnight(
  startTime: Date | string,
  now = new Date()
): boolean {
  const start = new Date(startTime)
  const nextMidnight = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate() + 1,
    0,
    0,
    0,
    0
  )
  return now.getTime() >= nextMidnight.getTime()
}
