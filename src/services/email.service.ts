import { getAppBaseUrlSync } from '@/lib/app-url'
import { getPlatformOwnerEmails } from '@/lib/platform-owner'
import { FEEDBACK_CATEGORY_LABELS } from '@/lib/labels'
import { APP_NAME } from '@/lib/brand'

type SendFeedbackNotificationInput = {
  userName: string
  userEmail: string
  npsScore: number
  category: string
  message: string
  canContact: boolean
}

export function isResendConfigured(): boolean {
  const apiKey = process.env.RESEND_API_KEY
  return Boolean(apiKey && !apiKey.includes('placeholder'))
}

async function sendResendEmail({
  to,
  subject,
  html,
}: {
  to: string[]
  subject: string
  html: string
}): Promise<{ sent: boolean; error?: string }> {
  if (!isResendConfigured()) {
    return { sent: false, error: 'RESEND_API_KEY não configurada' }
  }

  const from =
    process.env.RESEND_FROM_EMAIL?.trim() || 'onboarding@resend.dev'

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${APP_NAME} <${from}>`,
      to,
      subject,
      html,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    return { sent: false, error: body || response.statusText }
  }

  return { sent: true }
}

export async function sendFeedbackNotificationEmail(
  input: SendFeedbackNotificationInput
): Promise<{ sent: boolean; error?: string }> {
  const owners = getPlatformOwnerEmails()
  if (owners.length === 0) {
    return { sent: false, error: 'PLATFORM_OWNER_EMAILS não configurado' }
  }

  const categoryLabel =
    FEEDBACK_CATEGORY_LABELS[input.category] ?? input.category
  const appUrl = getAppBaseUrlSync()
  const subject = `Novo feedback — NPS ${input.npsScore} (${categoryLabel})`

  const html = `
    <h2>Novo feedback recebido</h2>
    <p><strong>Usuário:</strong> ${input.userName} (${input.userEmail})</p>
    <p><strong>NPS:</strong> ${input.npsScore}/10</p>
    <p><strong>Categoria:</strong> ${categoryLabel}</p>
    <p><strong>Pode contatar:</strong> ${input.canContact ? 'Sim' : 'Não'}</p>
    <p><strong>Mensagem:</strong></p>
    <p>${input.message.replace(/\n/g, '<br>')}</p>
    <p><a href="${appUrl}/internal/feedbacks">Ver no painel interno</a></p>
  `

  return sendResendEmail({
    to: owners,
    subject,
    html,
  })
}

function formatAppointmentDateTime(date: Date): string {
  return date.toLocaleString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export async function sendTransactionalEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}): Promise<{ sent: boolean; error?: string }> {
  return sendResendEmail({ to: [to], subject, html })
}

export async function sendAppointmentEmail({
  to,
  subject,
  bodyHtml,
}: {
  to: string
  subject: string
  bodyHtml: string
}): Promise<{ sent: boolean; error?: string }> {
  const appUrl = getAppBaseUrlSync()
  const html = `
    <div style="font-family: sans-serif; max-width: 560px;">
      ${bodyHtml}
      <p style="margin-top: 24px; color: #666; font-size: 12px;">
        Enviado por ${APP_NAME} — <a href="${appUrl}">${appUrl}</a>
      </p>
    </div>
  `
  return sendTransactionalEmail({ to, subject, html })
}

export async function sendConfirmationEmail(input: {
  to: string
  clientName: string
  professionalName: string
  serviceName: string
  startTime: Date
  confirmUrl: string
}): Promise<{ sent: boolean; error?: string }> {
  return sendAppointmentEmail({
    to: input.to,
    subject: `Confirme seu agendamento — ${input.professionalName}`,
    bodyHtml: `
      <h2>Olá, ${input.clientName}!</h2>
      <p>Seu agendamento foi solicitado com <strong>${input.professionalName}</strong>.</p>
      <p><strong>Serviço:</strong> ${input.serviceName}</p>
      <p><strong>Data e hora:</strong> ${formatAppointmentDateTime(input.startTime)}</p>
      <p><a href="${input.confirmUrl}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;">Confirmar agendamento</a></p>
    `,
  })
}

export async function sendConfirmationFollowUpEmail(input: {
  to: string
  clientName: string
  professionalName: string
  serviceName: string
  startTime: Date
  confirmUrl: string
  hoursBefore: number
}): Promise<{ sent: boolean; error?: string }> {
  const leadText =
    input.hoursBefore === 1
      ? 'em 1 hora'
      : input.hoursBefore === 24
        ? 'amanhã'
        : `em ${input.hoursBefore} horas`

  return sendAppointmentEmail({
    to: input.to,
    subject: `Confirme presença — atendimento ${leadText}`,
    bodyHtml: `
      <h2>Olá, ${input.clientName}!</h2>
      <p>Seu atendimento com <strong>${input.professionalName}</strong> é ${leadText} e ainda aguarda confirmação.</p>
      <p><strong>Serviço:</strong> ${input.serviceName}</p>
      <p><strong>Data e hora:</strong> ${formatAppointmentDateTime(input.startTime)}</p>
      <p><a href="${input.confirmUrl}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;">Confirmar agendamento</a></p>
    `,
  })
}

export async function sendScheduledEmail(input: {
  to: string
  clientName: string
  professionalName: string
  serviceName: string
  startTime: Date
}): Promise<{ sent: boolean; error?: string }> {
  return sendAppointmentEmail({
    to: input.to,
    subject: `Agendamento confirmado — ${input.professionalName}`,
    bodyHtml: `
      <h2>Olá, ${input.clientName}!</h2>
      <p>Seu agendamento com <strong>${input.professionalName}</strong> foi registrado.</p>
      <p><strong>Serviço:</strong> ${input.serviceName}</p>
      <p><strong>Data e hora:</strong> ${formatAppointmentDateTime(input.startTime)}</p>
    `,
  })
}

export async function sendReminderEmail(input: {
  to: string
  clientName: string
  professionalName: string
  serviceName: string
  startTime: Date
  confirmUrl?: string
  hoursBefore?: number
}): Promise<{ sent: boolean; error?: string }> {
  const leadText =
    input.hoursBefore === 1
      ? 'em 1 hora'
      : input.hoursBefore === 24
        ? 'amanhã'
        : input.hoursBefore
          ? `em ${input.hoursBefore} horas`
          : 'em breve'
  const confirmBlock = input.confirmUrl
    ? `<p><a href="${input.confirmUrl}">Confirmar presença</a></p>`
    : ''
  return sendAppointmentEmail({
    to: input.to,
    subject: `Lembrete: atendimento ${leadText} — ${input.professionalName}`,
    bodyHtml: `
      <h2>Olá, ${input.clientName}!</h2>
      <p>Passando para lembrar do seu atendimento ${leadText} com <strong>${input.professionalName}</strong>.</p>
      <p><strong>Serviço:</strong> ${input.serviceName}</p>
      <p><strong>Data e hora:</strong> ${formatAppointmentDateTime(input.startTime)}</p>
      ${confirmBlock}
    `,
  })
}

export async function sendCancellationEmail(input: {
  to: string
  clientName: string
  professionalName: string
  serviceName: string
  startTime: Date
}): Promise<{ sent: boolean; error?: string }> {
  return sendAppointmentEmail({
    to: input.to,
    subject: `Agendamento cancelado — ${input.professionalName}`,
    bodyHtml: `
      <h2>Olá, ${input.clientName}</h2>
      <p>Seu agendamento com <strong>${input.professionalName}</strong> foi cancelado.</p>
      <p><strong>Serviço:</strong> ${input.serviceName}</p>
      <p><strong>Data e hora:</strong> ${formatAppointmentDateTime(input.startTime)}</p>
      <p>Entre em contato para reagendar, se desejar.</p>
    `,
  })
}

export async function sendRescheduleEmail(input: {
  to: string
  clientName: string
  professionalName: string
  serviceName: string
  startTime: Date
  confirmUrl?: string
}): Promise<{ sent: boolean; error?: string }> {
  const confirmBlock = input.confirmUrl
    ? `<p><a href="${input.confirmUrl}">Confirmar novo horário</a></p>`
    : ''
  return sendAppointmentEmail({
    to: input.to,
    subject: `Horário alterado — ${input.professionalName}`,
    bodyHtml: `
      <h2>Olá, ${input.clientName}</h2>
      <p>Seu agendamento com <strong>${input.professionalName}</strong> teve o horário alterado.</p>
      <p><strong>Serviço:</strong> ${input.serviceName}</p>
      <p><strong>Novo horário:</strong> ${formatAppointmentDateTime(input.startTime)}</p>
      ${confirmBlock}
    `,
  })
}

export async function sendPasswordResetEmail(input: {
  to: string
  userName: string
  resetUrl: string
}): Promise<{ sent: boolean; error?: string }> {
  return sendTransactionalEmail({
    to: input.to,
    subject: 'Redefinir sua senha',
    html: `
      <h2>Olá, ${input.userName}!</h2>
      <p>Recebemos um pedido para redefinir sua senha.</p>
      <p><a href="${input.resetUrl}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;">Criar nova senha</a></p>
      <p style="color:#666;font-size:12px;">Se você não solicitou, ignore este e-mail. O link expira em 1 hora.</p>
    `,
  })
}

export async function sendTeamInviteEmail(input: {
  to: string
  ownerName: string
  inviteeName: string
}): Promise<{ sent: boolean; error?: string }> {
  const appUrl = getAppBaseUrlSync()
  return sendTransactionalEmail({
    to: input.to,
    subject: `${input.ownerName} convidou você para a equipe`,
    html: `
      <h2>Olá, ${input.inviteeName}!</h2>
      <p><strong>${input.ownerName}</strong> convidou você para fazer parte da equipe no ${APP_NAME}.</p>
      <p><a href="${appUrl}/settings/team">Aceitar convite</a></p>
    `,
  })
}
