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
import { clientSchema } from '@/schemas/client.schema'

export type ClientDTO = {
  id: string
  name: string
  phone: string
  email: string | null
  birth_date: string | null
  notes: string | null
}

async function toClientDTO(
  client: {
    id: string
    name: string
    phone: string
    email: string | null
    birth_date: Date | null
    notes: string | null
  },
  userId: string
): Promise<ClientDTO> {
  return {
    id: client.id,
    name: client.name,
    phone: client.phone,
    email: client.email,
    birth_date: client.birth_date?.toISOString().split('T')[0] ?? null,
    notes: client.notes ? await decryptField(client.notes, userId) : null,
  }
}

export async function listClientsAction(): Promise<ClientDTO[]> {
  const userId = await requireUserId()
  const clients = await prisma.client.findMany({
    where: { user_id: userId },
    orderBy: { name: 'asc' },
  })
  return Promise.all(clients.map((c) => toClientDTO(c, userId)))
}

export async function getClientAction(id: string): Promise<ClientDTO | null> {
  const userId = await requireUserId()
  const client = await prisma.client.findFirst({
    where: { id, user_id: userId },
  })
  if (!client) return null
  return toClientDTO(client, userId)
}

export async function createClientAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId()
  const parsed = clientSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email') || undefined,
    birth_date: formData.get('birth_date') || undefined,
    notes: formData.get('notes') || undefined,
  })

  if (!parsed.success) {
    return actionError('INVALID_INPUT')
  }

  const limit = await checkPlanLimit(userId, 'max_clients')
  if (!limit.allowed) {
    return actionError('PLAN_LIMIT_CLIENTS')
  }

  const notes = parsed.data.notes
    ? await encryptField(parsed.data.notes, userId)
    : null

  const client = await prisma.client.create({
    data: {
      user_id: userId,
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      birth_date: parsed.data.birth_date
        ? new Date(parsed.data.birth_date)
        : null,
      notes,
    },
  })

  const hdrs = await headers()
  await logAudit({
    userId,
    operation: 'client.create',
    entity: 'Client',
    entityId: client.id,
    ipAddress: getClientIp(hdrs),
  })

  revalidatePath('/clients')
  return { success: true, data: { id: client.id } }
}

export async function updateClientAction(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId()
  const existing = await prisma.client.findFirst({
    where: { id, user_id: userId },
  })
  if (!existing) return actionError('CLIENT_NOT_FOUND')

  const parsed = clientSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email') || undefined,
    birth_date: formData.get('birth_date') || undefined,
    notes: formData.get('notes') || undefined,
  })

  if (!parsed.success) return actionError('INVALID_INPUT')

  const notes = parsed.data.notes
    ? await encryptField(parsed.data.notes, userId)
    : null

  await prisma.client.update({
    where: { id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      birth_date: parsed.data.birth_date
        ? new Date(parsed.data.birth_date)
        : null,
      notes,
    },
  })

  const hdrs = await headers()
  await logAudit({
    userId,
    operation: 'client.update',
    entity: 'Client',
    entityId: id,
    ipAddress: getClientIp(hdrs),
  })

  revalidatePath('/clients')
  revalidatePath(`/clients/${id}`)
  return { success: true }
}

export async function deleteClientAction(id: string): Promise<ActionResult> {
  const userId = await requireUserId()
  const existing = await prisma.client.findFirst({
    where: { id, user_id: userId },
  })
  if (!existing) return actionError('CLIENT_NOT_FOUND')

  await prisma.client.delete({ where: { id } })

  const hdrs = await headers()
  await logAudit({
    userId,
    operation: 'client.delete',
    entity: 'Client',
    entityId: id,
    ipAddress: getClientIp(hdrs),
  })

  revalidatePath('/clients')
  return { success: true }
}
