import { getServicePhotoFromStorage } from '@/services/storage.service'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: { serviceId: string } }
) {
  const service = await prisma.service.findFirst({
    where: { id: params.serviceId, is_active: true },
    select: { photo_url: true },
  })

  if (!service?.photo_url || service.photo_url.startsWith('http')) {
    return new Response('Not found', { status: 404 })
  }

  const file = await getServicePhotoFromStorage(service.photo_url)
  if (!file) {
    return new Response('Not found', { status: 404 })
  }

  return new Response(new Uint8Array(file.buffer), {
    headers: {
      'Content-Type': file.contentType,
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
