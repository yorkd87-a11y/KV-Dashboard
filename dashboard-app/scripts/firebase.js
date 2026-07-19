import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

export const kvApp = initializeApp({
  apiKey: "AIzaSyBeXuSL1RQBdulUUFIyXaWWb2sULS0W38o",
  authDomain: "kulturverein-ec831.firebaseapp.com",
  projectId: "kulturverein-ec831",
  storageBucket: "kulturverein-ec831.firebasestorage.app",
  messagingSenderId: "801254533597",
  appId: "1:801254533597:web:842764b8e174cd1de62e34"
}, "dashboard-neu-kv");

const marioApp = initializeApp({
  apiKey: "AIzaSyDPZpXsbP8Zn_yeak6NPCQ8Pf1PUJlIWf8",
  authDomain: "mario-schlagerseite.firebaseapp.com",
  projectId: "mario-schlagerseite",
  storageBucket: "mario-schlagerseite.firebasestorage.app",
  messagingSenderId: "607184347662",
  appId: "1:607184347662:web:058a5cd29d1c40ac55525f"
}, "dashboard-neu-mario");

const kvDb = getFirestore(kvApp);
const marioDb = getFirestore(marioApp);

const sources = {
  kv: collection(kvDb, "events"),
  mario: collection(marioDb, "events")
};

export function subscribeToEvents(type, onData, onError) {
  const source = sources[type];
  if (!source) return () => {};

  return onSnapshot(
    query(source, orderBy("datum", "asc")),
    (snapshot) => {
      const events = [];
      snapshot.forEach((docSnap) => {
        events.push({ id: docSnap.id, ...docSnap.data() });
      });
      onData(events);
    },
    (error) => {
      if (onError) onError(error);
      else console.error(error);
    }
  );
}

export async function saveEventDocument(type, payload, eventId = null) {
  const source = sources[type];
  if (!source) {
    throw new Error(`Unbekannter Bereich: ${type}`);
  }

  const data = {
    ...payload,
    updatedAt: serverTimestamp()
  };

  if (eventId) {
    await updateDoc(doc(source.firestore, "events", eventId), data);
    return eventId;
  }

  const created = await addDoc(source, {
    ...data,
    createdAt: serverTimestamp()
  });

  return created.id;
}

export async function patchEventDocument(type, eventId, partialPayload) {
  const source = sources[type];
  if (!source || !eventId) {
    throw new Error("Patchen nicht moeglich.");
  }

  await updateDoc(doc(source.firestore, "events", eventId), {
    ...partialPayload,
    updatedAt: serverTimestamp()
  });
}

export async function removeEventDocument(type, eventId) {
  const source = sources[type];
  if (!source || !eventId) {
    throw new Error("Loeschen nicht moeglich.");
  }

  await deleteDoc(doc(source.firestore, "events", eventId));
}
