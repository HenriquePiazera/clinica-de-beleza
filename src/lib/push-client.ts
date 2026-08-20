/** Converte chave VAPID base64url para Uint8Array (Web Push API). */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export type PushSubscribeInput = {
  slug: string
  client_phone: string
  appointmentId?: string
}

export async function subscribeClientToPush(
  input: PushSubscribeInput
): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false
  }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    const vapidRes = await fetch('/api/push/vapid')
    const { publicKey } = (await vapidRes.json()) as { publicKey?: string }
    if (!publicKey) return false

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    })

    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: input.slug,
        client_phone: input.client_phone,
        subscription,
        appointmentId: input.appointmentId,
      }),
    })

    const data = (await res.json()) as { success?: boolean }
    return Boolean(data.success)
  } catch {
    return false
  }
}

export async function isPushAvailable(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false
  }
  try {
    const res = await fetch('/api/push/vapid')
    const { publicKey } = (await res.json()) as { publicKey?: string }
    return Boolean(publicKey)
  } catch {
    return false
  }
}
