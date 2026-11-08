import { db } from "./firebase-config.js";
import { getApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  collection, doc, onSnapshot, writeBatch
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const auth = getAuth(getApp());
const $ = id => document.getElementById(id);
const B = () => window.shopBridge;
const status = t => { $("acStatus").textContent = t; };

const panel = $("acct"), badge = $("acBadge"), back = $("acBack"), toast = $("acToast");
let justSignedIn = false, toastTimer;
const openPanel = () => { panel.classList.add("open"); back.classList.add("show"); };
const closePanel = () => { panel.classList.remove("open"); back.classList.remove("show"); };
const showToast = t => {
  toast.textContent = t; toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
};
badge.onclick = openPanel;
$("acClose").onclick = closePanel;
back.onclick = closePanel;
document.addEventListener("keydown", e => { if (e.key === "Escape") closePanel(); });

let uid = null, unsubs = [], synced = new Map(), settingsSynced = "";
let itemsReady = false, settingsReady = false;
const settingsOf = s => JSON.stringify({ rate: s.rate, budget: s.budget, kg: s.kg });

async function push() {
  if (!uid || !itemsReady || !settingsReady) return;
  const s = B().get();
  const batch = writeBatch(db);
  const seen = new Set();
  let n = 0;
  for (const it of s.items) {
    const id = String(it.id);
    seen.add(id);
    const j = JSON.stringify(it);
    if (synced.get(id) !== j) {
      batch.set(doc(db, "users", uid, "shopItems", id), it);
      synced.set(id, j); n++;
    }
  }
  for (const id of [...synced.keys()]) {
    if (!seen.has(id)) { batch.delete(doc(db, "users", uid, "shopItems", id)); synced.delete(id); n++; }
  }
  const st = settingsOf(s);
  if (st !== settingsSynced) {
    batch.set(doc(db, "users", uid, "meta", "shop"), JSON.parse(st));
    settingsSynced = st; n++;
  }
  if (!n) return;
  try { await batch.commit(); status("Synchronisé ✓"); }
  catch (e) {
    console.error(e);
    synced.clear(); settingsSynced = "";
    status("Synchronisation impossible, nouvel essai à la prochaine modification.");
  }
}

function listen() {
  unsubs.push(onSnapshot(collection(db, "users", uid, "shopItems"), snap => {
    if (snap.metadata.hasPendingWrites) return;
    const remote = snap.docs.map(d => d.data());
    const remoteIds = new Set(remote.map(r => String(r.id)));
    let items = remote;
    if (!itemsReady) {
      items = [...remote, ...B().get().items.filter(i => !remoteIds.has(String(i.id)))];
    }
    B().apply(items);
    synced = new Map(B().get().items
      .filter(i => remoteIds.has(String(i.id)))
      .map(i => [String(i.id), JSON.stringify(i)]));
    itemsReady = true;
    push();
  }, e => { console.error(e); status("Lecture impossible (vérifie les règles Firestore)."); }));

  unsubs.push(onSnapshot(doc(db, "users", uid, "meta", "shop"), snap => {
    if (snap.metadata.hasPendingWrites) return;
    if (snap.exists()) {
      B().apply(B().get().items, snap.data());
      settingsSynced = settingsOf(B().get());
    }
    settingsReady = true;
    push();
  }));
}

function stop() {
  unsubs.forEach(u => u()); unsubs = [];
  uid = null; synced = new Map(); settingsSynced = "";
  itemsReady = settingsReady = false;
}

document.addEventListener("shop-changed", push);

onAuthStateChanged(auth, user => {
  stop();
  $("acctOut").hidden = !!user;
  $("acctIn").hidden = !user;
  if (user) {
    uid = user.uid;
    const name = user.email.split("@")[0];
    $("acUser").textContent = "Connecté : " + name;
    badge.textContent = "✓ " + name;
    badge.classList.add("on");
    status("Synchronisation…");
    listen();
    closePanel();
    if (justSignedIn) { showToast("Connecté : " + name + " ✓"); justSignedIn = false; }
  } else {
    badge.textContent = "👤 Se connecter";
    badge.classList.remove("on");
    status("Non connecté : la liste reste sur cet appareil.");
  }
});

const toEmail = pseudo => {
  const p = pseudo.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]/g, "");
  return p ? p + "@japon.invalid" : "";
};
const creds = () => [toEmail($("acEmail").value), $("acPass").value];
const errMsg = e => ({
  "auth/invalid-credential": "Pseudo ou mot de passe incorrect.",
  "auth/email-already-in-use": "Ce pseudo est déjà pris.",
  "auth/weak-password": "Mot de passe trop court (6 caractères minimum).",
  "auth/invalid-email": "Pseudo invalide (lettres et chiffres uniquement).",
  "auth/too-many-requests": "Trop d'essais, réessaie plus tard."
}[e.code] || "Erreur : " + e.code);

$("acIn").onclick = async () => {
  justSignedIn = true;
  try { await signInWithEmailAndPassword(auth, ...creds()); } catch (e) { status(errMsg(e)); }
};
$("acUp").onclick = async () => {
  justSignedIn = true;
  try { await createUserWithEmailAndPassword(auth, ...creds()); } catch (e) { status(errMsg(e)); }
};
$("acOut").onclick = async () => {
  if (!confirm("Se déconnecter ? La liste de cet appareil sera effacée (elle reste dans ton compte).")) return;
  await push();
  await signOut(auth);
  B().apply([]);
};