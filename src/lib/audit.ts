import { prisma } from '@/lib/prisma'

export async function logAudit({
  userId,
  operation,
  entity,
  entityId,
  ipAddress,
}: {
  userId: string
  operation: string
  entity: string
  entityId: string
  ipAddress?: string
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      user_id: userId,
      operation,
      entity,
      entity_id: entityId,
      ip_address: ipAddress ?? null,
    },
  })
}
