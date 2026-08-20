import {
  sendCancellationEmail,
  sendConfirmationEmail,
  sendConfirmationFollowUpEmail,
  sendReminderEmail,
  sendRescheduleEmail,
  sendScheduledEmail,
} from '@/services/email.service'
import { getAppBaseUrlSync } from '@/lib/app-url'
import {
  buildReminderLeadText,
  DEFAULT_REMINDER_HOURS_BEFORE,
  type ConfirmationHoursBefore,
  type ReminderHoursBefore,
} from '@/lib/reminder-settings'
import { sendPushNotification } from '@/services/push.service'

export type NotificationType =
  | 'confirmation'
  | 'scheduled'
  | 'reminder'
  | 'cancellation'
  | 'reschedule'

type AppointmentInfo = {
  id: string
  start_time: Date
  end_time: Date
  professionalName: string
  serviceName: string
}

type ClientInfo = {
  id: string
  name: string
  email: string | null
  push_subscription: string | null
}

export async function sendAppointmentNotification(input: {
  type: NotificationType
  appointment: AppointmentInfo
  client: ClientInfo
  confirmationToken?: string
  reminderHoursBefore?: ReminderHoursBefore
  confirmationFollowUp?: boolean
  confirmationHoursBefore?: ConfirmationHoursBefore
}): Promise<{ channel: 'push' | 'email' | 'none' }> {
  const baseUrl = getAppBaseUrlSync()
  const confirmUrl = input.confirmationToken
    ? `${baseUrl}/confirm/${input.confirmationToken}`
    : undefined

  const reminderHoursBefore =
    input.reminderHoursBefore ?? DEFAULT_REMINDER_HOURS_BEFORE

  const pushPayload = buildPushPayload(
    input.type,
    input.appointment,
    confirmUrl,
    {
      reminderHoursBefore,
      confirmationFollowUp: input.confirmationFollowUp,
      confirmationHoursBefore: input.confirmationHoursBefore,
    }
  )

  if (input.client.push_subscription) {
    try {
      const sent = await sendPushNotification(
        input.client.push_subscription,
        pushPayload
      )
      if (sent) return { channel: 'push' }
    } catch {
      // fallback to email
    }
  }

  if (input.client.email) {
    const emailHandlers = {
      confirmation: () =>
        input.confirmationFollowUp && confirmUrl
          ? sendConfirmationFollowUpEmail({
              to: input.client.email!,
              clientName: input.client.name,
              professionalName: input.appointment.professionalName,
              serviceName: input.appointment.serviceName,
              startTime: input.appointment.start_time,
              confirmUrl,
              hoursBefore: input.confirmationHoursBefore ?? 24,
            })
          : sendConfirmationEmail({
              to: input.client.email!,
              clientName: input.client.name,
              professionalName: input.appointment.professionalName,
              serviceName: input.appointment.serviceName,
              startTime: input.appointment.start_time,
              confirmUrl: confirmUrl!,
            }),
      reminder: () =>
        sendReminderEmail({
          to: input.client.email!,
          clientName: input.client.name,
          professionalName: input.appointment.professionalName,
          serviceName: input.appointment.serviceName,
          startTime: input.appointment.start_time,
          confirmUrl,
          hoursBefore: reminderHoursBefore,
        }),
      scheduled: () =>
        sendScheduledEmail({
          to: input.client.email!,
          clientName: input.client.name,
          professionalName: input.appointment.professionalName,
          serviceName: input.appointment.serviceName,
          startTime: input.appointment.start_time,
        }),
      cancellation: () =>
        sendCancellationEmail({
          to: input.client.email!,
          clientName: input.client.name,
          professionalName: input.appointment.professionalName,
          serviceName: input.appointment.serviceName,
          startTime: input.appointment.start_time,
        }),
      reschedule: () =>
        sendRescheduleEmail({
          to: input.client.email!,
          clientName: input.client.name,
          professionalName: input.appointment.professionalName,
          serviceName: input.appointment.serviceName,
          startTime: input.appointment.start_time,
          confirmUrl,
        }),
    }

    const result = await emailHandlers[input.type]()
    if (result.sent) return { channel: 'email' }
  }

  return { channel: 'none' }
}

function buildPushPayload(
  type: NotificationType,
  appointment: AppointmentInfo,
  confirmUrl?: string,
  options: {
    reminderHoursBefore?: ReminderHoursBefore
    confirmationFollowUp?: boolean
    confirmationHoursBefore?: ConfirmationHoursBefore
  } = {}
) {
  const dateStr = appointment.start_time.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  const reminderHoursBefore =
    options.reminderHoursBefore ?? DEFAULT_REMINDER_HOURS_BEFORE
  const leadText = buildReminderLeadText(reminderHoursBefore)
  const confirmationLeadText = options.confirmationHoursBefore
    ? buildReminderLeadText(options.confirmationHoursBefore)
    : leadText

  const titles: Record<NotificationType, string> = {
    confirmation: options.confirmationFollowUp
      ? 'Confirme seu agendamento'
      : 'Confirme seu agendamento',
    scheduled: 'Agendamento marcado',
    reminder: 'Lembrete de atendimento',
    cancellation: 'Agendamento cancelado',
    reschedule: 'Horário alterado',
  }

  const bodies: Record<NotificationType, string> = {
    confirmation: options.confirmationFollowUp
      ? `Seu atendimento (${appointment.serviceName}) é ${confirmationLeadText}. Confirme presença — ${dateStr}`
      : `${appointment.serviceName} com ${appointment.professionalName} — ${dateStr}`,
    scheduled: `${appointment.serviceName} com ${appointment.professionalName} — ${dateStr}`,
    reminder: `Seu atendimento (${appointment.serviceName}) é ${leadText} — ${dateStr}`,
    cancellation: `${appointment.serviceName} em ${dateStr} foi cancelado`,
    reschedule: `Novo horário: ${appointment.serviceName} — ${dateStr}`,
  }

  return {
    title: titles[type],
    body: bodies[type],
    url: confirmUrl ?? '/',
  }
}
