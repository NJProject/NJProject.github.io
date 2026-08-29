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

// ---------- Modale de saisie du prénom ----------
function buildNameModal() {
  const overlay = document.createElement("div");
  overlay.className = "name-modal-overlay";
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="name-modal" role="dialog" aria-modal="true" aria-labelledby="nameModalTitle">
      <div class="name-modal-seal">印</div>
      <h3 id="nameModalTitle">Ton prénom</h3>
      <p class="name-modal-sub">Affiché à côté de tes votes, pour que le groupe sache qui a voté quoi.</p>
      <input type="text" id="nameModalInput" maxlength="24" placeholder="Ex. Nicolas" autocomplete="off">
      <div class="name-modal-actions">
        <button type="button" class="name-modal-cancel">Annuler</button>
        <button type="button" class="name-modal-save">Valider</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const input = overlay.querySelector("#nameModalInput");
  const saveBtn = overlay.querySelector(".name-modal-save");
  const cancelBtn = overlay.querySelector(".name-modal-cancel");
  let resolveFn = null;

  function onKeydown(e) {
    if (e.key === "Escape") close(null);
    if (e.key === "Enter") close(input.value.trim());
  }

  function close(value) {
    overlay.hidden = true;
    document.removeEventListener("keydown", onKeydown);
    if (resolveFn) { resolveFn(value); resolveFn = null; }
  }

  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(null); });
  saveBtn.addEventListener("click", () => close(input.value.trim()));
  cancelBtn.addEventListener("click", () => close(null));

  return function open(currentValue) {
    input.value = currentValue || "";
    overlay.hidden = false;
    document.addEventListener("keydown", onKeydown);
    setTimeout(() => input.focus(), 50);
    return new Promise((resolve) => { resolveFn = resolve; });
  };
}

// ---------- Badge nom (persistant, en bas à droite) ----------
function buildNameBadge(openNameModal) {
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

  async function promptName() {
    const input = await openNameModal(getVoterName());
    if (input === null) return;
    const trimmed = input.trim().slice(0, 24);
    if (!trimmed) return;
    setVoterName(trimmed);
    nameEl.textContent = trimmed;
    document.dispatchEvent(new CustomEvent("voterNameChanged"));
  }

  editBtn.addEventListener("click", promptName);
  if (!current) nameEl.addEventListener("click", promptName);

  return { promptName };
}

let promptNameFn = null;

// Attache le bouton de vote à une carte .poi-card donnée.
// Exportée pour être réutilisée par custom-pois.js sur les cartes ajoutées dynamiquement.
export function attachVoting(card, cityKey) {
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

  countEl.addEventListener("click", (e) => {
    e.stopPropagation();
    namesEl.hidden = !namesEl.hidden;
  });

  btn.addEventListener("click", async () => {
    let me = getVoterName();
    if (!me) {
      if (promptNameFn) await promptNameFn();
      me = getVoterName();
      if (!me) return;
    }

    btn.disabled = true;
    const alreadyVoted = !!currentVoters[me];
    try {
      if (alreadyVoted) {
        await updateDoc(ref, { [`voters.${me}`]: deleteField() });
      } else {
        try {
          await updateDoc(ref, { [`voters.${me}`]: true });
        } catch {
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
}

document.addEventListener("DOMContentLoaded", () => {
  const cityKey = getCityKey();
  const openNameModal = buildNameModal();
  const { promptName } = buildNameBadge(openNameModal);
  promptNameFn = promptName;

  document.querySelectorAll(".poi-card").forEach((card) => attachVoting(card, cityKey));
});