
self.addEventListener("push", function (event) {
    let data = {
        title: "MindMirror 🌙",
        body: "It's time for your reminder.",
        url: "./sleep.html",
        tag: "mindmirror-reminder"
    };

    if (event.data) {
        try {
            const payload = event.data.json();

            data.title = payload.title || data.title;
            data.body = payload.body || data.body;
            data.url = payload.url || data.url;
            data.tag = payload.tag || data.tag;
        } catch (error) {
            data.body = event.data.text() || data.body;
        }
    }

    const iconUrl = new URL("./Images/logo.png", self.registration.scope).href;
    const targetUrl = new URL(data.url, self.registration.scope).href;

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: iconUrl,
            badge: iconUrl,
            tag: data.tag,
            data: {
                url: targetUrl
            }
        })
    );
});

self.addEventListener("notificationclick", function (event) {
    event.notification.close();

    const targetUrl =
        event.notification.data?.url ||
        new URL("./sleep.html", self.registration.scope).href;

    event.waitUntil(
        clients.matchAll({
            type: "window",
            includeUncontrolled: true
        }).then(function (windowClients) {
            for (const client of windowClients) {
                if ("focus" in client) {
                    client.navigate(targetUrl);
                    return client.focus();
                }
            }

            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
