'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requirePlatformOwner } from '@/lib/platform-owner'
import { actionError, type ActionResult } from '@/lib/session'
import type { FeedbackCategory, FeedbackStatus } from '@/generated/prisma/client'

export type PlatformMetricsDTO = {
  total_users: number
  active_users_7d: number
  active_users_30d: number
  onboarding_completed: number
  users_by_plan: Record<string, number>
  users_by_plan_status: Record<string, number>
  total_clients: number
  total_appointments: number
  total_payments: number
  total_feedbacks: number
  nps_score: number | null
  nps_responses: number
  new_users_this_week: number
  new_users_last_week: number
}

export type PlatformUserDTO = {
  id: string
  name: string
  email: string
  plan: string
  plan_status: string
  onboarding_completed_at: string | null
  created_at: string
  clients_count: number
  appointments_count: number
}

export type PlatformFeedbackDTO = {
  id: string
  user_name: string
  user_email: string
  nps_score: number | null
  category: FeedbackCategory
  message: string
  can_contact: boolean
  status: FeedbackStatus
  created_at: string
}

function daysAgo(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

function startOfWeek(date = new Date()): Date {
  const result = new Date(date)
  const day = result.getDay()
  const diff = day === 0 ? 6 : day - 1
  result.setDate(result.getDate() - diff)
  result.setHours(0, 0, 0, 0)
  return result
}

function calculateNps(scores: number[]): number | null {
  if (scores.length === 0) return null
  const promoters = scores.filter((score) => score >= 9).length
  const detractors = scores.filter((score) => score <= 6).length
  return Math.round(((promoters - detractors) / scores.length) * 100)
}

async function countActiveUsers(since: Date): Promise<number> {
  const rows = await prisma.auditLog.findMany({
    where: {
      operation: 'user.login',
      created_at: { gte: since },
    },
    distinct: ['user_id'],
    select: { user_id: true },
  })
  return rows.length
}

function countByField<T extends string>(
  items: Array<Record<string, T>>,
  field: keyof (typeof items)[number]
): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = String(item[field])
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})
}

export async function getPlatformMetricsAction(): Promise<PlatformMetricsDTO> {
  await requirePlatformOwner()

  const now = new Date()
  const weekStart = startOfWeek(now)
  const lastWeekStart = startOfWeek(new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000))

  const [
    total_users,
    active_users_7d,
    active_users_30d,
    onboarding_completed,
    users,
    total_clients,
    total_appointments,
    total_payments,
    total_feedbacks,
    feedbackScores,
    new_users_this_week,
    new_users_last_week,
  ] = await Promise.all([
    prisma.user.count(),
    countActiveUsers(daysAgo(7)),
    countActiveUsers(daysAgo(30)),
    prisma.user.count({ where: { onboarding_completed_at: { not: null } } }),
    prisma.user.findMany({
      select: { plan: true, plan_status: true },
    }),
    prisma.client.count(),
    prisma.appointment.count(),
    prisma.payment.count(),
    prisma.userFeedback.count(),
    prisma.userFeedback.findMany({
      where: { nps_score: { not: null } },
      select: { nps_score: true },
    }),
    prisma.user.count({ where: { created_at: { gte: weekStart } } }),
    prisma.user.count({
      where: {
        created_at: {
          gte: lastWeekStart,
          lt: weekStart,
        },
      },
    }),
  ])

  const npsScores = feedbackScores
    .map((item) => item.nps_score)
    .filter((score): score is number => score !== null)

  return {
    total_users,
    active_users_7d,
    active_users_30d,
    onboarding_completed,
    users_by_plan: countByField(users, 'plan'),
    users_by_plan_status: countByField(users, 'plan_status'),
    total_clients,
    total_appointments,
    total_payments,
    total_feedbacks,
    nps_score: calculateNps(npsScores),
    nps_responses: npsScores.length,
    new_users_this_week,
    new_users_last_week,
  }
}

export async function listPlatformUsersAction(): Promise<PlatformUserDTO[]> {
  await requirePlatformOwner()

  const users = await prisma.user.findMany({
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      plan: true,
      plan_status: true,
      onboarding_completed_at: true,
      created_at: true,
      _count: {
        select: {
          clients: true,
          appointments: true,
        },
      },
    },
  })

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    plan: user.plan,
    plan_status: user.plan_status,
    onboarding_completed_at: user.onboarding_completed_at?.toISOString() ?? null,
    created_at: user.created_at.toISOString(),
    clients_count: user._count.clients,
    appointments_count: user._count.appointments,
  }))
}

export async function listPlatformFeedbacksAction(): Promise<PlatformFeedbackDTO[]> {
  await requirePlatformOwner()

  const feedbacks = await prisma.userFeedback.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  return feedbacks.map((feedback) => ({
    id: feedback.id,
    user_name: feedback.user.name,
    user_email: feedback.user.email,
    nps_score: feedback.nps_score,
    category: feedback.category,
    message: feedback.message,
    can_contact: feedback.can_contact,
    status: feedback.status,
    created_at: feedback.created_at.toISOString(),
  }))
}

export async function updateFeedbackStatusAction(
  feedbackId: string,
  status: FeedbackStatus
): Promise<ActionResult> {
  await requirePlatformOwner()

  const validStatuses: FeedbackStatus[] = ['new', 'reviewed', 'archived']
  if (!validStatuses.includes(status)) {
    return actionError('INVALID_INPUT')
  }

  const feedback = await prisma.userFeedback.findFirst({
    where: { id: feedbackId },
    select: { id: true },
  })

  if (!feedback) {
    return actionError('INVALID_INPUT')
  }

  await prisma.userFeedback.update({
    where: { id: feedbackId },
    data: { status },
  })

  revalidatePath('/internal/feedbacks')
  revalidatePath('/internal')

  return { success: true }
}
