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
import {
  buildMockSmsBody,
  isMockSmsEnabled,
  sendMockSms,
} from '@/services/mock-sms.service'

export type NotificationType =
  | 'confirmation'
  | 'scheduled'
  | 'reminder'
  | 'cancellation'
  | 'reschedule'

export type NotificationChannel = 'push' | 'email' | 'mock_sms' | 'none'

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
  phone: string | null
  push_subscription: string | null
}

export async function sendAppointmentNotification(input: {
  type: NotificationType
  /** Dono do agendamento (isolamento + inbox SMS). */
  ownerUserId: string
  appointment: AppointmentInfo
  client: ClientInfo
  confirmationToken?: string
  reminderHoursBefore?: ReminderHoursBefore
  confirmationFollowUp?: boolean
  confirmationHoursBefore?: ConfirmationHoursBefore
}): Promise<{ channel: NotificationChannel; error?: string }> {
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

  let lastError: string | undefined
  let primaryChannel: NotificationChannel = 'none'

  // E-mail tem prioridade quando o cliente informou endereço.
  if (input.client.email) {
    const emailHandlers = {
      confirmation: () =>
        input.confirmationFollowUp
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
              confirmUrl,
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
          confirmUrl,
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
    if (result.sent) {
      primaryChannel = 'email'
    } else {
      lastError = result.error
      console.error(
        `[notificação] falha e-mail (${input.type}) → ${input.client.email}:`,
        result.error
      )
    }
  }

  if (primaryChannel === 'none' && input.client.push_subscription) {
    try {
      const sent = await sendPushNotification(
        input.client.push_subscription,
        pushPayload
      )
      if (sent) primaryChannel = 'push'
    } catch (err) {
      console.error('[notificação] falha push:', err)
    }
  }

  // SMS simulado (custo R$ 0): sempre grava na inbox quando ativo + telefone,
  // mesmo se e-mail/push já tiverem sido enviados (útil para testes).
  if (isMockSmsEnabled() && input.client.phone?.trim()) {
    const body = buildMockSmsBody({
      type: input.type,
      clientName: input.client.name,
      professionalName: input.appointment.professionalName,
      serviceName: input.appointment.serviceName,
      startTime: input.appointment.start_time,
      confirmUrl,
      reminderHoursBefore,
      confirmationFollowUp: input.confirmationFollowUp,
      confirmationHoursBefore: input.confirmationHoursBefore,
    })
    const mock = await sendMockSms({
      userId: input.ownerUserId,
      clientId: input.client.id,
      appointmentId: input.appointment.id,
      toPhone: input.client.phone,
      body,
      notificationType: input.type,
    })
    if (mock.sent && primaryChannel === 'none') {
      primaryChannel = 'mock_sms'
    } else if (!mock.sent) {
      lastError = mock.error ?? lastError
    }
  }

  return {
    channel: primaryChannel,
    error: primaryChannel === 'none' ? lastError : undefined,
  }
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
    year: 'numeric',
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
