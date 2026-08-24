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
import { clinicReviewSchema } from '@/schemas/clinic-review.schema'

export type ClinicReviewDTO = {
  id: string
  author_name: string
  rating: number
  message: string
  allow_publish: boolean
  show_on_landing: boolean
  status: string
  created_at: string
  moderated_at: string | null
}

const rateLimitByIp = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const RATE_LIMIT_MAX = 5

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitByIp.get(ip)
  if (!entry || entry.resetAt <= now) {
    rateLimitByIp.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count += 1
  return true
}

async function resolveClinicOwnerId(): Promise<string | null> {
  const fromEnv = (process.env.PLATFORM_OWNER_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)[0]
  const email = fromEnv || 'mariana@clinica-mariana.local'
  const owner = await prisma.user.findFirst({
    where: { email },
    select: { id: true },
  })
  return owner?.id ?? null
}

function toDTO(row: {
  id: string
  author_name: string
  rating: number
  message: string
  allow_publish: boolean
  show_on_landing: boolean
  status: string
  created_at: Date
  moderated_at: Date | null
}): ClinicReviewDTO {
  return {
    id: row.id,
    author_name: row.author_name,
    rating: row.rating,
    message: row.message,
    allow_publish: row.allow_publish,
    show_on_landing: row.show_on_landing,
    status: row.status,
    created_at: row.created_at.toISOString(),
    moderated_at: row.moderated_at?.toISOString() ?? null,
  }
}

export async function createClinicReviewAction(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const hdrs = await headers()
  const ip = getClientIp(hdrs) ?? 'unknown'
  if (!checkRateLimit(ip)) return actionError('REVIEW_RATE_LIMIT')

  const parsed = clinicReviewSchema.safeParse({
    author_name: formData.get('author_name'),
    rating: formData.get('rating'),
    message: formData.get('message'),
    allow_publish: formData.get('allow_publish') ?? 'false',
  })
  if (!parsed.success) return actionError('INVALID_INPUT')

  const review = await prisma.clinicReview.create({
    data: {
      author_name: parsed.data.author_name,
      rating: parsed.data.rating,
      message: parsed.data.message,
      allow_publish: parsed.data.allow_publish,
      show_on_landing: false,
      status: 'pending',
    },
  })

  const ownerId = await resolveClinicOwnerId()
  if (ownerId) {
    await logAudit({
      userId: ownerId,
      operation: 'clinic_review.create',
      entity: 'ClinicReview',
      entityId: review.id,
      ipAddress: ip === 'unknown' ? undefined : ip,
    })
  }

  revalidatePath('/feedback')
  revalidatePath('/avaliar')
  return { success: true, data: { id: review.id } }
}

export async function listClinicReviewsAction(): Promise<ClinicReviewDTO[]> {
  await requireUserId()
  const rows = await prisma.clinicReview.findMany({
    orderBy: [{ status: 'asc' }, { created_at: 'desc' }],
  })
  return rows.map(toDTO)
}

export async function setReviewLandingVisibilityAction(
  id: string,
  showOnLanding: boolean
): Promise<ActionResult> {
  const userId = await requireUserId()
  const existing = await prisma.clinicReview.findFirst({ where: { id } })
  if (!existing) return actionError('REVIEW_NOT_FOUND')

  if (showOnLanding && !existing.allow_publish) {
    return actionError('INVALID_INPUT')
  }

  await prisma.clinicReview.update({
    where: { id },
    data: {
      show_on_landing: showOnLanding,
      status: showOnLanding ? 'published' : existing.status === 'archived' ? 'archived' : 'published',
      moderated_by: userId,
      moderated_at: new Date(),
    },
  })

  const hdrs = await headers()
  await logAudit({
    userId,
    operation: showOnLanding
      ? 'clinic_review.publish'
      : 'clinic_review.unpublish',
    entity: 'ClinicReview',
    entityId: id,
    ipAddress: getClientIp(hdrs),
  })

  revalidatePath('/feedback')
  revalidatePath('/')
  revalidatePath('/landing')
  return { success: true }
}

export async function archiveClinicReviewAction(
  id: string
): Promise<ActionResult> {
  const userId = await requireUserId()
  const existing = await prisma.clinicReview.findFirst({ where: { id } })
  if (!existing) return actionError('REVIEW_NOT_FOUND')

  await prisma.clinicReview.update({
    where: { id },
    data: {
      status: 'archived',
      show_on_landing: false,
      moderated_by: userId,
      moderated_at: new Date(),
    },
  })

  const hdrs = await headers()
  await logAudit({
    userId,
    operation: 'clinic_review.archive',
    entity: 'ClinicReview',
    entityId: id,
    ipAddress: getClientIp(hdrs),
  })

  revalidatePath('/feedback')
  revalidatePath('/')
  revalidatePath('/landing')
  return { success: true }
}
