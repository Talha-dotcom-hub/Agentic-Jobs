import { supabase, isSupabaseConfigured } from './supabase';

// Utility to convert Base64 URL to Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (isSupabaseConfigured) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    } catch {
      // ignore
    }
  }
  return headers;
}

let workerRegistrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  if (!workerRegistrationPromise) {
    workerRegistrationPromise = (async () => {
      try {
        const existing = await navigator.serviceWorker.getRegistration('/');
        if (existing) return existing;
        return await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
      } catch (err) {
        console.warn('Service Worker registration warning:', err);
        return null;
      }
    })();
  }

  const registration = await workerRegistrationPromise;
  if (!registration) workerRegistrationPromise = null;
  return registration;
}

export async function subscribeUserToWebPush(userId: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('PushManager' in window)) {
    return false;
  }

  try {
    const reg = await registerServiceWorker();
    if (!reg) return false;

    const existing = await reg.pushManager.getSubscription();
    let payload: PushSubscriptionJSON | null = existing ? existing.toJSON() : null;
    if (!existing) {
      const keyRes = await fetch('/api/push/vapid-key');
      if (!keyRes.ok) return false;
      const { publicKey } = await keyRes.json();
      const applicationServerKey = urlBase64ToUint8Array(publicKey) as unknown as BufferSource;

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
      payload = subscription.toJSON();
    }
    if (!payload?.endpoint || !payload.keys?.p256dh || !payload.keys.auth) return false;

    const headers = await getAuthHeader();
    const subRes = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        userId,
        subscription: payload,
      }),
    });

    return subRes.ok;
  } catch (err) {
    console.warn('Web Push subscription error:', err);
    return false;
  }
}

export async function unsubscribeUserFromWebPush(userId: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      const headers = await getAuthHeader();
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId,
          endpoint: subscription.endpoint,
        }),
      });
    }
    return true;
  } catch (err) {
    console.warn('Unsubscribe error:', err);
    return false;
  }
}
