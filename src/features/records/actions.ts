'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { encryptField, decryptField } from '@/lib/crypto'
import { logAudit } from '@/lib/audit'
import {
  actionError,
  getClientIp,
  requireUserId,
  type ActionResult,
} from '@/lib/session'
import { serviceRecordSchema } from '@/schemas/record.schema'

export type ServiceRecordDTO = {
  id: string
  appointment_id: string
  client_id: string
  client_name: string
  description: string
  evolution: string | null
  created_at: string
}

export async function getRecordAction(
  id: string
): Promise<ServiceRecordDTO | null> {
  const userId = await requireUserId()
  const record = await prisma.serviceRecord.findFirst({
    where: { id, user_id: userId },
    include: { client: { select: { name: true } } },
  })

  if (!record) return null

  return {
    id: record.id,
    appointment_id: record.appointment_id,
    client_id: record.client_id,
    client_name: record.client.name,
    description: await decryptField(record.description, userId),
    evolution: record.evolution
      ? await decryptField(record.evolution, userId)
      : null,
    created_at: record.created_at.toISOString(),
  }
}

export async function listRecordsAction(): Promise<ServiceRecordDTO[]> {
  const userId = await requireUserId()
  const records = await prisma.serviceRecord.findMany({
    where: { user_id: userId },
    include: { client: { select: { name: true } } },
    orderBy: { created_at: 'desc' },
  })

  return Promise.all(
    records.map(async (r) => ({
      id: r.id,
      appointment_id: r.appointment_id,
      client_id: r.client_id,
      client_name: r.client.name,
      description: await decryptField(r.description, userId),
      evolution: r.evolution
        ? await decryptField(r.evolution, userId)
        : null,
      created_at: r.created_at.toISOString(),
    }))
  )
}

export async function createRecordAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId()
  const parsed = serviceRecordSchema.safeParse({
    appointment_id: formData.get('appointment_id'),
    client_id: formData.get('client_id'),
    description: formData.get('description'),
    evolution: formData.get('evolution') || undefined,
  })

  if (!parsed.success) return actionError('INVALID_INPUT')

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: parsed.data.appointment_id,
      user_id: userId,
      client_id: parsed.data.client_id,
    },
  })
  if (!appointment) return actionError('APPOINTMENT_NOT_FOUND')

  const description = await encryptField(parsed.data.description, userId)
  const evolution = parsed.data.evolution
    ? await encryptField(parsed.data.evolution, userId)
    : null

  const record = await prisma.serviceRecord.create({
    data: {
      user_id: userId,
      appointment_id: parsed.data.appointment_id,
      client_id: parsed.data.client_id,
      description,
      evolution,
    },
  })

  const hdrs = await headers()
  await logAudit({
    userId,
    operation: 'record.create',
    entity: 'ServiceRecord',
    entityId: record.id,
    ipAddress: getClientIp(hdrs),
  })

  revalidatePath('/records')
  return { success: true, data: { id: record.id } }
}

export async function updateRecordAction(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId()
  const existing = await prisma.serviceRecord.findFirst({
    where: { id, user_id: userId },
  })
  if (!existing) return actionError('RECORD_NOT_FOUND')

  const parsed = serviceRecordSchema.safeParse({
    appointment_id: formData.get('appointment_id'),
    client_id: formData.get('client_id'),
    description: formData.get('description'),
    evolution: formData.get('evolution') || undefined,
  })

  if (!parsed.success) return actionError('INVALID_INPUT')

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: parsed.data.appointment_id,
      user_id: userId,
      client_id: parsed.data.client_id,
    },
  })
  if (!appointment) return actionError('APPOINTMENT_NOT_FOUND')

  const description = await encryptField(parsed.data.description, userId)
  const evolution = parsed.data.evolution
    ? await encryptField(parsed.data.evolution, userId)
    : null

  await prisma.serviceRecord.update({
    where: { id },
    data: {
      appointment_id: parsed.data.appointment_id,
      client_id: parsed.data.client_id,
      description,
      evolution,
    },
  })

  const hdrs = await headers()
  await logAudit({
    userId,
    operation: 'record.update',
    entity: 'ServiceRecord',
    entityId: id,
    ipAddress: getClientIp(hdrs),
  })

  revalidatePath('/records')
  revalidatePath(`/records/${id}`)
  return { success: true }
}

export async function deleteRecordAction(id: string): Promise<ActionResult> {
  const userId = await requireUserId()
  const existing = await prisma.serviceRecord.findFirst({
    where: { id, user_id: userId },
  })
  if (!existing) return actionError('RECORD_NOT_FOUND')

  await prisma.serviceRecord.delete({ where: { id } })

  const hdrs = await headers()
  await logAudit({
    userId,
    operation: 'record.delete',
    entity: 'ServiceRecord',
    entityId: id,
    ipAddress: getClientIp(hdrs),
  })

  revalidatePath('/records')
  return { success: true }
}
