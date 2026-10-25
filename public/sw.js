// Service Worker for Agentic Jobs PWA & Web Push Notifications

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming Web Push message
self.addEventListener('push', (event) => {
  let data = {
    notification: {
      title: 'Agentic Jobs Update',
      body: 'You have new job updates or application reminders.',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
    },
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.notification.body = event.data.text();
    }
  }

  const notificationPromise = self.registration.showNotification(
    data.notification.title,
    {
      body: data.notification.body,
      icon: data.notification.icon || '/favicon.ico',
      badge: data.notification.badge || '/favicon.ico',
      data: data.notification.data || {},
      actions: [
        { action: 'open', title: 'View Opportunities' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    }
  );

  event.waitUntil(notificationPromise);
});

// Handle notification click routing
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/?view=recommended';

  const clickPromise = self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    for (const client of clients) {
      if (client.url.includes(self.location.origin) && 'focus' in client) {
        if ('navigate' in client) {
          client.navigate(targetUrl);
        }
        return client.focus();
      }
    }
    if (self.clients.openWindow) {
      return self.clients.openWindow(targetUrl);
    }
  });

  event.waitUntil(clickPromise);
});
