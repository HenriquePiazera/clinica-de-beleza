'use server'

import { refreshAndRedirect } from '@/lib/refresh'
import { prisma } from '@/lib/prisma'
import { requireUserId } from '@/lib/session'

export async function getOnboardingStateAction() {
  const userId = await requireUserId()
  const user = await prisma.user.findFirstOrThrow({
    where: { id: userId },
    select: {
      onboarding_step: true,
      onboarding_completed_at: true,
    },
  })

  return {
    step: user.onboarding_step,
    completed: Boolean(user.onboarding_completed_at),
  }
}

export async function advanceOnboardingAction(step: number): Promise<void> {
  const userId = await requireUserId()
  await prisma.user.update({
    where: { id: userId },
    data: { onboarding_step: step },
  })
}

export async function completeOnboardingAction(): Promise<void> {
  const userId = await requireUserId()
  await prisma.user.update({
    where: { id: userId },
    data: {
      onboarding_step: 3,
      onboarding_completed_at: new Date(),
    },
  })
  refreshAndRedirect('/dashboard')
}

export async function skipToDashboardIfOnboarded(): Promise<void> {
  const userId = await requireUserId()
  const user = await prisma.user.findFirst({
    where: { id: userId },
    select: { onboarding_completed_at: true },
  })
  if (user?.onboarding_completed_at) {
    refreshAndRedirect('/dashboard')
  }
}
