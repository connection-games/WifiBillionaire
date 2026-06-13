/* WiFi Billionaire — Firebase cloud: global leaderboard + live-player presence.

   NOTE ON THE KEY BELOW: a Firebase *web* config (apiKey, appId, …) is PUBLIC
   by design — it only identifies the project, it is not a secret. Access is
   controlled by Firestore Security Rules, never by hiding this value. So it's
   safe to ship in the client (this is how every Firebase web app works).

   For the leaderboard to go live, the project owner must, in the Firebase
   console (one-time):
     1. Build → Firestore Database → Create database.
     2. Build → Authentication → Sign-in method → enable **Anonymous**.
     3. Firestore → Rules → allow signed-in users to read all scores and write
        only their own doc, e.g.:
          match /scores/{uid}   { allow read: if true; allow write: if request.auth.uid == uid; }
          match /presence/{uid} { allow read: if true; allow write: if request.auth.uid == uid; }
   Until then the game runs fine — the leaderboard just shows "offline". */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {
  getFirestore, doc, setDoc, getDocs, collection, query,
  orderBy, limit, where, serverTimestamp, Timestamp,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAhypspCNDjSoPtK1TEZtMxdPpVW69lOKI",
  authDomain: "wifibillionare-1acf6.firebaseapp.com",
  projectId: "wifibillionare-1acf6",
  storageBucket: "wifibillionare-1acf6.firebasestorage.app",
  messagingSenderId: "1061411022251",
  appId: "1:1061411022251:web:06839b78d8a8667da41eee",
  measurementId: "G-XRN5WSDDDE",
};

const WB = (window.WB = window.WB || {});
const Cloud = { enabled: false, uid: null, online: 1, lastError: null };
let db = null;

async function init() {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    const cred = await signInAnonymously(getAuth(app));
    Cloud.uid = cred.user.uid;
    Cloud.enabled = true;
  } catch (e) {
    Cloud.lastError = (e && e.message) || String(e);
    Cloud.enabled = false;
    console.warn("[wb-cloud] leaderboard offline:", Cloud.lastError);
  }
  return Cloud.enabled;
}
Cloud.ready = init();

// upsert this player's row (own doc only)
Cloud.submitScore = async function ({ name, netWorth, prestige, era }) {
  if (!Cloud.enabled || !db) return false;
  try {
    await setDoc(doc(db, "scores", Cloud.uid), {
      name: String(name || "Anon").slice(0, 24),
      netWorth: Math.max(0, Math.floor(netWorth || 0)),
      prestige: prestige || 0, era: era || 0, ts: serverTimestamp(),
    }, { merge: true });
    return true;
  } catch (e) { Cloud.lastError = e.message; return false; }
};

// top N by net worth
Cloud.fetchTop = async function (n = 25) {
  if (!Cloud.enabled || !db) return null;
  try {
    const snap = await getDocs(query(collection(db, "scores"), orderBy("netWorth", "desc"), limit(n)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) { Cloud.lastError = e.message; return null; }
};

// heartbeat presence + count players seen in the last 2 minutes (live multiplayer feel)
Cloud.heartbeat = async function (name) {
  if (!Cloud.enabled || !db) return Cloud.online;
  try {
    await setDoc(doc(db, "presence", Cloud.uid), {
      name: String(name || "Anon").slice(0, 24), ts: serverTimestamp(),
    }, { merge: true });
    const since = Timestamp.fromMillis(Date.now() - 120000);
    const snap = await getDocs(query(collection(db, "presence"), where("ts", ">", since)));
    Cloud.online = Math.max(1, snap.size);
  } catch (e) { Cloud.lastError = e.message; }
  return Cloud.online;
};

WB.CLOUD = Cloud;
window.dispatchEvent(new Event("wb-cloud-ready"));
