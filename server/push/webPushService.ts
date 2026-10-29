import webpush from 'web-push';
import { createECDH } from 'node:crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VAPID_FILE = path.join(__dirname, '../data/vapid.json');

// Retrieve or load stable VAPID key pair
let vapidPublicKey: string | null = process.env.VAPID_PUBLIC_KEY || null;
let vapidPrivateKey: string | null = process.env.VAPID_PRIVATE_KEY || null;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@agenticjobs.dev';

if (!vapidPublicKey || !vapidPrivateKey) {
  try {
    if (fs.existsSync(VAPID_FILE)) {
      const saved = JSON.parse(fs.readFileSync(VAPID_FILE, 'utf-8'));
      if (saved.publicKey && saved.privateKey) {
        vapidPublicKey = saved.publicKey;
        vapidPrivateKey = saved.privateKey;
      }
    }
  } catch (error) {
    console.warn('Could not read the persisted VAPID key pair:', error);
  }

  // Development may use a local key file; production must use stable configured keys.
  if ((!vapidPublicKey || !vapidPrivateKey) && process.env.NODE_ENV !== 'production') {
    const generated = webpush.generateVAPIDKeys();
    vapidPublicKey = generated.publicKey;
    vapidPrivateKey = generated.privateKey;
    try {
      const dataDir = path.dirname(VAPID_FILE);
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(VAPID_FILE, JSON.stringify(generated, null, 2), 'utf-8');
    } catch (error) {
      console.warn('Could not persist development VAPID keys; they will last only until restart:', error);
    }
  }
}

let vapidConfigured = false;
if (vapidPublicKey && vapidPrivateKey) {
  try {
    const ecdh = createECDH('prime256v1');
    ecdh.setPrivateKey(Buffer.from(vapidPrivateKey, 'base64url'));
    if (ecdh.getPublicKey('base64url') !== vapidPublicKey) {
      throw new Error('Configured public and private keys do not form a matching VAPID pair.');
    }
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    vapidConfigured = true;
  } catch (error) {
    console.error('VAPID initialization failed:', error);
  }
} else if (process.env.NODE_ENV === 'production') {
  console.error('VAPID is unavailable. Configure a stable VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY pair.');
}

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationData {
  title: string;
  message: string;
  icon?: string;
  badge?: string;
  data?: {
    url?: string;
    category?: 'match' | 'followup' | 'scan' | 'system';
    jobId?: string;
  };
}

const userSubscriptionsStore = new Map<string, PushSubscriptionPayload[]>();

export function getVapidPublicKey(): string | null {
  return vapidConfigured ? vapidPublicKey : null;
}

export async function saveSubscription(
  userId: string,
  subscription: PushSubscriptionPayload,
  supabaseClient?: any
) {
  if (supabaseClient) {
    const { error } = await supabaseClient.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth_key: subscription.keys.auth,
      },
      { onConflict: 'endpoint' }
    );
    if (error) throw new Error(`Could not persist push subscription: ${error.message}`);
  }

  const userSubs = userSubscriptionsStore.get(userId) || [];
  const exists = userSubs.some((s) => s.endpoint === subscription.endpoint);
  if (!exists) userSubs.push(subscription);
  userSubscriptionsStore.set(userId, userSubs);
}

export async function removeSubscription(userId: string, endpoint: string, supabaseClient?: any) {
  if (supabaseClient) {
    const { error } = await supabaseClient
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)
      .eq('user_id', userId);
    if (error) throw new Error(`Could not remove push subscription: ${error.message}`);
  }

  const userSubs = userSubscriptionsStore.get(userId) || [];
  userSubscriptionsStore.set(userId, userSubs.filter((s) => s.endpoint !== endpoint));
}

export async function sendPushNotificationToUser(
  userId: string,
  notification: PushNotificationData,
  supabaseClient?: any
): Promise<{ sentCount: number; expiredCount: number }> {
  let subscriptions: PushSubscriptionPayload[] = [];

  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth_key')
      .eq('user_id', userId);
    if (error) throw new Error(`Could not load push subscriptions: ${error.message}`);
    subscriptions = (data || []).map((d: any) => ({
      endpoint: d.endpoint,
      keys: {
        p256dh: d.p256dh,
        auth: d.auth_key,
      },
    }));
  } else {
    subscriptions = userSubscriptionsStore.get(userId) || [];
  }

  let sentCount = 0;
  let expiredCount = 0;

  const payload = JSON.stringify({
    notification: {
      title: notification.title,
      body: notification.message,
      icon: notification.icon || '/icon-192.png',
      badge: notification.badge || '/favicon.png',
      data: notification.data || {},
    },
  });

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys,
        },
        payload
      );
      sentCount++;
    } catch (error: any) {
      if (error.statusCode === 410 || error.statusCode === 404) {
        await removeSubscription(userId, sub.endpoint, supabaseClient);
        expiredCount++;
      } else {
        console.warn('Web push delivery warning:', error.message || error);
      }
    }
  }

  return { sentCount, expiredCount };
}
