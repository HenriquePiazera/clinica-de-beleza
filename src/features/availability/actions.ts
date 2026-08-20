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
import { availabilitySchema } from '@/schemas/availability.schema'

export type AvailabilityDTO = {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}

export async function listAvailabilityAction(): Promise<AvailabilityDTO[]> {
  const userId = await requireUserId()
  const rows = await prisma.availability.findMany({
    where: { user_id: userId },
    orderBy: [{ day_of_week: 'asc' }, { start_time: 'asc' }],
  })
  return rows
}

export async function createAvailabilityAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId()
  const parsed = availabilitySchema.safeParse({
    day_of_week: formData.get('day_of_week'),
    start_time: formData.get('start_time'),
    end_time: formData.get('end_time'),
    is_active: formData.get('is_active') === 'on' || formData.get('is_active') === 'true',
  })

  if (!parsed.success) {
    return actionError('INVALID_INPUT')
  }

  const row = await prisma.availability.create({
    data: {
      user_id: userId,
      day_of_week: parsed.data.day_of_week,
      start_time: parsed.data.start_time,
      end_time: parsed.data.end_time,
      is_active: parsed.data.is_active ?? true,
    },
  })

  const hdrs = await headers()
  await logAudit({
    userId,
    operation: 'availability.create',
    entity: 'Availability',
    entityId: row.id,
    ipAddress: getClientIp(hdrs),
  })

  revalidatePath('/settings/availability')
  return { success: true, data: { id: row.id } }
}

export async function updateAvailabilityAction(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId()
  const existing = await prisma.availability.findFirst({
    where: { id, user_id: userId },
  })
  if (!existing) {
    return actionError('INVALID_INPUT')
  }

  const parsed = availabilitySchema.safeParse({
    day_of_week: formData.get('day_of_week'),
    start_time: formData.get('start_time'),
    end_time: formData.get('end_time'),
    is_active: formData.get('is_active') === 'on' || formData.get('is_active') === 'true',
  })

  if (!parsed.success) {
    return actionError('INVALID_INPUT')
  }

  await prisma.availability.update({
    where: { id },
    data: {
      day_of_week: parsed.data.day_of_week,
      start_time: parsed.data.start_time,
      end_time: parsed.data.end_time,
      is_active: parsed.data.is_active ?? true,
    },
  })

  const hdrs = await headers()
  await logAudit({
    userId,
    operation: 'availability.update',
    entity: 'Availability',
    entityId: id,
    ipAddress: getClientIp(hdrs),
  })

  revalidatePath('/settings/availability')
  return { success: true }
}

export async function deleteAvailabilityAction(id: string): Promise<ActionResult> {
  const userId = await requireUserId()
  const existing = await prisma.availability.findFirst({
    where: { id, user_id: userId },
  })
  if (!existing) {
    return actionError('INVALID_INPUT')
  }

  await prisma.availability.delete({ where: { id } })

  const hdrs = await headers()
  await logAudit({
    userId,
    operation: 'availability.delete',
    entity: 'Availability',
    entityId: id,
    ipAddress: getClientIp(hdrs),
  })

  revalidatePath('/settings/availability')
  return { success: true }
}
