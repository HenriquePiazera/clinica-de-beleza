'use server'

import { getPublicProfessionalBySlug } from '@/features/public-booking/actions'
import {
  getAvailableSlots,
  getPublicSchedule,
} from '@/services/availability-slots.service'
import { prisma } from '@/lib/prisma'
import { resolveTimeZone } from '@/lib/timezone-datetime'

async function resolvePublicService(slug: string, serviceId: string) {
  const user = await prisma.user.findFirst({
    where: { public_slug: slug },
    select: { id: true, timezone: true },
  })
  if (!user) return null

  const service = await prisma.service.findFirst({
    where: { id: serviceId, user_id: user.id, is_active: true },
    select: { duration_minutes: true },
  })
  if (!service) return null

  return {
    userId: user.id,
    timezone: resolveTimeZone(user.timezone),
    durationMinutes: service.duration_minutes,
  }
}

export async function fetchPublicProfessionalAction(slug: string) {
  return getPublicProfessionalBySlug(slug)
}

/** Datas + horários do dia em uma única ida ao servidor. */
export async function fetchPublicScheduleAction(input: {
  slug: string
  serviceId: string
  date?: string
}) {
  const ctx = await resolvePublicService(input.slug, input.serviceId)
  if (!ctx) {
    return { dates: [], slots: [], selectedDate: '' }
  }

  return getPublicSchedule(
    ctx.userId,
    ctx.durationMinutes,
    ctx.timezone,
    input.date?.trim() || undefined
  )
}

export async function fetchPublicSlotsAction(input: {
  slug: string
  serviceId: string
  date: string
}) {
  const ctx = await resolvePublicService(input.slug, input.serviceId)
  if (!ctx) return []

  return getAvailableSlots(
    ctx.userId,
    input.date,
    ctx.durationMinutes,
    ctx.timezone
  )
}

/** @deprecated Prefer fetchPublicScheduleAction */
export async function fetchPublicDatesAction(input: {
  slug: string
  serviceId: string
}) {
  const schedule = await fetchPublicScheduleAction(input)
  return schedule.dates
}
