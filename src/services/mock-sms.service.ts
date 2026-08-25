import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import {
  buildReminderLeadText,
  DEFAULT_REMINDER_HOURS_BEFORE,
  type ConfirmationHoursBefore,
  type ReminderHoursBefore,
} from '@/lib/reminder-settings'
type NotificationType =
  | 'confirmation'
  | 'scheduled'
  | 'reminder'
  | 'cancellation'
  | 'reschedule'

/** Ativo por padrão neste projeto de teste; desliga com MOCK_SMS_ENABLED=false. */
export function isMockSmsEnabled(): boolean {
  const value = process.env.MOCK_SMS_ENABLED
  if (value === undefined || value === '') return true
  return value === 'true'
}

export function buildMockSmsBody(input: {
  type: NotificationType
  clientName: string
  professionalName: string
  serviceName: string
  startTime: Date
  confirmUrl?: string
  reminderHoursBefore?: ReminderHoursBefore
  confirmationFollowUp?: boolean
  confirmationHoursBefore?: ConfirmationHoursBefore
}): string {
  const dateStr = input.startTime.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  const reminderHoursBefore =
    input.reminderHoursBefore ?? DEFAULT_REMINDER_HOURS_BEFORE
  const leadText = buildReminderLeadText(reminderHoursBefore)
  const confirmationLeadText = input.confirmationHoursBefore
    ? buildReminderLeadText(input.confirmationHoursBefore)
    : leadText

  let body: string
  switch (input.type) {
    case 'confirmation':
      body = input.confirmationFollowUp
        ? `Olá ${input.clientName}, seu atendimento (${input.serviceName}) é ${confirmationLeadText} (${dateStr}). Confirme presença.`
        : `Olá ${input.clientName}, confirme seu agendamento: ${input.serviceName} com ${input.professionalName} — ${dateStr}.`
      break
    case 'scheduled':
      body = `Olá ${input.clientName}, agendamento marcado: ${input.serviceName} com ${input.professionalName} — ${dateStr}.`
      break
    case 'reminder':
      body = `Olá ${input.clientName}, lembrete: seu atendimento (${input.serviceName}) é ${leadText} — ${dateStr}.`
      break
    case 'cancellation':
      body = `Olá ${input.clientName}, o agendamento de ${input.serviceName} em ${dateStr} foi cancelado.`
      break
    case 'reschedule':
      body = `Olá ${input.clientName}, horário alterado: ${input.serviceName} — ${dateStr}.`
      break
  }

  if (input.confirmUrl) {
    body += ` Confirme: ${input.confirmUrl}`
  }

  return body
}

export async function sendMockSms(input: {
  userId: string
  clientId: string
  appointmentId: string
  toPhone: string
  body: string
  notificationType: NotificationType
}): Promise<{ sent: boolean; id?: string; error?: string }> {
  if (!isMockSmsEnabled()) {
    return { sent: false, error: 'SMS simulado desativado' }
  }

  const phone = input.toPhone.trim()
  if (!phone) {
    return { sent: false, error: 'Cliente sem telefone' }
  }

  try {
    const message = await prisma.mockSmsMessage.create({
      data: {
        user_id: input.userId,
        client_id: input.clientId,
        appointment_id: input.appointmentId,
        to_phone: phone,
        body: input.body,
        notification_type: input.notificationType,
      },
    })

    await logAudit({
      userId: input.userId,
      operation: 'mock_sms.create',
      entity: 'MockSmsMessage',
      entityId: message.id,
    })

    console.info(
      `[sms-simulado] → ${phone} (${input.notificationType}): ${input.body.slice(0, 80)}…`
    )

    return { sent: true, id: message.id }
  } catch (err) {
    console.error('[sms-simulado] falha ao gravar:', err)
    return { sent: false, error: 'Falha ao gravar SMS simulado' }
  }
}
