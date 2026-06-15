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
  onSnapshot, addDoc, deleteDoc, getDoc, updateDoc, deleteField, increment,
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

// upsert this player's row (own doc only). nameLower lets friends find you by name.
// jailedUntil + bail let friends see you're locked up and bail you for the exact amount.
Cloud.submitScore = async function ({ name, netWorth, prestige, era, jailedUntil, bail }) {
  if (!Cloud.enabled || !db) return false;
  const n = String(name || "Anon").slice(0, 24);
  try {
    await setDoc(doc(db, "scores", Cloud.uid), {
      name: n, nameLower: n.toLowerCase(),
      netWorth: Math.max(0, Math.floor(netWorth || 0)),
      prestige: prestige || 0, era: era || 0, ts: serverTimestamp(),
      jailedUntil: Math.max(0, Math.floor(jailedUntil || 0)),
      bail: Math.max(0, Math.floor(bail || 0)),
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

// ============================================================ FRIENDS / SOCIAL
const chatId = (a, b) => [a, b].sort().join("__");

// find another player by exact username (case-insensitive)
Cloud.findByName = async function (name) {
  if (!Cloud.enabled || !db) return null;
  try {
    const snap = await getDocs(query(collection(db, "scores"),
      where("nameLower", "==", String(name).trim().toLowerCase()), limit(1)));
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { uid: d.id, ...d.data() };
  } catch (e) { Cloud.lastError = e.message; return null; }
};

// send a friend request to a player (by username)
Cloud.sendFriendRequest = async function (name, myName) {
  if (!Cloud.enabled || !db) return { ok: false, why: "offline" };
  const target = await Cloud.findByName(name);
  if (!target) return { ok: false, why: "notfound" };
  if (target.uid === Cloud.uid) return { ok: false, why: "self" };
  try {
    await setDoc(doc(db, "scores", target.uid, "requests", Cloud.uid),
      { name: String(myName || "Anon").slice(0, 24), ts: serverTimestamp() });
    return { ok: true, name: target.name };
  } catch (e) { Cloud.lastError = e.message; return { ok: false, why: "error" }; }
};

// accept an incoming request → become friends both ways
Cloud.acceptFriendRequest = async function (fromUid, fromName, myName) {
  if (!Cloud.enabled || !db) return false;
  try {
    await setDoc(doc(db, "scores", Cloud.uid, "friends", fromUid), { name: fromName || "Anon", since: serverTimestamp() });
    await setDoc(doc(db, "scores", fromUid, "friends", Cloud.uid), { name: String(myName || "Anon").slice(0, 24), since: serverTimestamp() });
    await deleteDoc(doc(db, "scores", Cloud.uid, "requests", fromUid));
    return true;
  } catch (e) { Cloud.lastError = e.message; return false; }
};
Cloud.declineRequest = async function (fromUid) {
  if (!Cloud.enabled || !db) return;
  try { await deleteDoc(doc(db, "scores", Cloud.uid, "requests", fromUid)); } catch (e) {}
};

// live listeners — call the cb whenever the data changes (real-time)
Cloud.watchRequests = function (cb) {
  if (!Cloud.enabled || !db) { cb([]); return () => {}; }
  return onSnapshot(collection(db, "scores", Cloud.uid, "requests"),
    (s) => cb(s.docs.map((d) => ({ uid: d.id, ...d.data() }))), () => cb([]));
};
Cloud.watchFriends = function (cb) {
  if (!Cloud.enabled || !db) { cb([]); return () => {}; }
  // watch the friend list, and each friend's score doc, so net worth + online update live
  const sub = {}; let base = [];
  const emit = () => cb(base.map((f) => ({ ...f, ...(sub[f.uid] && sub[f.uid].data || {}),
    online: sub[f.uid] && sub[f.uid].data && sub[f.uid].data.ts ? (Date.now() - sub[f.uid].data.ts.toMillis() < 150000) : false })));
  const top = onSnapshot(collection(db, "scores", Cloud.uid, "friends"), (s) => {
    base = s.docs.map((d) => ({ uid: d.id, name: d.data().name }));
    const ids = new Set(base.map((f) => f.uid));
    base.forEach((f) => { if (!sub[f.uid]) sub[f.uid] = { unsub: onSnapshot(doc(db, "scores", f.uid), (sd) => { sub[f.uid].data = sd.data(); emit(); }), data: null }; });
    Object.keys(sub).forEach((id) => { if (!ids.has(id)) { sub[id].unsub && sub[id].unsub(); delete sub[id]; } });
    emit();
  }, () => cb([]));
  return () => { top(); Object.values(sub).forEach((x) => x.unsub && x.unsub()); };
};

// chat
Cloud.sendMessage = async function (friendUid, text, myName) {
  if (!Cloud.enabled || !db || !text.trim()) return false;
  try {
    await addDoc(collection(db, "chats", chatId(Cloud.uid, friendUid), "msgs"),
      { from: Cloud.uid, fromName: String(myName || "Anon").slice(0, 24), text: String(text).slice(0, 280), ts: serverTimestamp() });
    return true;
  } catch (e) { Cloud.lastError = e.message; return false; }
};
Cloud.watchChat = function (friendUid, cb) {
  if (!Cloud.enabled || !db) { cb([]); return () => {}; }
  return onSnapshot(query(collection(db, "chats", chatId(Cloud.uid, friendUid), "msgs"), orderBy("ts", "asc"), limit(60)),
    (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => cb([]));
};

// gifts: trade / bail-out drop into the friend's inbox; they claim it in-game
Cloud.sendGift = async function (friendUid, type, amount, myName) {
  if (!Cloud.enabled || !db) return false;
  try {
    await addDoc(collection(db, "scores", friendUid, "inbox"),
      { type, amount: Math.max(0, Math.floor(amount)), from: Cloud.uid, fromName: String(myName || "Anon").slice(0, 24), ts: serverTimestamp() });
    return true;
  } catch (e) { Cloud.lastError = e.message; return false; }
};
Cloud.watchInbox = function (cb) {
  if (!Cloud.enabled || !db) { cb([]); return () => {}; }
  return onSnapshot(collection(db, "scores", Cloud.uid, "inbox"),
    (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => cb([]));
};
Cloud.clearInbox = async function (id) {
  if (!Cloud.enabled || !db) return;
  try { await deleteDoc(doc(db, "scores", Cloud.uid, "inbox", id)); } catch (e) {}
};

// anonymous feedback from the "Do you like the game?" survey
Cloud.submitFeedback = async function (reasons, text) {
  if (!Cloud.enabled || !db) return false;
  try {
    await addDoc(collection(db, "feedback"),
      { uid: Cloud.uid, reasons: reasons || [], text: String(text || "").slice(0, 500), ts: serverTimestamp() });
    return true;
  } catch (e) { Cloud.lastError = e.message; return false; }
};

// ============================================================ ADMIN BROADCAST (global events)
// The admin panel writes broadcast/global; every client watches it and applies
// new broadcasts (a global income boost, a forced event, or an announcement).
// Firestore rule needed:  match /broadcast/{id} { allow read: if true; allow write: if request.auth != null; }
Cloud.pushBroadcast = async function (payload) {
  if (!Cloud.enabled || !db) return false;
  try {
    await setDoc(doc(db, "broadcast", "global"),
      { ...payload, id: payload.id || Date.now(), by: Cloud.uid, ts: serverTimestamp() });
    return true;
  } catch (e) { Cloud.lastError = e.message; return false; }
};
Cloud.watchBroadcast = function (cb) {
  if (!Cloud.enabled || !db) return () => {};
  return onSnapshot(doc(db, "broadcast", "global"),
    (d) => { if (d.exists()) cb(d.data()); }, () => {});
};

// ============================================================ FRIEND HEISTS (co-op crime)
// deliver a friend's cut of a heist into their inbox (reuses the gift inbox plumbing)
Cloud.sendHeistCut = async function (friendUid, amount, myName, jobName) {
  if (!Cloud.enabled || !db) return false;
  try {
    await addDoc(collection(db, "scores", friendUid, "inbox"),
      { type: "heist", amount: Math.max(0, Math.floor(amount)), job: String(jobName || "a job").slice(0, 40),
        from: Cloud.uid, fromName: String(myName || "Anon").slice(0, 24), ts: serverTimestamp() });
    return true;
  } catch (e) { Cloud.lastError = e.message; return false; }
};

// ============================================================ HEIST LOBBIES (multiplayer co-op rooms)
// A lobby lives at lobbies/{lobbyId}; lobby chat at lobbies/{lobbyId}/msgs/{m}.
// host creates → friends join/ready → host starts → finish/close.
Cloud.createLobby = async function (jobId, jobName, myName) {
  if (!Cloud.enabled || !db) return null;
  const lobbyId = `${Cloud.uid}_${jobId}`;
  const n = String(myName || "Anon").slice(0, 24);
  try {
    await setDoc(doc(db, "lobbies", lobbyId), {
      id: lobbyId, host: Cloud.uid, hostName: n, jobId, jobName,
      status: "waiting",
      members: { [Cloud.uid]: { name: n, ready: true, host: true } },
      result: null, ts: serverTimestamp(),
    });
    return lobbyId;
  } catch (e) { Cloud.lastError = e.message; return null; }
};

Cloud.joinLobby = async function (lobbyId, myName) {
  if (!Cloud.enabled || !db) return false;
  try {
    const snap = await getDoc(doc(db, "lobbies", lobbyId));
    if (!snap.exists() || snap.data().status !== "waiting") return false;
    await updateDoc(doc(db, "lobbies", lobbyId),
      { [`members.${Cloud.uid}`]: { name: String(myName || "Anon").slice(0, 24), ready: false, host: false } });
    return true;
  } catch (e) { Cloud.lastError = e.message; return false; }
};

Cloud.leaveLobby = async function (lobbyId) {
  if (!Cloud.enabled || !db) return;
  try {
    const snap = await getDoc(doc(db, "lobbies", lobbyId));
    if (snap.exists() && snap.data().host === Cloud.uid) {
      await updateDoc(doc(db, "lobbies", lobbyId), { status: "closed" });
    } else {
      await updateDoc(doc(db, "lobbies", lobbyId), { [`members.${Cloud.uid}`]: deleteField() });
    }
  } catch (e) { Cloud.lastError = e.message; }
};

Cloud.setLobbyReady = async function (lobbyId, ready) {
  if (!Cloud.enabled || !db) return false;
  try {
    await updateDoc(doc(db, "lobbies", lobbyId), { [`members.${Cloud.uid}.ready`]: !!ready });
    return true;
  } catch (e) { Cloud.lastError = e.message; return false; }
};

Cloud.startLobby = async function (lobbyId) {
  if (!Cloud.enabled || !db) return false;
  try {
    await updateDoc(doc(db, "lobbies", lobbyId), { status: "started" });
    return true;
  } catch (e) { Cloud.lastError = e.message; return false; }
};

Cloud.finishLobby = async function (lobbyId, result) {
  if (!Cloud.enabled || !db) return false;
  try {
    await updateDoc(doc(db, "lobbies", lobbyId), { status: "done", result: result || {} });
    return true;
  } catch (e) { Cloud.lastError = e.message; return false; }
};

Cloud.closeLobby = async function (lobbyId) {
  if (!Cloud.enabled || !db) return;
  try {
    await updateDoc(doc(db, "lobbies", lobbyId), { status: "closed" });
    try { await deleteDoc(doc(db, "lobbies", lobbyId)); } catch (e) {}
  } catch (e) { Cloud.lastError = e.message; }
};

Cloud.watchLobby = function (lobbyId, cb) {
  if (!Cloud.enabled || !db) { cb(null); return () => {}; }
  return onSnapshot(doc(db, "lobbies", lobbyId),
    (s) => cb(s.exists() ? s.data() : null), () => cb(null));
};

// invite a friend by dropping into their existing inbox (Cloud.watchInbox already streams it)
Cloud.sendLobbyInvite = async function (targetUid, lobbyId, jobId, jobName, myName) {
  if (!Cloud.enabled || !db) return false;
  try {
    await addDoc(collection(db, "scores", targetUid, "inbox"),
      { type: "invite", lobbyId, jobId, jobName, from: Cloud.uid,
        fromName: String(myName || "Anon").slice(0, 24), ts: serverTimestamp() });
    return true;
  } catch (e) { Cloud.lastError = e.message; return false; }
};

Cloud.sendLobbyMsg = async function (lobbyId, text, myName) {
  if (!Cloud.enabled || !db || !text.trim()) return false;
  try {
    await addDoc(collection(db, "lobbies", lobbyId, "msgs"),
      { from: Cloud.uid, fromName: String(myName || "Anon").slice(0, 24), text: String(text).slice(0, 280), ts: serverTimestamp() });
    return true;
  } catch (e) { Cloud.lastError = e.message; return false; }
};

Cloud.watchLobbyMsgs = function (lobbyId, cb) {
  if (!Cloud.enabled || !db) { cb([]); return () => {}; }
  return onSnapshot(query(collection(db, "lobbies", lobbyId, "msgs"), orderBy("ts", "asc"), limit(60)),
    (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => cb([]));
};

// online players (last 2 min) to invite — same presence query as Cloud.heartbeat, minus yourself
Cloud.fetchOnlinePlayers = async function (n) {
  if (!Cloud.enabled || !db) return [];
  try {
    const since = Timestamp.fromMillis(Date.now() - 120000);
    const snap = await getDocs(query(collection(db, "presence"), where("ts", ">", since)));
    return snap.docs.filter((d) => d.id !== Cloud.uid)
      .map((d) => ({ uid: d.id, name: d.data().name })).slice(0, n || 20);
  } catch (e) { Cloud.lastError = e.message; return []; }
};

// ============================================================ ADMIN: feedback + replies
// Read the latest feedback/support messages (admin Control Room).
Cloud.fetchFeedback = async function (n) {
  if (!Cloud.enabled || !db) return [];
  try {
    const snap = await getDocs(query(collection(db, "feedback"), orderBy("ts", "desc"), limit(n || 40)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) { Cloud.lastError = e.message; return []; }
};
// Admin → player: drop a reply into their inbox (the player sees a dev-message toast).
Cloud.sendAdminReply = async function (uid, text, fromName) {
  if (!Cloud.enabled || !db) return false;
  try {
    await addDoc(collection(db, "scores", uid, "inbox"),
      { type: "devreply", text: String(text || "").slice(0, 400), fromName: String(fromName || "Dev").slice(0, 24), ts: serverTimestamp() });
    return true;
  } catch (e) { Cloud.lastError = e.message; return false; }
};

// ============================================================ GANGS / SYNDICATES (persistent crews)
// A gang lives at gangs/{gangId}; the boss creates it, members join, everyone
// pools earnings into the shared pot, and the boss claims + splits the pot
// (each member's cut drops into their inbox — reuses the gift inbox plumbing).
// Invites reuse scores/{uid}/inbox too (type:"ganginvite"), streamed by Cloud.watchInbox.
Cloud.createGang = async function (name, myName) {
  if (!Cloud.enabled || !db) return null;
  const gangId = `${Cloud.uid}_gang`;
  const n = String(myName || "Anon").slice(0, 24);
  try {
    await setDoc(doc(db, "gangs", gangId), {
      id: gangId, boss: Cloud.uid, bossName: n,
      name: String(name || "Syndicate").slice(0, 24),
      members: { [Cloud.uid]: { name: n, boss: true } },
      pot: 0, ts: serverTimestamp(),
    });
    return gangId;
  } catch (e) { Cloud.lastError = e.message; return null; }
};

Cloud.joinGang = async function (gangId, myName) {
  if (!Cloud.enabled || !db) return false;
  try {
    const snap = await getDoc(doc(db, "gangs", gangId));
    if (!snap.exists()) return false;
    await updateDoc(doc(db, "gangs", gangId),
      { [`members.${Cloud.uid}`]: { name: String(myName || "Anon").slice(0, 24), boss: false } });
    return true;
  } catch (e) { Cloud.lastError = e.message; return false; }
};

Cloud.leaveGang = async function (gangId, isBoss) {
  if (!Cloud.enabled || !db) return;
  try {
    if (isBoss) {
      await deleteDoc(doc(db, "gangs", gangId));
    } else {
      await updateDoc(doc(db, "gangs", gangId), { [`members.${Cloud.uid}`]: deleteField() });
    }
  } catch (e) { Cloud.lastError = e.message; }
};

Cloud.watchGang = function (gangId, cb) {
  if (!Cloud.enabled || !db) { cb(null); return () => {}; }
  return onSnapshot(doc(db, "gangs", gangId),
    (s) => cb(s.exists() ? s.data() : null), () => cb(null));
};

Cloud.fetchGang = async function (gangId) {
  if (!Cloud.enabled || !db) return null;
  try {
    const snap = await getDoc(doc(db, "gangs", gangId));
    return snap.exists() ? snap.data() : null;
  } catch (e) { Cloud.lastError = e.message; return null; }
};

Cloud.contributeToGang = async function (gangId, amount) {
  if (!Cloud.enabled || !db) return false;
  try {
    await updateDoc(doc(db, "gangs", gangId), { pot: increment(Math.max(0, Math.floor(amount || 0))) });
    return true;
  } catch (e) { Cloud.lastError = e.message; return false; }
};

// boss splits the pot: each member gets an equal share dropped into their inbox, pot resets to 0
Cloud.claimGangPot = async function (gangId, myName) {
  if (!Cloud.enabled || !db) return 0;
  try {
    const snap = await getDoc(doc(db, "gangs", gangId));
    if (!snap.exists()) return 0;
    const data = snap.data();
    const pot = data.pot || 0;
    const members = data.members || {};
    const ids = Object.keys(members);
    if (pot <= 0 || ids.length === 0) return 0;
    const n = String(myName || "Anon").slice(0, 24);
    // Split by the boss-set cut weights when present; otherwise split evenly.
    const totalCut = ids.reduce((a, u) => a + (members[u].cut > 0 ? members[u].cut : 0), 0);
    let biggest = 0;
    for (const uid of ids) {
      const w = members[uid].cut > 0 ? members[uid].cut : 0;
      const share = totalCut > 0 ? Math.floor(pot * (w / totalCut)) : Math.floor(pot / ids.length);
      if (share > biggest) biggest = share;
      await addDoc(collection(db, "scores", uid, "inbox"),
        { type: "gangcut", amount: share, gang: data.name || "the syndicate",
          from: Cloud.uid, fromName: n, ts: serverTimestamp() });
    }
    await updateDoc(doc(db, "gangs", gangId), { pot: 0 });
    return biggest;
  } catch (e) { Cloud.lastError = e.message; return 0; }
};
// Boss-only management: rename the family, set a member's role + cut weight.
Cloud.renameGang = async function (gangId, name) {
  if (!Cloud.enabled || !db) return false;
  try { await updateDoc(doc(db, "gangs", gangId), { name: String(name || "The Family").slice(0, 24) }); return true; }
  catch (e) { Cloud.lastError = e.message; return false; }
};
Cloud.setGangMember = async function (gangId, uid, role, cut) {
  if (!Cloud.enabled || !db) return false;
  try {
    await updateDoc(doc(db, "gangs", gangId), {
      [`members.${uid}.role`]: String(role || "Soldier").slice(0, 16),
      [`members.${uid}.cut`]: Math.max(0, Math.min(100, Math.floor(cut || 0))),
    });
    return true;
  } catch (e) { Cloud.lastError = e.message; return false; }
};

// invite a friend by dropping into their existing inbox (Cloud.watchInbox already streams it)
Cloud.sendGangInvite = async function (targetUid, gangId, gangName, myName) {
  if (!Cloud.enabled || !db) return false;
  try {
    await addDoc(collection(db, "scores", targetUid, "inbox"),
      { type: "ganginvite", gangId, gangName: String(gangName || "a gang").slice(0, 24),
        from: Cloud.uid, fromName: String(myName || "Anon").slice(0, 24), ts: serverTimestamp() });
    return true;
  } catch (e) { Cloud.lastError = e.message; return false; }
};

WB.CLOUD = Cloud;
window.dispatchEvent(new Event("wb-cloud-ready"));
