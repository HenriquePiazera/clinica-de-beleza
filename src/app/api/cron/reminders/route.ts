import { NextResponse } from 'next/server'
import { processReminderNotifications } from '@/services/reminder-cron.service'

function isAuthorizedCron(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim()
  if (!cronSecret) return false

  const authHeader = request.headers.get('authorization')
  if (authHeader === `Bearer ${cronSecret}`) return true

  // Fallback para invocação manual durante testes
  const cronHeader = request.headers.get('x-cron-secret')
  return cronHeader === cronSecret
}

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await processReminderNotifications()
  return NextResponse.json(result)
}
