importScripts("./push-config.js");
importScripts("https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js");

const pushConfig = self.DASHBOARD_PUSH_CONFIG;

if (pushConfig?.firebaseConfig?.projectId && pushConfig.vapidKey) {
  const app = firebase.initializeApp(pushConfig.firebaseConfig, "dashboard-push");
  const messaging = firebase.messaging(app);

  messaging.onBackgroundMessage((payload) => {
    const title = payload.data?.title || "Event Dashboard";
    const options = {
      body: payload.data?.body || "Im Dashboard warten offene Aufgaben.",
      icon: "./assets/icons/dashboard-icon.png",
      badge: "./assets/icons/dashboard-icon.png",
      data: { openUrl: payload.data?.openUrl || "./" }
    };

    self.registration.showNotification(title, options);
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const openUrl = new URL(event.notification.data?.openUrl || "./", self.registration.scope).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const matchingClient = clientList.find((client) => client.url === openUrl);
      return matchingClient ? matchingClient.focus() : clients.openWindow(openUrl);
    })
  );
});
