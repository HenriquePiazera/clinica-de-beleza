import { prisma } from '@/lib/prisma'
import { isBillingEnabled } from '@/lib/billing'

export async function getTeamMemberIds(ownerId: string): Promise<string[]> {
  const members = await prisma.teamMember.findMany({
    where: { owner_id: ownerId, status: 'active' },
    select: { member_id: true },
  })
  return [ownerId, ...members.map((m) => m.member_id)]
}

/** Dona da clínica: se for membro ativo, retorna o owner; senão, o próprio user. */
export async function getClinicOwnerId(userId: string): Promise<string> {
  const membership = await prisma.teamMember.findFirst({
    where: { member_id: userId, status: 'active' },
    select: { owner_id: true },
  })
  return membership?.owner_id ?? userId
}

/**
 * IDs da equipe acessíveis ao usuário logado:
 * - como dona: ela + membros
 * - como membro: dona + colegas da mesma equipe
 */
export async function getAccessibleTeamUserIds(
  userId: string
): Promise<string[]> {
  const ids = new Set(await getTeamMemberIds(userId))

  const memberships = await prisma.teamMember.findMany({
    where: { member_id: userId, status: 'active' },
    select: { owner_id: true },
  })

  for (const membership of memberships) {
    for (const id of await getTeamMemberIds(membership.owner_id)) {
      ids.add(id)
    }
  }

  return Array.from(ids)
}

export async function canManageTeam(ownerId: string): Promise<boolean> {
  if (!isBillingEnabled()) return true
  const owner = await prisma.user.findFirst({
    where: { id: ownerId },
    select: { plan: true },
  })
  return owner?.plan === 'team'
}

export async function getTeamProfessionals(ownerId: string) {
  const owner = await prisma.user.findFirstOrThrow({
    where: { id: ownerId },
    select: {
      id: true,
      name: true,
      public_slug: true,
      public_bio: true,
      public_photo_url: true,
    },
  })

  const members = await prisma.teamMember.findMany({
    where: { owner_id: ownerId, status: 'active' },
    include: {
      member: {
        select: {
          id: true,
          name: true,
          public_slug: true,
          public_bio: true,
          public_photo_url: true,
        },
      },
    },
  })

  return [
    owner,
    ...members.map((m) => m.member).filter((m) => m.public_slug),
  ]
}
