'use server'

import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import {
  requireUserId,
  getClientIp,
  type ActionResult,
} from '@/lib/session'
import { getAccessibleTeamUserIds } from '@/lib/team'
import { logAudit } from '@/lib/audit'
import { isMockSmsEnabled } from '@/services/mock-sms.service'

export type MockSmsListItem = {
  id: string
  to_phone: string
  body: string
  notification_type: string
  created_at: Date
  client_name: string | null
  appointment_id: string | null
}

export async function listMockSmsMessagesAction(): Promise<MockSmsListItem[]> {
  const userId = await requireUserId()
  const userIds = await getAccessibleTeamUserIds(userId)

  const rows = await prisma.mockSmsMessage.findMany({
    where: { user_id: { in: userIds } },
    orderBy: { created_at: 'desc' },
    take: 100,
    include: {
      client: { select: { name: true } },
    },
  })

  return rows.map((row) => ({
    id: row.id,
    to_phone: row.to_phone,
    body: row.body,
    notification_type: row.notification_type,
    created_at: row.created_at,
    client_name: row.client?.name ?? null,
    appointment_id: row.appointment_id,
  }))
}

export async function getMockSmsStatusAction(): Promise<{
  enabled: boolean
}> {
  await requireUserId()
  return { enabled: isMockSmsEnabled() }
}

export async function clearMockSmsMessagesAction(): Promise<ActionResult> {
  const userId = await requireUserId()
  const userIds = await getAccessibleTeamUserIds(userId)
  const hdrs = await headers()

  await prisma.mockSmsMessage.deleteMany({
    where: { user_id: { in: userIds } },
  })

  await logAudit({
    userId,
    operation: 'mock_sms.clear',
    entity: 'MockSmsMessage',
    entityId: userId,
    ipAddress: getClientIp(hdrs),
  })

  return { success: true }
}
