
self.addEventListener("push", function (event) {
    console.log("MindMirror push event received");

    let data = {
        title: "MindMirror 🌙",
        body: "It's time to start your bedtime routine.",
        url: "/sleep.html"
    };

    if (event.data) {
        try {
            const payload = event.data.json();

            data.title = payload.title || data.title;
            data.body = payload.body || data.body;
            data.url = payload.url || data.url;
        } catch (error) {
            data.body = event.data.text() || data.body;
        }
    }

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: "/Images/logo.png",
            badge: "/Images/logo.png",
            tag: "mindmirror-sleep-reminder",
            data: {
                url: data.url
            }
        })
    );
});

/* ---------- NOTIFICATION CLICK ---------- */

self.addEventListener("notificationclick", function (event) {
    event.notification.close();

    const targetUrl =
        event.notification.data?.url || "/sleep.html";

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
