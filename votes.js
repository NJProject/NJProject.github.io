// votes.js
import { db } from "/firebase-config.js";
import {
  doc, onSnapshot, updateDoc, setDoc, deleteField
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const NAME_KEY = "voterName";

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

function getVoterName() {
  return (localStorage.getItem(NAME_KEY) || "").trim();
}

function setVoterName(name) {
  localStorage.setItem(NAME_KEY, name.trim());
}

// ---------- Badge nom (persistant, en bas à droite) ----------
function buildNameBadge() {
  const badge = document.createElement("div");
  badge.className = "voter-badge";
  const current = getVoterName();
  badge.innerHTML = `
    <span class="voter-badge-icon">👤</span>
    <span class="voter-badge-name">${current || "Définir mon nom"}</span>
    <button type="button" class="voter-badge-edit" aria-label="Changer de nom">✏️</button>
  `;
  document.body.appendChild(badge);

  const editBtn = badge.querySelector(".voter-badge-edit");
  const nameEl = badge.querySelector(".voter-badge-name");

  function promptName() {
    const input = prompt("Ton prénom (affiché à côté de tes votes) :", getVoterName());
    if (input === null) return;
    const trimmed = input.trim().slice(0, 24);
    if (!trimmed) return;
    setVoterName(trimmed);
    nameEl.textContent = trimmed;
    document.dispatchEvent(new CustomEvent("voterNameChanged"));
  }

  editBtn.addEventListener("click", promptName);
  if (!current) badge.querySelector(".voter-badge-name").addEventListener("click", promptName);

  return { promptName };
}

document.addEventListener("DOMContentLoaded", () => {
  const cityKey = getCityKey();
  const { promptName } = buildNameBadge();

  document.querySelectorAll(".poi-card").forEach((card) => {
    const titleEl = card.querySelector("h4");
    if (!titleEl) return;
    const poiId = `${cityKey}--${slugify(titleEl.textContent)}`;
    const ref = doc(db, "votes", poiId);

    const wrap = document.createElement("div");
    wrap.className = "poi-vote";
    wrap.innerHTML = `
      <button type="button" class="poi-vote-btn" aria-label="Voter pour ce lieu">
        🗳️ <span class="poi-vote-count">0</span>
      </button>
      <div class="poi-vote-names" hidden></div>
    `;
    card.appendChild(wrap);

    const btn = wrap.querySelector(".poi-vote-btn");
    const countEl = wrap.querySelector(".poi-vote-count");
    const namesEl = wrap.querySelector(".poi-vote-names");

    let currentVoters = {};

    function render() {
      const names = Object.keys(currentVoters);
      countEl.textContent = names.length;
      namesEl.textContent = names.length ? names.join(", ") : "Aucun vote pour l'instant";
      const me = getVoterName();
      btn.classList.toggle("voted", !!me && !!currentVoters[me]);
    }

    onSnapshot(ref, (snap) => {
      currentVoters = snap.exists() ? (snap.data().voters || {}) : {};
      render();
    });

    // Affiche/masque la liste des votants au clic sur le compteur
    countEl.addEventListener("click", (e) => {
      e.stopPropagation();
      namesEl.hidden = !namesEl.hidden;
    });

    btn.addEventListener("click", async () => {
      const me = getVoterName();
      if (!me) { promptName(); return; }

      btn.disabled = true;
      const alreadyVoted = !!currentVoters[me];
      try {
        if (alreadyVoted) {
          await updateDoc(ref, { [`voters.${me}`]: deleteField() });
        } else {
          try {
            await updateDoc(ref, { [`voters.${me}`]: true });
          } catch {
            // Le document n'existe pas encore
            await setDoc(ref, { voters: { [me]: true } });
          }
        }
      } catch (e) {
        console.error("Erreur de vote :", e);
      } finally {
        btn.disabled = false;
      }
    });

    document.addEventListener("voterNameChanged", render);
  });
});