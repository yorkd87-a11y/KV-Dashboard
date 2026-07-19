const crypto = require("node:crypto");
const { cert, getApps, initializeApp } = require("firebase-admin/app");
const { FieldValue, getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");
const { HttpsError, onCall } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { setGlobalOptions } = require("firebase-functions/v2");
const { defineSecret } = require("firebase-functions/params");

const REGION = "europe-west3";
const REMINDER_INTERVAL_MS = 4 * 24 * 60 * 60 * 1000;
const MARIO_SERVICE_ACCOUNT_JSON = defineSecret("MARIO_SERVICE_ACCOUNT_JSON");

// Keep the lightweight reminder service within a predictable cost envelope.
setGlobalOptions({ maxInstances: 2 });

initializeApp();
const reminderDb = getFirestore();

function getDeviceId(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getTokenFromRequest(request) {
  const token = request.data?.token;
  if (typeof token !== "string" || token.length < 20) {
    throw new HttpsError("invalid-argument", "Ungültiger Push-Zugang.");
  }
  return token;
}

function getBerlinDateString(dayOffset = 0) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function isArchived(eventItem) {
  return !!eventItem.archived;
}

function isEnded(eventItem, today) {
  return typeof eventItem.datum === "string" && eventItem.datum < today;
}

function isActive(eventItem) {
  return eventItem.aktiv !== false;
}

function getMarioDb() {
  const serviceAccountJson = MARIO_SERVICE_ACCOUNT_JSON.value();
  if (!serviceAccountJson) {
    throw new Error("MARIO_SERVICE_ACCOUNT_JSON ist nicht gesetzt.");
  }

  let marioApp = getApps().find((app) => app.name === "mario-reminder");
  if (!marioApp) {
    marioApp = initializeApp({ credential: cert(JSON.parse(serviceAccountJson)) }, "mario-reminder");
  }
  return getFirestore(marioApp);
}

async function getReminderSummary() {
  const [kvSnapshot, marioSnapshot] = await Promise.all([
    reminderDb.collection("events").get(),
    getMarioDb().collection("events").get()
  ]);
  const today = getBerlinDateString();
  const yesterday = getBerlinDateString(-1);
  let count = 0;
  let endedYesterdayCount = 0;

  kvSnapshot.forEach((docSnap) => {
    const eventItem = docSnap.data();
    if (isArchived(eventItem)) return;

    const needsTicketForm = isActive(eventItem)
      && !isEnded(eventItem, today)
      && !eventItem.ticketFormDone;
    const needsCleanup = isEnded(eventItem, today)
      && !!eventItem.ticketFormDone
      && !eventItem.ticketFormRemoved;
    if (needsTicketForm || needsCleanup) count += 1;
    if (needsCleanup && eventItem.datum === yesterday) endedYesterdayCount += 1;
  });

  marioSnapshot.forEach((docSnap) => {
    const eventItem = docSnap.data();
    const needsMarioReview = !isArchived(eventItem) && isEnded(eventItem, today);
    if (needsMarioReview) count += 1;
    if (needsMarioReview && eventItem.datum === yesterday) endedYesterdayCount += 1;
  });

  return { count, endedYesterdayCount };
}

function getLastReminderMillis(device) {
  const value = device.lastReminderAt;
  return typeof value?.toMillis === "function" ? value.toMillis() : 0;
}

function isInvalidTokenError(errorCode) {
  return errorCode === "messaging/registration-token-not-registered"
    || errorCode === "messaging/invalid-registration-token";
}

async function notifyDueDevices(taskCount) {
  const devices = await reminderDb.collection("dashboardPushDevices")
    .where("enabled", "==", true)
    .get();
  const cutoff = Date.now() - REMINDER_INTERVAL_MS;
  const dueDevices = devices.docs.filter((docSnap) => {
    const device = docSnap.data();
    return typeof device.token === "string" && getLastReminderMillis(device) <= cutoff;
  });

  const title = taskCount === 1
    ? "1 offene Aufgabe im Event-Dashboard"
    : `${taskCount} offene Aufgaben im Event-Dashboard`;
  const body = "Bitte öffne das Dashboard und prüfe die nächsten Schritte.";

  for (let index = 0; index < dueDevices.length; index += 500) {
    const batchDevices = dueDevices.slice(index, index + 500);
    const response = await getMessaging().sendEachForMulticast({
      tokens: batchDevices.map((docSnap) => docSnap.data().token),
      data: { title, body, openUrl: "./" },
      webpush: { headers: { Urgency: "low" } }
    });
    const batch = reminderDb.batch();

    response.responses.forEach((result, responseIndex) => {
      const deviceRef = batchDevices[responseIndex].ref;
      if (result.success) {
        batch.update(deviceRef, {
          lastReminderAt: FieldValue.serverTimestamp(),
          lastTaskCount: taskCount
        });
      } else if (isInvalidTokenError(result.error?.code)) {
        batch.delete(deviceRef);
      }
    });
    await batch.commit();
  }

  return dueDevices.length;
}

async function notifyEndedEventDevices(endedEventCount, reminderDate) {
  const devices = await reminderDb.collection("dashboardPushDevices")
    .where("enabled", "==", true)
    .get();
  const dueDevices = devices.docs.filter((docSnap) => {
    const device = docSnap.data();
    return typeof device.token === "string" && device.lastEventReminderDate !== reminderDate;
  });
  const title = endedEventCount === 1 ? "Ein Event ist beendet" : `${endedEventCount} Events sind beendet`;
  const body = "Bitte pr\u00fcfe die offenen Nacharbeiten im Event-Dashboard.";

  for (let index = 0; index < dueDevices.length; index += 500) {
    const batchDevices = dueDevices.slice(index, index + 500);
    const response = await getMessaging().sendEachForMulticast({
      tokens: batchDevices.map((docSnap) => docSnap.data().token),
      data: { title, body, openUrl: "./" },
      webpush: { headers: { Urgency: "high" } }
    });
    const batch = reminderDb.batch();

    response.responses.forEach((result, responseIndex) => {
      const deviceRef = batchDevices[responseIndex].ref;
      if (result.success) {
        batch.update(deviceRef, {
          lastEventReminderDate: reminderDate,
          lastReminderAt: FieldValue.serverTimestamp()
        });
      } else if (isInvalidTokenError(result.error?.code)) {
        batch.delete(deviceRef);
      }
    });
    await batch.commit();
  }

  return dueDevices.length;
}

exports.registerPushDevice = onCall({ region: REGION }, async (request) => {
  const token = getTokenFromRequest(request);
  const deviceRef = reminderDb.collection("dashboardPushDevices").doc(getDeviceId(token));

  await deviceRef.set({
    token,
    enabled: true,
    updatedAt: FieldValue.serverTimestamp(),
    userAgent: request.rawRequest.get("user-agent") || ""
  }, { merge: true });

  return { enabled: true };
});

exports.disablePushDevice = onCall({ region: REGION }, async (request) => {
  const token = getTokenFromRequest(request);
  const deviceRef = reminderDb.collection("dashboardPushDevices").doc(getDeviceId(token));

  await deviceRef.set({
    enabled: false,
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });

  return { enabled: false };
});

exports.sendDashboardReminders = onSchedule({
  region: REGION,
  schedule: "0 9 * * *",
  timeZone: "Europe/Berlin",
  secrets: [MARIO_SERVICE_ACCOUNT_JSON]
}, async () => {
  const { count: taskCount, endedYesterdayCount } = await getReminderSummary();
  if (taskCount === 0) return;

  if (endedYesterdayCount > 0) {
    await notifyEndedEventDevices(endedYesterdayCount, getBerlinDateString());
  }
  await notifyDueDevices(taskCount);
});
