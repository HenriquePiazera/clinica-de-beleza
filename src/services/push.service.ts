import webpush from 'web-push'

type PushPayload = {
  title: string
  body: string
  url?: string
}

function isPushConfigured(): boolean {
  return Boolean(
    process.env.VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT
  )
}

function getVapidDetails() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
}

export async function sendPushNotification(
  subscriptionJson: string,
  payload: PushPayload
): Promise<boolean> {
  if (!isPushConfigured()) return false

  try {
    getVapidDetails()
    const subscription = JSON.parse(subscriptionJson)
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url,
      })
    )
    return true
  } catch {
    return false
  }
}

export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY ?? null
}
