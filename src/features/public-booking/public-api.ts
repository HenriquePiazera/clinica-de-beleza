'use server'

import { getPublicProfessionalBySlug } from '@/features/public-booking/actions'
import {
  getAvailableDates,
  getAvailableSlots,
} from '@/services/availability-slots.service'
import { prisma } from '@/lib/prisma'
import { resolveTimeZone } from '@/lib/timezone-datetime'

export async function fetchPublicProfessionalAction(slug: string) {
  return getPublicProfessionalBySlug(slug)
}

export async function fetchPublicSlotsAction(input: {
  slug: string
  serviceId: string
  date: string
}) {
  const user = await prisma.user.findFirst({
    where: { public_slug: input.slug },
    select: { id: true, timezone: true },
  })
  if (!user) return []

  const service = await prisma.service.findFirst({
    where: { id: input.serviceId, user_id: user.id, is_active: true },
  })
  if (!service) return []

  return getAvailableSlots(
    user.id,
    input.date,
    service.duration_minutes,
    resolveTimeZone(user.timezone)
  )
}

export async function fetchPublicDatesAction(input: {
  slug: string
  serviceId: string
}) {
  const user = await prisma.user.findFirst({
    where: { public_slug: input.slug },
    select: { id: true, timezone: true },
  })
  if (!user) return []

  const service = await prisma.service.findFirst({
    where: { id: input.serviceId, user_id: user.id, is_active: true },
  })
  if (!service) return []

  return getAvailableDates(
    user.id,
    service.duration_minutes,
    resolveTimeZone(user.timezone)
  )
}
