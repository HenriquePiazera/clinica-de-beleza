import { isBillingEnabled } from '@/lib/billing'
import { prisma } from '@/lib/prisma'

export const PLAN_LIMITS = {
  trial: {
    max_clients: Infinity,
    max_storage_bytes: Infinity,
    auto_reminders: true,
    public_page: true,
    max_professionals: 1,
  },
  solo: {
    max_clients: 100,
    max_storage_bytes: 2 * 1024 * 1024 * 1024,
    auto_reminders: false,
    public_page: false,
    max_professionals: 1,
  },
  professional: {
    max_clients: Infinity,
    max_storage_bytes: Infinity,
    auto_reminders: true,
    public_page: true,
    max_professionals: 1,
  },
  team: {
    max_clients: Infinity,
    max_storage_bytes: Infinity,
    auto_reminders: true,
    public_page: true,
    max_professionals: 4,
  },
} as const

export type PlanType = keyof typeof PLAN_LIMITS
export type PlanLimitKey = keyof (typeof PLAN_LIMITS)['solo']

export type LimitCheckResult = {
  allowed: boolean
  errorCode?: string
  current?: number
  max?: number
}

export async function checkPlanLimit(
  userId: string,
  key: PlanLimitKey
): Promise<LimitCheckResult> {
  if (!isBillingEnabled()) {
    return { allowed: true }
  }

  const user = await prisma.user.findFirst({ where: { id: userId } })
  if (!user) return { allowed: false, errorCode: 'UNAUTHORIZED' }

  const plan = user.plan as PlanType
  const limits = PLAN_LIMITS[plan]
  const limitValue = limits[key]

  if (typeof limitValue === 'boolean') {
    return limitValue
      ? { allowed: true }
      : { allowed: false, errorCode: 'PLAN_REQUIRED' }
  }

  switch (key) {
    case 'max_clients': {
      const current = await prisma.client.count({ where: { user_id: userId } })
      return current < limitValue
        ? { allowed: true, current, max: limitValue }
        : {
            allowed: false,
            errorCode: 'PLAN_LIMIT_CLIENTS',
            current,
            max: limitValue,
          }
    }

    case 'max_storage_bytes': {
      const current = Number(user.storage_used_bytes)
      return current < limitValue
        ? { allowed: true, current, max: limitValue }
        : {
            allowed: false,
            errorCode: 'PLAN_LIMIT_STORAGE',
            current,
            max: limitValue,
          }
    }

    case 'max_professionals': {
      const current = await prisma.teamMember.count({
        where: { owner_id: userId, status: 'active' },
      })
      return current < limitValue
        ? { allowed: true, current, max: limitValue }
        : {
            allowed: false,
            errorCode: 'PLAN_LIMIT_PROFESSIONALS',
            current,
            max: limitValue,
          }
    }

    default:
      throw new Error(
        `checkPlanLimit: chave de limite "${String(key)}" não implementada.`
      )
  }
}
