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
import { z } from 'zod'
import QRCode from 'qrcode'
import { getPublicAppBaseUrl } from '@/lib/app-url'
import { ensurePublicSlug } from '@/features/public-booking/actions'
import { checkPlanLimit } from '@/lib/plan-limits'
import {
  DEFAULT_CONFIRMATION_HOURS_BEFORE,
  DEFAULT_REMINDER_HOURS_BEFORE,
  isConfirmationHoursBefore,
  isReminderHoursBefore,
  type ConfirmationHoursBefore,
  type ReminderHoursBefore,
} from '@/lib/reminder-settings'
import { notificationSettingsSchema } from '@/schemas/notification-settings.schema'
import { receiptSettingsSchema } from '@/schemas/receipt-settings.schema'

const publicProfileSchema = z.object({
  public_bio: z.string().max(500).optional(),
  public_photo_url: z.string().url().optional().or(z.literal('')),
})

export type AccountSettingsDTO = {
  name: string
  email: string
  plan: string
  plan_status: string
  trial_ends_at: string | null
  created_at: string
  onboarding_completed_at: string | null
  public_slug: string | null
  public_bio: string | null
  public_photo_url: string | null
  public_url: string | null
}

export async function getAccountSettingsAction(): Promise<AccountSettingsDTO> {
  const userId = await requireUserId()
  const publicSlug = await ensurePublicSlug(userId)

  const user = await prisma.user.findFirstOrThrow({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      plan: true,
      plan_status: true,
      trial_ends_at: true,
      created_at: true,
      onboarding_completed_at: true,
      public_slug: true,
      public_bio: true,
      public_photo_url: true,
    },
  })

  const baseUrl = getPublicAppBaseUrl()
  const publicUrl = `${baseUrl}/p/${publicSlug}`

  return {
    name: user.name,
    email: user.email,
    plan: user.plan,
    plan_status: user.plan_status,
    trial_ends_at: user.trial_ends_at?.toISOString() ?? null,
    created_at: user.created_at.toISOString(),
    onboarding_completed_at: user.onboarding_completed_at?.toISOString() ?? null,
    public_slug: publicSlug,
    public_bio: user.public_bio,
    public_photo_url: user.public_photo_url,
    public_url: publicUrl,
  }
}

export async function updatePublicProfileAction(
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId()
  const parsed = publicProfileSchema.safeParse({
    public_bio: formData.get('public_bio') || undefined,
    public_photo_url: formData.get('public_photo_url') || undefined,
  })

  if (!parsed.success) return actionError('INVALID_INPUT')

  await prisma.user.update({
    where: { id: userId },
    data: {
      public_bio: parsed.data.public_bio ?? null,
      public_photo_url: parsed.data.public_photo_url || null,
    },
  })

  const hdrs = await headers()
  await logAudit({
    userId,
    operation: 'user.update_public_profile',
    entity: 'User',
    entityId: userId,
    ipAddress: getClientIp(hdrs),
  })

  revalidatePath('/settings')
  revalidatePath('/settings/public')
  return { success: true }
}

export async function generatePublicQrCodeAction(): Promise<
  ActionResult<{ dataUrl: string }>
> {
  const userId = await requireUserId()
  const publicSlug = await ensurePublicSlug(userId)

  const baseUrl = getPublicAppBaseUrl()
  const url = `${baseUrl}/p/${publicSlug}`
  const dataUrl = await QRCode.toDataURL(url, { width: 280, margin: 2 })

  return { success: true, data: { dataUrl } }
}

export type NotificationSettingsDTO = {
  reminder_hours_before: ReminderHoursBefore
  confirmation_hours_before: ConfirmationHoursBefore
  auto_reminders_enabled: boolean
}

export async function getNotificationSettingsAction(): Promise<NotificationSettingsDTO> {
  const userId = await requireUserId()
  const [user, reminderLimit] = await Promise.all([
    prisma.user.findFirstOrThrow({
      where: { id: userId },
      select: {
        reminder_hours_before: true,
        confirmation_hours_before: true,
      },
    }),
    checkPlanLimit(userId, 'auto_reminders'),
  ])

  const reminderHours = user.reminder_hours_before
  const confirmationHours = user.confirmation_hours_before
  return {
    reminder_hours_before: isReminderHoursBefore(reminderHours)
      ? reminderHours
      : DEFAULT_REMINDER_HOURS_BEFORE,
    confirmation_hours_before: isConfirmationHoursBefore(confirmationHours)
      ? confirmationHours
      : DEFAULT_CONFIRMATION_HOURS_BEFORE,
    auto_reminders_enabled: reminderLimit.allowed,
  }
}

export async function updateNotificationSettingsAction(
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId()
  const parsed = notificationSettingsSchema.safeParse({
    reminder_hours_before: formData.get('reminder_hours_before'),
    confirmation_hours_before: formData.get('confirmation_hours_before'),
  })

  if (!parsed.success) return actionError('INVALID_INPUT')

  await prisma.user.update({
    where: { id: userId },
    data: {
      reminder_hours_before: parsed.data.reminder_hours_before,
      confirmation_hours_before: parsed.data.confirmation_hours_before,
    },
  })

  const hdrs = await headers()
  await logAudit({
    userId,
    operation: 'user.update_notification_settings',
    entity: 'User',
    entityId: userId,
    ipAddress: getClientIp(hdrs),
  })

  revalidatePath('/settings/notifications')
  return { success: true }
}

export type ReceiptSettingsDTO = {
  receipt_tax_id: string | null
  receipt_street: string | null
  receipt_address_number: string | null
  receipt_complement: string | null
  receipt_neighborhood: string | null
  receipt_city: string | null
  receipt_state: string | null
  receipt_postal_code: string | null
}

export async function getReceiptSettingsAction(): Promise<ReceiptSettingsDTO> {
  const userId = await requireUserId()
  const user = await prisma.user.findFirstOrThrow({
    where: { id: userId },
    select: {
      receipt_tax_id: true,
      receipt_street: true,
      receipt_address_number: true,
      receipt_complement: true,
      receipt_neighborhood: true,
      receipt_city: true,
      receipt_state: true,
      receipt_postal_code: true,
    },
  })

  return user
}

export async function updateReceiptSettingsAction(
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId()
  const parsed = receiptSettingsSchema.safeParse({
    receipt_tax_id: formData.get('receipt_tax_id'),
    receipt_street: formData.get('receipt_street'),
    receipt_address_number: formData.get('receipt_address_number'),
    receipt_complement: formData.get('receipt_complement'),
    receipt_neighborhood: formData.get('receipt_neighborhood'),
    receipt_city: formData.get('receipt_city'),
    receipt_state: formData.get('receipt_state'),
    receipt_postal_code: formData.get('receipt_postal_code'),
  })

  if (!parsed.success) return actionError('INVALID_INPUT')

  await prisma.user.update({
    where: { id: userId },
    data: {
      receipt_tax_id: parsed.data.receipt_tax_id ?? null,
      receipt_street: parsed.data.receipt_street ?? null,
      receipt_address_number: parsed.data.receipt_address_number ?? null,
      receipt_complement: parsed.data.receipt_complement ?? null,
      receipt_neighborhood: parsed.data.receipt_neighborhood ?? null,
      receipt_city: parsed.data.receipt_city ?? null,
      receipt_state: parsed.data.receipt_state ?? null,
      receipt_postal_code: parsed.data.receipt_postal_code ?? null,
    },
  })

  const hdrs = await headers()
  await logAudit({
    userId,
    operation: 'user.update_receipt_settings',
    entity: 'User',
    entityId: userId,
    ipAddress: getClientIp(hdrs),
  })

  revalidatePath('/settings/receipt')
  revalidatePath('/payments')
  return { success: true }
}
