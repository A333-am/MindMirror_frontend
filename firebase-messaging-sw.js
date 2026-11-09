self.addEventListener('install', function (event) {
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function (event) {
    const payload = event.data && event.data.json ? event.data.json() : {};
    const title = payload.title || 'MindMirror';
    const body = payload.body || 'A reminder from MindMirror.';
    const tag = payload.tag || 'mindmirror-notification';
    const data = payload.data || {};

    const options = {
        body: body,
        icon: '/Images/logo.png',
        badge: '/Images/logo.png',
        tag: tag,
        data: data,
        requireInteraction: true
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    const notificationData = event.notification.data || {};
    const targetUrl = notificationData.url || '/self-care.html';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientsList) {
            for (let i = 0; i < clientsList.length; i++) {
                const client = clientsList[i];
                if ('focus' in client) {
                    client.focus();
                    client.postMessage({ type: 'NAVIGATE', url: targetUrl });
                    return;
                }
            }

            return self.clients.openWindow(targetUrl);
        })
    );
});
