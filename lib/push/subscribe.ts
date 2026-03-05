export async function subscribeToPush(): Promise<void> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return

  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return

  const registration =
    (await navigator.serviceWorker.getRegistration()) ??
    (await navigator.serviceWorker.register('/sw.js'))

  const existing = await registration.pushManager.getSubscription()
  if (existing) {
    await sendSubscription(existing)
    return
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: undefined,
  })

  await sendSubscription(subscription)
}

async function sendSubscription(subscription: PushSubscription): Promise<void> {
  try {
    const body = subscription.toJSON() as {
      endpoint?: string
      keys?: { p256dh?: string; auth?: string }
    }

    if (!body.endpoint || !body.keys?.p256dh || !body.keys.auth) return

    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: body.endpoint,
        keys: {
          p256dh: body.keys.p256dh,
          auth: body.keys.auth,
        },
      }),
    })
  } catch {
    // Ignore failures; user can retry later
  }
}

