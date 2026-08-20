'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { checkPlanLimit } from '@/lib/plan-limits'
import { canManageTeam } from '@/lib/team'
import {
  actionError,
  getClientIp,
  requireUserId,
  type ActionResult,
} from '@/lib/session'
import { sendTeamInviteEmail } from '@/services/email.service'
import { z } from 'zod'

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['member', 'admin']).default('member'),
})

export type TeamMemberDTO = {
  id: string
  member_id: string
  name: string
  email: string
  role: string
  status: string
  invited_at: string
  joined_at: string | null
}

export async function listTeamMembersAction(): Promise<TeamMemberDTO[]> {
  const ownerId = await requireUserId()
  const rows = await prisma.teamMember.findMany({
    where: { owner_id: ownerId, status: { not: 'removed' } },
    include: {
      member: { select: { name: true, email: true } },
    },
    orderBy: { invited_at: 'desc' },
  })

  return rows.map((r) => ({
    id: r.id,
    member_id: r.member_id,
    name: r.member.name,
    email: r.member.email,
    role: r.role,
    status: r.status,
    invited_at: r.invited_at.toISOString(),
    joined_at: r.joined_at?.toISOString() ?? null,
  }))
}

export async function listPendingInvitesAction(): Promise<TeamMemberDTO[]> {
  const userId = await requireUserId()
  const rows = await prisma.teamMember.findMany({
    where: { member_id: userId, status: 'invited' },
    include: {
      owner: { select: { name: true, email: true } },
    },
    orderBy: { invited_at: 'desc' },
  })

  return rows.map((r) => ({
    id: r.id,
    member_id: r.owner_id,
    name: r.owner.name,
    email: r.owner.email,
    role: r.role,
    status: r.status,
    invited_at: r.invited_at.toISOString(),
    joined_at: null,
  }))
}

export async function inviteTeamMemberAction(
  formData: FormData
): Promise<ActionResult<{ teamMemberId: string }>> {
  const ownerId = await requireUserId()

  if (!(await canManageTeam(ownerId))) {
    return actionError('PLAN_REQUIRED')
  }

  const parsed = inviteSchema.safeParse({
    email: formData.get('email'),
    role: formData.get('role') || 'member',
  })
  if (!parsed.success) return actionError('INVALID_INPUT')

  const limitCheck = await checkPlanLimit(ownerId, 'max_professionals')
  if (!limitCheck.allowed) {
    return actionError('PLAN_LIMIT_PROFESSIONALS')
  }

  const invitedUser = await prisma.user.findFirst({
    where: { email: parsed.data.email.toLowerCase() },
  })
  if (!invitedUser) {
    return actionError('USER_NOT_FOUND_INVITE_PENDING_SIGNUP')
  }

  if (invitedUser.id === ownerId) {
    return actionError('INVALID_INPUT')
  }

  const existing = await prisma.teamMember.findFirst({
    where: { owner_id: ownerId, member_id: invitedUser.id },
  })

  if (existing && existing.status !== 'removed') {
    return actionError('TEAM_MEMBER_ALREADY_INVITED')
  }

  const teamMember = existing
    ? await prisma.teamMember.update({
        where: { id: existing.id },
        data: {
          role: parsed.data.role,
          status: 'invited',
          invited_at: new Date(),
          joined_at: null,
        },
      })
    : await prisma.teamMember.create({
        data: {
          owner_id: ownerId,
          member_id: invitedUser.id,
          role: parsed.data.role,
          status: 'invited',
        },
      })

  const owner = await prisma.user.findFirstOrThrow({
    where: { id: ownerId },
    select: { name: true },
  })

  await sendTeamInviteEmail({
    to: invitedUser.email,
    ownerName: owner.name,
    inviteeName: invitedUser.name,
  })

  const hdrs = await headers()
  await logAudit({
    userId: ownerId,
    operation: 'team_member.invite',
    entity: 'TeamMember',
    entityId: teamMember.id,
    ipAddress: getClientIp(hdrs),
  })

  revalidatePath('/settings/team')
  return { success: true, data: { teamMemberId: teamMember.id } }
}

export async function acceptTeamInviteAction(
  teamMemberId: string
): Promise<ActionResult> {
  const userId = await requireUserId()
  const invite = await prisma.teamMember.findFirst({
    where: { id: teamMemberId, member_id: userId, status: 'invited' },
  })
  if (!invite) return actionError('INVALID_INPUT')

  await prisma.teamMember.update({
    where: { id: teamMemberId },
    data: { status: 'active', joined_at: new Date() },
  })

  const hdrs = await headers()
  await logAudit({
    userId,
    operation: 'team_member.accept',
    entity: 'TeamMember',
    entityId: teamMemberId,
    ipAddress: getClientIp(hdrs),
  })

  revalidatePath('/settings/team')
  return { success: true }
}

export async function removeTeamMemberAction(
  teamMemberId: string
): Promise<ActionResult> {
  const ownerId = await requireUserId()
  const row = await prisma.teamMember.findFirst({
    where: { id: teamMemberId, owner_id: ownerId },
  })
  if (!row) return actionError('INVALID_INPUT')

  await prisma.teamMember.update({
    where: { id: teamMemberId },
    data: { status: 'removed' },
  })

  const hdrs = await headers()
  await logAudit({
    userId: ownerId,
    operation: 'team_member.remove',
    entity: 'TeamMember',
    entityId: teamMemberId,
    ipAddress: getClientIp(hdrs),
  })

  revalidatePath('/settings/team')
  return { success: true }
}
