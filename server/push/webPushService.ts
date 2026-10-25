import webpush from 'web-push';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VAPID_FILE = path.join(__dirname, '../data/vapid.json');

// Retrieve or load stable VAPID key pair
let vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
let vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
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
  } catch (e) {
    // Local read fallback
  }

  // Generate and persist once to ensure durable VAPID keys across server restarts
  if (!vapidPublicKey || !vapidPrivateKey) {
    const generated = webpush.generateVAPIDKeys();
    vapidPublicKey = generated.publicKey;
    vapidPrivateKey = generated.privateKey;
    try {
      const dataDir = path.dirname(VAPID_FILE);
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(VAPID_FILE, JSON.stringify(generated, null, 2), 'utf-8');
    } catch (e) {
      // ignore write error
    }
  }
}

// Configure Web Push with VAPID details
try {
  webpush.setVapidDetails(
    vapidSubject,
    vapidPublicKey,
    vapidPrivateKey
  );
} catch (err) {
  console.warn('VAPID initialization warning:', err);
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

export function getVapidPublicKey(): string {
  return vapidPublicKey!;
}

export async function saveSubscription(
  userId: string,
  subscription: PushSubscriptionPayload,
  supabaseClient?: any
) {
  // Always update in-memory cache
  const userSubs = userSubscriptionsStore.get(userId) || [];
  const exists = userSubs.some((s) => s.endpoint === subscription.endpoint);
  if (!exists) {
    userSubs.push(subscription);
    userSubscriptionsStore.set(userId, userSubs);
  }

  // Persist in Supabase when available
  if (supabaseClient) {
    try {
      await supabaseClient.from('push_subscriptions').upsert(
        {
          user_id: userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth_key: subscription.keys.auth,
        },
        { onConflict: 'endpoint' }
      );
    } catch (err: any) {
      console.warn('Failed to persist push subscription to Supabase:', err.message);
    }
  }
}

export async function removeSubscription(userId: string, endpoint: string, supabaseClient?: any) {
  const userSubs = userSubscriptionsStore.get(userId) || [];
  const filtered = userSubs.filter((s) => s.endpoint !== endpoint);
  userSubscriptionsStore.set(userId, filtered);

  if (supabaseClient) {
    try {
      await supabaseClient
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', endpoint);
    } catch (err: any) {
      console.warn('Failed to remove push subscription from Supabase:', err.message);
    }
  }
}

export async function sendPushNotificationToUser(
  userId: string,
  notification: PushNotificationData,
  supabaseClient?: any
): Promise<{ sentCount: number; expiredCount: number }> {
  let subscriptions: PushSubscriptionPayload[] = [];

  // Query Supabase first if available
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth_key')
        .eq('user_id', userId);

      if (!error && data && data.length > 0) {
        subscriptions = data.map((d: any) => ({
          endpoint: d.endpoint,
          keys: {
            p256dh: d.p256dh,
            auth: d.auth_key,
          },
        }));
      }
    } catch (err) {
      console.warn('Supabase push subscriptions lookup error, using fallback:', err);
    }
  }

  // Fallback to in-memory store if no subscriptions found from DB
  if (subscriptions.length === 0) {
    subscriptions = userSubscriptionsStore.get(userId) || [];
  }

  let sentCount = 0;
  let expiredCount = 0;

  const payload = JSON.stringify({
    notification: {
      title: notification.title,
      body: notification.message,
      icon: notification.icon || '/favicon.ico',
      badge: notification.badge || '/favicon.ico',
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
