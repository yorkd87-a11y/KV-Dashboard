/* Public web configuration. Add the VAPID key from Firebase before deploying push reminders. */
const dashboardPushConfig = {
  firebaseConfig: {
    apiKey: "AIzaSyBeXuSL1RQBdulUUFIyXaWWb2sULS0W38o",
    authDomain: "kulturverein-ec831.firebaseapp.com",
    projectId: "kulturverein-ec831",
    storageBucket: "kulturverein-ec831.firebasestorage.app",
    messagingSenderId: "801254533597",
    appId: "1:801254533597:web:842764b8e174cd1de62e34"
  },
  vapidKey: "BNZeaeZHBnnt7wvcdxlJG6rSOQCnxla1JLFA1icciRbYjSscF_VlCqkWZnK9HYhYrMltTGaq-KO1sC4YvW5V4Ak"
};

globalThis.DASHBOARD_PUSH_CONFIG = dashboardPushConfig;
