import { getAppBaseUrlSync, isLocalAppBaseUrl } from '@/lib/app-url'
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
  const apiKey = process.env.RESEND_API_KEY?.trim()
  return Boolean(apiKey && !apiKey.includes('placeholder'))
}

function buildResendFromHeader(fromEmail: string): string {
  // Remetente ASCII simples: Outlook/filtro costuma rejeitar display name
  // com acentos no domínio de teste onboarding@resend.dev.
  const displayName =
    process.env.RESEND_FROM_NAME?.trim() || 'Clinica Mariana Oliveira'
  return `${displayName.replace(/[<>"]/g, '')} <${fromEmail}>`
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

  const apiKey = process.env.RESEND_API_KEY!.trim()
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() || 'onboarding@resend.dev'
  const recipients = to.map((addr) => addr.trim()).filter(Boolean)

  if (recipients.length === 0) {
    return { sent: false, error: 'Destinatário de e-mail vazio' }
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: buildResendFromHeader(from),
      to: recipients,
      subject,
      html,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    const error = body || response.statusText
    console.error('[resend] falha ao enviar:', response.status, error)
    if (
      response.status === 403 &&
      error.includes('only send testing emails to your own email')
    ) {
      return {
        sent: false,
        error:
          'Resend em modo teste: só envia para o e-mail da conta Resend. Verifique um domínio em resend.com/domains ou use esse e-mail no cadastro do cliente.',
      }
    }
    return { sent: false, error }
  }

  const payload = (await response.json().catch(() => null)) as {
    id?: string
  } | null
  console.info(
    `[resend] enviado id=${payload?.id ?? '?'} → ${recipients.join(', ')}`
  )
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
    day: '2-digit',
    month: '2-digit',
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

function confirmButtonHtml(
  confirmUrl: string | undefined,
  label = 'Confirmar agendamento'
): string {
  if (!confirmUrl) return ''
  return `<p><a href="${confirmUrl}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;">${label}</a></p>`
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
  // Links localhost no rodapé fazem Outlook atrasar/filtrar o e-mail.
  const footer = isLocalAppBaseUrl(appUrl)
    ? `<p style="margin-top: 24px; color: #666; font-size: 12px;">Enviado por ${APP_NAME}</p>`
    : `<p style="margin-top: 24px; color: #666; font-size: 12px;">Enviado por ${APP_NAME} — <a href="${appUrl}">${appUrl}</a></p>`
  const html = `
    <div style="font-family: sans-serif; max-width: 560px;">
      ${bodyHtml}
      ${footer}
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
  confirmUrl?: string
}): Promise<{ sent: boolean; error?: string }> {
  return sendAppointmentEmail({
    to: input.to,
    subject: `Confirme seu agendamento — ${input.professionalName}`,
    bodyHtml: `
      <h2>Olá, ${input.clientName}!</h2>
      <p>Seu agendamento foi solicitado com <strong>${input.professionalName}</strong>.</p>
      <p><strong>Serviço:</strong> ${input.serviceName}</p>
      <p><strong>Data e hora:</strong> ${formatAppointmentDateTime(input.startTime)}</p>
      ${confirmButtonHtml(input.confirmUrl)}
    `,
  })
}

export async function sendConfirmationFollowUpEmail(input: {
  to: string
  clientName: string
  professionalName: string
  serviceName: string
  startTime: Date
  confirmUrl?: string
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
      ${confirmButtonHtml(input.confirmUrl)}
    `,
  })
}

export async function sendScheduledEmail(input: {
  to: string
  clientName: string
  professionalName: string
  serviceName: string
  startTime: Date
  confirmUrl?: string
}): Promise<{ sent: boolean; error?: string }> {
  return sendAppointmentEmail({
    to: input.to,
    subject: `Agendamento registrado — ${input.professionalName}`,
    bodyHtml: `
      <h2>Olá, ${input.clientName}!</h2>
      <p>Seu agendamento com <strong>${input.professionalName}</strong> foi registrado.</p>
      <p><strong>Serviço:</strong> ${input.serviceName}</p>
      <p><strong>Data e hora:</strong> ${formatAppointmentDateTime(input.startTime)}</p>
      ${confirmButtonHtml(input.confirmUrl)}
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
  return sendAppointmentEmail({
    to: input.to,
    subject: `Lembrete: atendimento ${leadText} — ${input.professionalName}`,
    bodyHtml: `
      <h2>Olá, ${input.clientName}!</h2>
      <p>Passando para lembrar do seu atendimento ${leadText} com <strong>${input.professionalName}</strong>.</p>
      <p><strong>Serviço:</strong> ${input.serviceName}</p>
      <p><strong>Data e hora:</strong> ${formatAppointmentDateTime(input.startTime)}</p>
      ${confirmButtonHtml(input.confirmUrl, 'Confirmar presença')}
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
  return sendAppointmentEmail({
    to: input.to,
    subject: `Horário alterado — ${input.professionalName}`,
    bodyHtml: `
      <h2>Olá, ${input.clientName}</h2>
      <p>Seu agendamento com <strong>${input.professionalName}</strong> teve o horário alterado.</p>
      <p><strong>Serviço:</strong> ${input.serviceName}</p>
      <p><strong>Novo horário:</strong> ${formatAppointmentDateTime(input.startTime)}</p>
      ${confirmButtonHtml(input.confirmUrl, 'Confirmar novo horário')}
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
