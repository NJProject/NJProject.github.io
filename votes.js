// votes.js
import { db } from "/firebase-config.js";
import {
  doc, getDoc, setDoc, updateDoc, increment, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

function slugify(str) {
  return str
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getCityKey() {
  const path = window.location.pathname.split("/").pop().replace(".html", "");
  return path || "index";
}

function votedKey(poiId) {
  return `voted:${poiId}`;
}

document.addEventListener("DOMContentLoaded", () => {
  const cityKey = getCityKey();

  document.querySelectorAll(".poi-card").forEach((card) => {
    const titleEl = card.querySelector("h4");
    if (!titleEl) return;
    const poiId = `${cityKey}--${slugify(titleEl.textContent)}`;

    const wrap = document.createElement("div");
    wrap.className = "poi-vote";
    wrap.innerHTML = `
      <button type="button" class="poi-vote-btn" aria-label="Voter pour ce lieu">
        🗳️ <span class="poi-vote-count">–</span>
      </button>
    `;
    card.appendChild(wrap);

    const btn = wrap.querySelector(".poi-vote-btn");
    const countEl = wrap.querySelector(".poi-vote-count");
    const ref = doc(db, "votes", poiId);

    onSnapshot(ref, (snap) => {
      countEl.textContent = snap.exists() ? (snap.data().count || 0) : 0;
    });

    if (localStorage.getItem(votedKey(poiId))) {
      btn.classList.add("voted");
      btn.disabled = true;
    }

    btn.addEventListener("click", async () => {
      if (localStorage.getItem(votedKey(poiId))) return;
      btn.disabled = true;
      try {
        const snap = await getDoc(ref);
        if (snap.exists()) {
          await updateDoc(ref, { count: increment(1) });
        } else {
          await setDoc(ref, { count: 1 });
        }
        localStorage.setItem(votedKey(poiId), "1");
        btn.classList.add("voted");
      } catch (e) {
        console.error("Erreur de vote :", e);
        btn.disabled = false;
      }
    });
  });
});