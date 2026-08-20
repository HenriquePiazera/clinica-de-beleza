import { prisma } from '@/lib/prisma'
import { checkPlanLimit } from '@/lib/plan-limits'
import {
  DEFAULT_CONFIRMATION_HOURS_BEFORE,
  DEFAULT_REMINDER_HOURS_BEFORE,
  isAppointmentInReminderWindow,
  isConfirmationHoursBefore,
  isReminderHoursBefore,
  REMINDER_HOURS_OPTIONS,
  type ConfirmationHoursBefore,
  type ReminderHoursBefore,
} from '@/lib/reminder-settings'
import { sendAppointmentNotification } from '@/services/notification.service'

const MAX_SCHEDULED_HOURS = Math.max(...REMINDER_HOURS_OPTIONS)

export async function processReminderNotifications(): Promise<{
  processed: number
  remindersSent: number
  confirmationsSent: number
}> {
  const now = new Date()
  const horizon = new Date(now.getTime() + (MAX_SCHEDULED_HOURS + 1) * 60 * 60 * 1000)

  const appointments = await prisma.appointment.findMany({
    where: {
      start_time: { gte: now, lte: horizon },
      OR: [
        {
          reminder_sent_at: null,
          status: { in: ['scheduled', 'awaiting_confirmation', 'confirmed'] },
        },
        {
          confirmation_reminder_sent_at: null,
          status: 'awaiting_confirmation',
        },
      ],
    },
    include: {
      client: true,
      user: {
        select: {
          name: true,
          reminder_hours_before: true,
          confirmation_hours_before: true,
        },
      },
      service: { select: { name: true } },
      confirmations: {
        where: { status: 'pending' },
        orderBy: { sent_at: 'desc' },
        take: 1,
      },
    },
  })

  let remindersSent = 0
  let confirmationsSent = 0

  for (const appointment of appointments) {
    const reminderLimit = await checkPlanLimit(
      appointment.user_id,
      'auto_reminders'
    )
    if (!reminderLimit.allowed) continue

    const pendingToken = appointment.confirmations[0]?.token
    const appointmentInfo = {
      id: appointment.id,
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      professionalName: appointment.user.name,
      serviceName: appointment.service?.name ?? 'Atendimento',
    }
    const clientInfo = {
      id: appointment.client.id,
      name: appointment.client.name,
      email: appointment.client.email,
      push_subscription: appointment.client.push_subscription,
    }

    if (
      appointment.reminder_sent_at === null &&
      ['scheduled', 'awaiting_confirmation', 'confirmed'].includes(
        appointment.status
      )
    ) {
      const configuredHours = appointment.user.reminder_hours_before
      const hoursBefore: ReminderHoursBefore = isReminderHoursBefore(configuredHours)
        ? configuredHours
        : DEFAULT_REMINDER_HOURS_BEFORE

      if (isAppointmentInReminderWindow(appointment.start_time, hoursBefore, now)) {
        const result = await sendAppointmentNotification({
          type: 'reminder',
          appointment: appointmentInfo,
          client: clientInfo,
          confirmationToken: pendingToken,
          reminderHoursBefore: hoursBefore,
        })

        if (result.channel !== 'none') {
          await prisma.appointment.update({
            where: { id: appointment.id },
            data: { reminder_sent_at: now },
          })
          remindersSent++
        }
      }
    }

    if (
      appointment.status === 'awaiting_confirmation' &&
      appointment.confirmation_reminder_sent_at === null &&
      pendingToken
    ) {
      const configuredHours = appointment.user.confirmation_hours_before
      const hoursBefore: ConfirmationHoursBefore = isConfirmationHoursBefore(
        configuredHours
      )
        ? configuredHours
        : DEFAULT_CONFIRMATION_HOURS_BEFORE

      if (
        hoursBefore > 0 &&
        isReminderHoursBefore(hoursBefore) &&
        isAppointmentInReminderWindow(appointment.start_time, hoursBefore, now)
      ) {
        const result = await sendAppointmentNotification({
          type: 'confirmation',
          appointment: appointmentInfo,
          client: clientInfo,
          confirmationToken: pendingToken,
          confirmationFollowUp: true,
          confirmationHoursBefore: hoursBefore,
        })

        if (result.channel !== 'none') {
          await prisma.appointment.update({
            where: { id: appointment.id },
            data: { confirmation_reminder_sent_at: now },
          })
          confirmationsSent++
        }
      }
    }
  }

  return {
    processed: appointments.length,
    remindersSent,
    confirmationsSent,
  }
}
