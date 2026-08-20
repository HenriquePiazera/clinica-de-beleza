import { getVapidPublicKey } from '@/services/push.service'

export async function GET() {
  return Response.json({
    publicKey: getVapidPublicKey(),
  })
}
