import { auth } from '@/auth'
import { safeDecryptField } from '@/lib/crypto'
import { prisma } from '@/lib/prisma'
import { getAccessibleTeamUserIds } from '@/lib/team'
import { getObjectFromStorage } from '@/services/storage.service'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const userIds = await getAccessibleTeamUserIds(session.user.id)
  const attachment = await prisma.attachment.findFirst({
    where: { id: params.id, user_id: { in: userIds } },
  })
  if (!attachment) {
    return new Response('Not found', { status: 404 })
  }

  const relativePath = await safeDecryptField(
    attachment.file_url,
    attachment.user_id
  )
  if (!relativePath) {
    return new Response('Not found', { status: 404 })
  }
  const file = await getObjectFromStorage(relativePath)
  if (!file) {
    return new Response('Not found', { status: 404 })
  }

  const disposition = `inline; filename="${attachment.file_name.replace(/"/g, '')}"`

  return new Response(new Uint8Array(file.buffer), {
    headers: {
      'Content-Type': attachment.file_type || file.contentType,
      'Content-Disposition': disposition,
      'Cache-Control': 'private, no-store',
    },
  })
}
