'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import {
  actionError,
  getClientIp,
  requireUserId,
  type ActionResult,
} from '@/lib/session'
import { appointmentSchema } from '@/schemas/appointment.schema'
import { isPastDateTime } from '@/lib/datetime'
import {
  isAllowedPastAppointmentStatus,
  isPastAppointmentStart,
} from '@/lib/appointment-status'
import {
  checkAppointmentConflict,
  formatConflictMessage,
} from '@/services/appointment-conflict.service'
import { buildReminderMessage } from '@/services/reminder.service'
import { sendAppointmentNotification } from '@/services/notification.service'
import { getAccessibleTeamUserIds, getTeamMemberIds } from '@/lib/team'
import { randomBytes } from 'crypto'

export type AppointmentDTO = {
  id: string
  client_id: string
  client_name: string
  professional_user_id: string
  start_time: string
  end_time: string
  status: string
  notes: string | null
  buffer_minutes: number
}

async function findAccessibleAppointment(id: string, userId: string) {
  const userIds = await getTeamMemberIds(userId)
  return prisma.appointment.findFirst({
    where: { id, user_id: { in: userIds } },
    include: { client: { select: { name: true, email: true, push_subscription: true, id: true } } },
  })
}

export async function getAppointmentAction(
  id: string
): Promise<AppointmentDTO | null> {
  const userId = await requireUserId()
  const appointment = await findAccessibleAppointment(id, userId)

  if (!appointment) return null

  return {
    id: appointment.id,
    client_id: appointment.client_id,
    client_name: appointment.client.name,
    professional_user_id: appointment.user_id,
    start_time: appointment.start_time.toISOString(),
    end_time: appointment.end_time.toISOString(),
    status: appointment.status,
    notes: appointment.notes,
    buffer_minutes: appointment.buffer_minutes,
  }
}

export async function listAppointmentsAction(): Promise<AppointmentDTO[]> {
  const userId = await requireUserId()
  const userIds = await getTeamMemberIds(userId)
  const appointments = await prisma.appointment.findMany({
    where: { user_id: { in: userIds } },
    include: { client: { select: { name: true } } },
    orderBy: { start_time: 'asc' },
  })

  return appointments.map((a) => ({
    id: a.id,
    client_id: a.client_id,
    client_name: a.client.name,
    professional_user_id: a.user_id,
    start_time: a.start_time.toISOString(),
    end_time: a.end_time.toISOString(),
    status: a.status,
    notes: a.notes,
    buffer_minutes: a.buffer_minutes,
  }))
}

export async function createAppointmentAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId()
  const parsed = appointmentSchema.safeParse({
    client_id: formData.get('client_id'),
    start_time: formData.get('start_time'),
    end_time: formData.get('end_time'),
    notes: formData.get('notes') || undefined,
    buffer_minutes: formData.get('buffer_minutes') ?? 0,
  })

  if (!parsed.success) return actionError('INVALID_INPUT')

  const client = await prisma.client.findFirst({
    where: {
      id: parsed.data.client_id,
      user_id: { in: await getAccessibleTeamUserIds(userId) },
    },
  })
  if (!client) return actionError('CLIENT_NOT_FOUND')

  const startTime = new Date(parsed.data.start_time)
  const endTime = new Date(parsed.data.end_time)

  if (isPastDateTime(startTime)) {
    return actionError('APPOINTMENT_PAST_DATE')
  }

  if (endTime <= startTime) {
    return actionError('INVALID_INPUT')
  }

  const conflict = await checkAppointmentConflict(
    userId,
    startTime,
    endTime,
    parsed.data.buffer_minutes
  )

  if (conflict.hasConflict) {
    return {
      success: false,
      error: formatConflictMessage(conflict.type, conflict.conflictingStart),
      errorCode: conflict.type,
    }
  }

  const appointment = await prisma.appointment.create({
    data: {
      user_id: userId,
      client_id: parsed.data.client_id,
      start_time: startTime,
      end_time: endTime,
      notes: parsed.data.notes ?? null,
      buffer_minutes: parsed.data.buffer_minutes,
      status: 'scheduled',
    },
  })

  const confirmationToken = randomBytes(32).toString('hex')
  await prisma.appointmentConfirmation.create({
    data: {
      appointment_id: appointment.id,
      token: confirmationToken,
    },
  })

  const hdrs = await headers()
  await logAudit({
    userId,
    operation: 'appointment.create',
    entity: 'Appointment',
    entityId: appointment.id,
    ipAddress: getClientIp(hdrs),
  })

  revalidatePath('/appointments')

  try {
    await notifyClientAboutAppointment(
      appointment.id,
      'scheduled',
      confirmationToken
    )
  } catch (err) {
    console.error('[notificação] falha ao notificar agendamento:', err)
  }

  return { success: true, data: { id: appointment.id } }
}

async function notifyClientAboutAppointment(
  appointmentId: string,
  type: 'scheduled' | 'cancellation' | 'reschedule',
  confirmationToken?: string
) {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId },
    include: {
      client: true,
      user: { select: { name: true } },
      service: { select: { name: true } },
    },
  })
  if (!appointment) return

  await sendAppointmentNotification({
    type,
    ownerUserId: appointment.user_id,
    appointment: {
      id: appointment.id,
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      professionalName: appointment.user.name,
      serviceName: appointment.service?.name ?? 'Atendimento',
    },
    client: {
      id: appointment.client.id,
      name: appointment.client.name,
      email: appointment.client.email,
      phone: appointment.client.phone,
      push_subscription: appointment.client.push_subscription,
    },
    confirmationToken,
  })
}

export async function updateAppointmentAction(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId()
  const existing = await findAccessibleAppointment(id, userId)
  if (!existing) return actionError('APPOINTMENT_NOT_FOUND')

  const professionalId = existing.user_id

  const parsed = appointmentSchema.safeParse({
    client_id: formData.get('client_id'),
    start_time: formData.get('start_time'),
    end_time: formData.get('end_time'),
    notes: formData.get('notes') || undefined,
    buffer_minutes: formData.get('buffer_minutes') ?? existing.buffer_minutes,
    status: formData.get('status') || existing.status,
  })

  if (!parsed.success) return actionError('INVALID_INPUT')

  const client = await prisma.client.findFirst({
    where: {
      id: parsed.data.client_id,
      user_id: { in: await getAccessibleTeamUserIds(userId) },
    },
  })
  if (!client) return actionError('CLIENT_NOT_FOUND')

  const startTime = new Date(parsed.data.start_time)
  const endTime = new Date(parsed.data.end_time)
  const nextStatus = parsed.data.status ?? existing.status

  const startChanged = startTime.getTime() !== existing.start_time.getTime()
  if (isPastDateTime(startTime) && startChanged) {
    return actionError('APPOINTMENT_PAST_DATE')
  }

  const appointmentIsPast =
    isPastAppointmentStart(existing.start_time) ||
    isPastAppointmentStart(startTime)
  if (
    appointmentIsPast &&
    !isAllowedPastAppointmentStatus(nextStatus)
  ) {
    return actionError('APPOINTMENT_PAST_STATUS_INVALID')
  }

  if (endTime <= startTime) {
    return actionError('INVALID_INPUT')
  }

  const timeChanged =
    existing.start_time.getTime() !== startTime.getTime() ||
    existing.end_time.getTime() !== endTime.getTime()

  if (timeChanged) {
    const conflict = await checkAppointmentConflict(
      professionalId,
      startTime,
      endTime,
      parsed.data.buffer_minutes,
      id
    )
    if (conflict.hasConflict) {
      return {
        success: false,
        error: formatConflictMessage(conflict.type, conflict.conflictingStart),
        errorCode: conflict.type,
      }
    }
  }

  await prisma.appointment.update({
    where: { id },
    data: {
      client_id: parsed.data.client_id,
      start_time: startTime,
      end_time: endTime,
      notes: parsed.data.notes ?? null,
      buffer_minutes: parsed.data.buffer_minutes,
      status: nextStatus,
      ...(timeChanged
        ? { reminder_sent_at: null, confirmation_reminder_sent_at: null }
        : {}),
    },
  })

  const hdrs = await headers()
  await logAudit({
    userId,
    operation: 'appointment.update',
    entity: 'Appointment',
    entityId: id,
    ipAddress: getClientIp(hdrs),
  })

  revalidatePath('/appointments')
  revalidatePath(`/appointments/${id}`)
  revalidatePath('/records')
  revalidatePath('/payments')

  if (timeChanged && nextStatus !== 'canceled') {
    const confirmation = await prisma.appointmentConfirmation.create({
      data: {
        appointment_id: id,
        token: randomBytes(32).toString('hex'),
      },
    })
    await notifyClientAboutAppointment(id, 'reschedule', confirmation.token)
  }

  return { success: true }
}

export async function cancelAppointmentAction(id: string): Promise<ActionResult> {
  const userId = await requireUserId()
  const existing = await findAccessibleAppointment(id, userId)
  if (!existing) return actionError('APPOINTMENT_NOT_FOUND')

  await prisma.appointment.update({
    where: { id },
    data: { status: 'canceled' },
  })

  await notifyClientAboutAppointment(id, 'cancellation')

  const hdrs = await headers()
  await logAudit({
    userId,
    operation: 'appointment.cancel',
    entity: 'Appointment',
    entityId: id,
    ipAddress: getClientIp(hdrs),
  })

  revalidatePath('/appointments')
  revalidatePath(`/appointments/${id}`)
  revalidatePath('/records')
  revalidatePath('/payments')
  return { success: true }
}

export async function deleteAppointmentAction(id: string): Promise<ActionResult> {
  const userId = await requireUserId()
  const existing = await findAccessibleAppointment(id, userId)
  if (!existing) return actionError('APPOINTMENT_NOT_FOUND')

  await prisma.appointment.delete({
    where: { id },
  })

  const hdrs = await headers()
  await logAudit({
    userId,
    operation: 'appointment.delete',
    entity: 'Appointment',
    entityId: id,
    ipAddress: getClientIp(hdrs),
  })

  revalidatePath('/appointments')
  revalidatePath('/records')
  revalidatePath('/payments')
  return { success: true }
}

export async function getReminderMessageAction(
  appointmentId: string
): Promise<ActionResult<{ message: string }>> {
  const userId = await requireUserId()
  const appointment = await findAccessibleAppointment(appointmentId, userId)

  if (!appointment) return actionError('APPOINTMENT_NOT_FOUND')

  const message = buildReminderMessage({
    clientName: appointment.client.name,
    date: appointment.start_time.toLocaleDateString('pt-BR'),
    time: appointment.start_time.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  })

  return { success: true, data: { message } }
}

export type PendingQueueItemDTO = {
  appointment_id: string
  client_id: string
  client_name: string
  start_time: string
  status: string
}

/** Fila do Histórico: realizados/cancelados sem registro de atendimento. */
export async function listPendingHistoryQueueAction(): Promise<
  PendingQueueItemDTO[]
> {
  const userId = await requireUserId()
  const userIds = await getTeamMemberIds(userId)
  const rows = await prisma.appointment.findMany({
    where: {
      user_id: { in: userIds },
      status: { in: ['completed', 'canceled'] },
      service_records: { none: {} },
    },
    include: { client: { select: { name: true } } },
    orderBy: { start_time: 'asc' },
  })

  return rows.map((a) => ({
    appointment_id: a.id,
    client_id: a.client_id,
    client_name: a.client.name,
    start_time: a.start_time.toISOString(),
    status: a.status,
  }))
}

/** Fila do Financeiro: realizados/cancelados sem pagamento vinculado. */
export async function listPendingFinanceQueueAction(): Promise<
  PendingQueueItemDTO[]
> {
  const userId = await requireUserId()
  const userIds = await getTeamMemberIds(userId)
  const rows = await prisma.appointment.findMany({
    where: {
      user_id: { in: userIds },
      status: { in: ['completed', 'canceled'] },
      payments: { none: {} },
    },
    include: { client: { select: { name: true } } },
    orderBy: { start_time: 'asc' },
  })

  return rows.map((a) => ({
    appointment_id: a.id,
    client_id: a.client_id,
    client_name: a.client.name,
    start_time: a.start_time.toISOString(),
    status: a.status,
  }))
}
