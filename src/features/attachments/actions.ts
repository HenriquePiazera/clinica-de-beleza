'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { encryptField, decryptField } from '@/lib/crypto'
import { logAudit } from '@/lib/audit'
import { checkPlanLimit } from '@/lib/plan-limits'
import {
  actionError,
  getClientIp,
  requireUserId,
  type ActionResult,
} from '@/lib/session'
import { uploadToStorage, deleteFromStorage } from '@/services/storage.service'

export type AttachmentDTO = {
  id: string
  client_id: string
  file_name: string
  file_type: string
  file_size_bytes: number
  uploaded_at: string
}

export async function listAttachmentsAction(
  clientId: string
): Promise<AttachmentDTO[]> {
  const userId = await requireUserId()
  const attachments = await prisma.attachment.findMany({
    where: { client_id: clientId, user_id: userId },
    orderBy: { uploaded_at: 'desc' },
  })

  return attachments.map((a) => ({
    id: a.id,
    client_id: a.client_id,
    file_name: a.file_name,
    file_type: a.file_type,
    file_size_bytes: Number(a.file_size_bytes),
    uploaded_at: a.uploaded_at.toISOString(),
  }))
}

export async function uploadAttachmentAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId()
  const clientId = String(formData.get('client_id') ?? '')
  const file = formData.get('file')

  if (!clientId || !(file instanceof File)) {
    return actionError('INVALID_INPUT')
  }

  const client = await prisma.client.findFirst({
    where: { id: clientId, user_id: userId },
  })
  if (!client) return actionError('CLIENT_NOT_FOUND')

  const limit = await checkPlanLimit(userId, 'max_storage_bytes')
  if (!limit.allowed) return actionError('PLAN_LIMIT_STORAGE')

  if (
    limit.max !== undefined &&
    limit.current !== undefined &&
    limit.current + file.size > limit.max
  ) {
    return actionError('PLAN_LIMIT_STORAGE')
  }

  try {
    const { path } = await uploadToStorage(userId, clientId, file)
    const encryptedUrl = await encryptField(path, userId)

    const attachment = await prisma.attachment.create({
      data: {
        user_id: userId,
        client_id: clientId,
        service_record_id: formData.get('service_record_id')
          ? String(formData.get('service_record_id'))
          : null,
        file_url: encryptedUrl,
        file_name: file.name,
        file_type: file.type,
        file_size_bytes: BigInt(file.size),
      },
    })

    await prisma.user.update({
      where: { id: userId },
      data: {
        storage_used_bytes: { increment: BigInt(file.size) },
      },
    })

    const hdrs = await headers()
    await logAudit({
      userId,
      operation: 'attachment.upload',
      entity: 'Attachment',
      entityId: attachment.id,
      ipAddress: getClientIp(hdrs),
    })

    revalidatePath(`/clients/${clientId}`)
    return { success: true, data: { id: attachment.id } }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro no upload'
    return { success: false, error: message }
  }
}

export async function deleteAttachmentAction(
  id: string
): Promise<ActionResult> {
  const userId = await requireUserId()
  const attachment = await prisma.attachment.findFirst({
    where: { id, user_id: userId },
  })
  if (!attachment) return actionError('INVALID_INPUT')

  const path = await decryptField(attachment.file_url, userId)

  try {
    await deleteFromStorage(path)
  } catch {
    // Storage pode não estar configurado em dev
  }

  await prisma.$transaction([
    prisma.attachment.delete({ where: { id } }),
    prisma.user.update({
      where: { id: userId },
      data: {
        storage_used_bytes: {
          decrement: attachment.file_size_bytes,
        },
      },
    }),
  ])

  const hdrs = await headers()
  await logAudit({
    userId,
    operation: 'attachment.delete',
    entity: 'Attachment',
    entityId: id,
    ipAddress: getClientIp(hdrs),
  })

  revalidatePath(`/clients/${attachment.client_id}`)
  return { success: true }
}
