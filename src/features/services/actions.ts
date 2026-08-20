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
import { serviceSchema } from '@/schemas/service.schema'
import {
  resolveServicePhotoUrl,
  isStoragePhotoPath,
} from '@/lib/service-photo'
import {
  uploadServicePhoto,
  deleteFromStorage,
} from '@/services/storage.service'

export type ServiceDTO = {
  id: string
  name: string
  description: string | null
  photo_url: string | null
  photo_display_url: string | null
  duration_minutes: number
  price: number | null
  is_active: boolean
  sort_order: number
}

function toServiceDTO(service: {
  id: string
  name: string
  description: string | null
  photo_url: string | null
  duration_minutes: number
  price: { toNumber(): number } | null
  is_active: boolean
  sort_order: number
}): ServiceDTO {
  return {
    id: service.id,
    name: service.name,
    description: service.description,
    photo_url: service.photo_url,
    photo_display_url: resolveServicePhotoUrl(service.id, service.photo_url),
    duration_minutes: service.duration_minutes,
    price: service.price ? service.price.toNumber() : null,
    is_active: service.is_active,
    sort_order: service.sort_order,
  }
}

async function resolvePhotoFromForm(
  userId: string,
  serviceId: string,
  formData: FormData,
  existingPhotoUrl: string | null = null
): Promise<string | null> {
  const photoFile = formData.get('photo')
  const photoUrlInput = String(formData.get('photo_url') ?? '').trim()

  if (photoFile instanceof File && photoFile.size > 0) {
    const { path } = await uploadServicePhoto(userId, serviceId, photoFile)
    if (existingPhotoUrl && isStoragePhotoPath(existingPhotoUrl)) {
      try {
        await deleteFromStorage(existingPhotoUrl)
      } catch {
        // storage opcional em dev
      }
    }
    return path
  }

  if (photoUrlInput) {
    if (existingPhotoUrl && isStoragePhotoPath(existingPhotoUrl)) {
      try {
        await deleteFromStorage(existingPhotoUrl)
      } catch {
        // storage opcional em dev
      }
    }
    return photoUrlInput
  }

  const removePhoto =
    formData.get('remove_photo') === 'on' ||
    formData.get('remove_photo') === 'true'
  if (removePhoto) {
    if (existingPhotoUrl && isStoragePhotoPath(existingPhotoUrl)) {
      try {
        await deleteFromStorage(existingPhotoUrl)
      } catch {
        // storage opcional em dev
      }
    }
    return null
  }

  return existingPhotoUrl
}

export async function listServicesAction(): Promise<ServiceDTO[]> {
  const userId = await requireUserId()
  const services = await prisma.service.findMany({
    where: { user_id: userId },
    orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
  })
  return services.map(toServiceDTO)
}

export async function getServiceAction(id: string): Promise<ServiceDTO | null> {
  const userId = await requireUserId()
  const service = await prisma.service.findFirst({
    where: { id, user_id: userId },
  })
  return service ? toServiceDTO(service) : null
}

export async function createServiceAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId()
  const parsed = serviceSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    photo_url: formData.get('photo_url') || undefined,
    duration_minutes: formData.get('duration_minutes'),
    price: formData.get('price') || undefined,
    is_active:
      formData.get('is_active') === 'on' || formData.get('is_active') === 'true',
    sort_order: formData.get('sort_order') || 0,
  })

  if (!parsed.success) {
    return actionError('INVALID_INPUT')
  }

  const service = await prisma.service.create({
    data: {
      user_id: userId,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      duration_minutes: parsed.data.duration_minutes,
      price: parsed.data.price ?? null,
      is_active: parsed.data.is_active ?? true,
      sort_order: parsed.data.sort_order ?? 0,
    },
  })

  try {
    const photoUrl = await resolvePhotoFromForm(userId, service.id, formData)
    if (photoUrl !== null) {
      await prisma.service.update({
        where: { id: service.id },
        data: { photo_url: photoUrl },
      })
    }
  } catch (error) {
    await prisma.service.delete({ where: { id: service.id } })
    const message = error instanceof Error ? error.message : 'Erro no upload'
    return { success: false, error: message }
  }

  const hdrs = await headers()
  await logAudit({
    userId,
    operation: 'service.create',
    entity: 'Service',
    entityId: service.id,
    ipAddress: getClientIp(hdrs),
  })

  revalidatePath('/settings/services')
  return { success: true, data: { id: service.id } }
}

export async function updateServiceAction(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId()
  const existing = await prisma.service.findFirst({
    where: { id, user_id: userId },
  })
  if (!existing) {
    return actionError('INVALID_INPUT')
  }

  const parsed = serviceSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    photo_url: formData.get('photo_url') || undefined,
    duration_minutes: formData.get('duration_minutes'),
    price: formData.get('price') || undefined,
    is_active:
      formData.get('is_active') === 'on' || formData.get('is_active') === 'true',
    sort_order: formData.get('sort_order') || 0,
  })

  if (!parsed.success) {
    return actionError('INVALID_INPUT')
  }

  let photoUrl = existing.photo_url
  try {
    photoUrl = await resolvePhotoFromForm(
      userId,
      id,
      formData,
      existing.photo_url
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro no upload'
    return { success: false, error: message }
  }

  await prisma.service.update({
    where: { id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      photo_url: photoUrl,
      duration_minutes: parsed.data.duration_minutes,
      price: parsed.data.price ?? null,
      is_active: parsed.data.is_active ?? true,
      sort_order: parsed.data.sort_order ?? 0,
    },
  })

  const hdrs = await headers()
  await logAudit({
    userId,
    operation: 'service.update',
    entity: 'Service',
    entityId: id,
    ipAddress: getClientIp(hdrs),
  })

  revalidatePath('/settings/services')
  revalidatePath(`/settings/services/${id}`)
  return { success: true }
}

export async function deleteServiceAction(id: string): Promise<ActionResult> {
  const userId = await requireUserId()
  const existing = await prisma.service.findFirst({
    where: { id, user_id: userId },
  })
  if (!existing) {
    return actionError('INVALID_INPUT')
  }

  if (existing.photo_url && isStoragePhotoPath(existing.photo_url)) {
    try {
      await deleteFromStorage(existing.photo_url)
    } catch {
      // storage opcional em dev
    }
  }

  await prisma.service.delete({ where: { id } })

  const hdrs = await headers()
  await logAudit({
    userId,
    operation: 'service.delete',
    entity: 'Service',
    entityId: id,
    ipAddress: getClientIp(hdrs),
  })

  revalidatePath('/settings/services')
  return { success: true }
}
