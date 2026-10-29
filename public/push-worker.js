self.addEventListener('push', (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = { notification: { body: event.data.text() } };
    }
  }

  const notification = payload.notification || payload;
  const notificationPromise = self.registration.showNotification(
    notification.title || 'Agentic Jobs Update',
    {
      body: notification.body || 'You have new job updates or application reminders.',
      icon: notification.icon || '/icon-192.png',
      badge: notification.badge || '/favicon.png',
      data: notification.data || payload.data || {},
      actions: [
        { action: 'open', title: 'View Opportunities' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    }
  );

  event.waitUntil(notificationPromise);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  let targetUrl;
  try {
    const requestedUrl = event.notification.data?.url || '/?view=recommended';
    const parsedUrl = new URL(requestedUrl, self.location.origin);
    targetUrl = parsedUrl.origin === self.location.origin
      ? parsedUrl.href
      : new URL('/?view=recommended', self.location.origin).href;
  } catch {
    targetUrl = new URL('/?view=recommended', self.location.origin).href;
  }

  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const appClient = clients.find((client) => new URL(client.url).origin === self.location.origin);

    if (appClient) {
      try {
        await appClient.navigate(targetUrl);
      } catch {
        // Keep the existing app window available even if it cannot be navigated.
      }
      return appClient.focus();
    }

    return self.clients.openWindow(targetUrl);
  })());
});
