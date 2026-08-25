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
import {
  getAccessibleTeamUserIds,
  getClinicOwnerId,
} from '@/lib/team'
import { normalizePhone } from '@/lib/phone'
import type { ClientDTO } from '@/features/clients/types'

export type { ClientDTO } from '@/features/clients/types'

export async function toClientDTO(client: {
  id: string
  user_id: string
  name: string
  phone: string
  email: string | null
  birth_date: Date | null
  notes: string | null
}): Promise<ClientDTO> {
  return {
    id: client.id,
    name: client.name,
    phone: client.phone,
    email: client.email,
    birth_date: client.birth_date?.toISOString().split('T')[0] ?? null,
    notes: client.notes
      ? await decryptField(client.notes, client.user_id)
      : null,
  }
}

export async function findClinicClientByPhone(
  clinicUserIds: string[],
  phone: string
) {
  const normalized = normalizePhone(phone)
  if (!normalized) return null

  const candidates = await prisma.client.findMany({
    where: { user_id: { in: clinicUserIds } },
    orderBy: { created_at: 'asc' },
  })

  return (
    candidates.find((c) => normalizePhone(c.phone) === normalized) ?? null
  )
}

export async function listClientsAction(): Promise<ClientDTO[]> {
  const userId = await requireUserId()
  const userIds = await getAccessibleTeamUserIds(userId)
  const clients = await prisma.client.findMany({
    where: { user_id: { in: userIds } },
    orderBy: { name: 'asc' },
  })

  // Um telefone = um cadastro na lista (mantém o mais antigo).
  const byPhone = new Map<string, (typeof clients)[number]>()
  for (const client of clients) {
    const key = normalizePhone(client.phone) || client.id
    if (!byPhone.has(key)) byPhone.set(key, client)
  }

  return Promise.all(Array.from(byPhone.values()).map((c) => toClientDTO(c)))
}

export async function getClientAction(id: string): Promise<ClientDTO | null> {
  const userId = await requireUserId()
  const userIds = await getAccessibleTeamUserIds(userId)
  const client = await prisma.client.findFirst({
    where: { id, user_id: { in: userIds } },
  })
  if (!client) return null
  return toClientDTO(client)
}

export async function createClientAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId()
  const ownerId = await getClinicOwnerId(userId)
  const clinicUserIds = await getAccessibleTeamUserIds(userId)

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

  const duplicate = await findClinicClientByPhone(
    clinicUserIds,
    parsed.data.phone
  )
  if (duplicate) {
    return actionError('CLIENT_ALREADY_EXISTS')
  }

  const limit = await checkPlanLimit(ownerId, 'max_clients')
  if (!limit.allowed) {
    return actionError('PLAN_LIMIT_CLIENTS')
  }

  const notes = parsed.data.notes
    ? await encryptField(parsed.data.notes, ownerId)
    : null

  const client = await prisma.client.create({
    data: {
      user_id: ownerId,
      name: parsed.data.name,
      phone: parsed.data.phone.trim(),
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
  const clinicUserIds = await getAccessibleTeamUserIds(userId)
  const existing = await prisma.client.findFirst({
    where: { id, user_id: { in: clinicUserIds } },
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

  const duplicate = await findClinicClientByPhone(
    clinicUserIds,
    parsed.data.phone
  )
  if (duplicate && duplicate.id !== id) {
    return actionError('CLIENT_ALREADY_EXISTS')
  }

  const notes = parsed.data.notes
    ? await encryptField(parsed.data.notes, existing.user_id)
    : null

  const birthDateRaw = formData.get('birth_date')
  const birth_date =
    birthDateRaw === null || birthDateRaw === undefined
      ? existing.birth_date
      : parsed.data.birth_date
        ? new Date(parsed.data.birth_date)
        : null

  await prisma.client.update({
    where: { id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone.trim(),
      email: parsed.data.email || null,
      birth_date,
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
  const clinicUserIds = await getAccessibleTeamUserIds(userId)
  const existing = await prisma.client.findFirst({
    where: { id, user_id: { in: clinicUserIds } },
  })
  if (!existing) return actionError('CLIENT_NOT_FOUND')

  try {
    await prisma.client.delete({ where: { id } })
  } catch (err) {
    console.error('[cliente] falha ao excluir:', err)
    return actionError('CLIENT_DELETE_FAILED')
  }

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
