'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { sendFeedbackNotificationEmail } from '@/services/email.service'
import {
  actionError,
  requireUserId,
  type ActionResult,
} from '@/lib/session'
import { feedbackSchema } from '@/schemas/feedback.schema'

export async function submitFeedbackAction(
  _prevState: ActionResult<{ emailSent: boolean; emailError?: string }> | null,
  formData: FormData
): Promise<ActionResult<{ emailSent: boolean; emailError?: string }>> {
  const userId = await requireUserId()
  const parsed = feedbackSchema.safeParse({
    nps_score: formData.get('nps_score'),
    category: formData.get('category'),
    message: formData.get('message'),
    can_contact: formData.get('can_contact') ?? 'false',
  })

  if (!parsed.success) {
    return actionError('INVALID_INPUT')
  }

  const user = await prisma.user.findFirstOrThrow({
    where: { id: userId },
    select: { name: true, email: true },
  })

  await prisma.userFeedback.create({
    data: {
      user_id: userId,
      nps_score: parsed.data.nps_score,
      category: parsed.data.category,
      message: parsed.data.message,
      can_contact: parsed.data.can_contact,
    },
  })

  await logAudit({
    userId,
    operation: 'feedback.create',
    entity: 'UserFeedback',
    entityId: userId,
  })

  const emailResult = await sendFeedbackNotificationEmail({
    userName: user.name,
    userEmail: user.email,
    npsScore: parsed.data.nps_score,
    category: parsed.data.category,
    message: parsed.data.message,
    canContact: parsed.data.can_contact,
  })

  revalidatePath('/feedback')
  revalidatePath('/internal')
  revalidatePath('/internal/feedbacks')

  if (!emailResult.sent) {
    return {
      success: true,
      data: {
        emailSent: false,
        emailError: emailResult.error,
      },
    }
  }

  return {
    success: true,
    data: { emailSent: true },
  }
}
