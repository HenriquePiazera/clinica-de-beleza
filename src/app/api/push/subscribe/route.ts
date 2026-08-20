import { NextResponse } from 'next/server'
import { savePushSubscription } from '@/features/public-booking/actions'

export async function POST(request: Request) {
  const body = await request.json()
  const { slug, client_phone, subscription, appointmentId } = body

  if (!slug || !client_phone || !subscription) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const result = await savePushSubscription({
    slug,
    client_phone,
    subscription: JSON.stringify(subscription),
    appointmentId: typeof appointmentId === 'string' ? appointmentId : undefined,
  })

  return NextResponse.json(result)
}
