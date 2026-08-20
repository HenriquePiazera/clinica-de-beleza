import type { Appointment } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'

type ConflictResult =
  | { hasConflict: false }
  | {
      hasConflict: true
      type: 'APPOINTMENT_CONFLICT' | 'APPOINTMENT_BUFFER_CONFLICT'
      conflictingStart: Date
    }

export async function checkAppointmentConflict(
  userId: string,
  startTime: Date,
  endTime: Date,
  bufferMinutes: number,
  excludeAppointmentId?: string
): Promise<ConflictResult> {
  const existing = await prisma.appointment.findMany({
    where: {
      user_id: userId,
      status: { not: 'canceled' },
      ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
    },
  })

  const newStart = startTime.getTime()
  const newEnd = endTime.getTime()
  const newEndWithBuffer = newEnd + bufferMinutes * 60 * 1000

  for (const appt of existing) {
    const existingStart = appt.start_time.getTime()
    const existingEnd = appt.end_time.getTime()
    const existingEndWithBuffer =
      existingEnd + appt.buffer_minutes * 60 * 1000

    const overlaps =
      newStart < existingEndWithBuffer && newEndWithBuffer > existingStart

    if (!overlaps) continue

    const exactOverlap =
      newStart === existingStart && newEnd === existingEnd

    if (exactOverlap || (newStart < existingEnd && newEnd > existingStart)) {
      return {
        hasConflict: true,
        type: 'APPOINTMENT_CONFLICT',
        conflictingStart: appt.start_time,
      }
    }

    return {
      hasConflict: true,
      type: 'APPOINTMENT_BUFFER_CONFLICT',
      conflictingStart: appt.start_time,
    }
  }

  return { hasConflict: false }
}

export function formatConflictMessage(
  type: 'APPOINTMENT_CONFLICT' | 'APPOINTMENT_BUFFER_CONFLICT',
  conflictingStart: Date
): string {
  const time = conflictingStart.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  if (type === 'APPOINTMENT_CONFLICT') {
    return `Já existe um agendamento neste horário. Conflito com ${time}.`
  }

  return `Horário muito próximo de outro atendimento. Conflito com ${time}.`
}

export function getBusySlots(appointments: Appointment[]): Date[] {
  return appointments
    .filter((a) => a.status !== 'canceled')
    .map((a) => a.start_time)
}
