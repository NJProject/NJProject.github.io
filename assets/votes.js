// votes.js
import { db } from "./firebase-config.js";
import {
  doc, onSnapshot, updateDoc, setDoc, deleteField, collection, getDocs
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
async function fetchKnownVoterNames() {
  try {
    const snap = await getDocs(collection(db, "votes"));
    const names = new Set();
    snap.forEach(docSnap => {
      const voters = docSnap.data().voters || {};
      Object.keys(voters).forEach(n => names.add(n));
    });
    return [...names].sort((a, b) => a.localeCompare(b));
  } catch (e) {
    console.error("Impossible de récupérer les prénoms existants :", e);
    return [];
  }
}

function buildNameModal() {
  const overlay = document.createElement("div");
  overlay.className = "name-modal-overlay";
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="name-modal" role="dialog" aria-modal="true" aria-labelledby="nameModalTitle">
      <div class="name-modal-seal">印</div>
      <h3 id="nameModalTitle">Ton prénom</h3>
      <p class="name-modal-sub">Affiché à côté de tes votes, pour que le groupe sache qui a voté quoi.</p>
      <select id="nameModalSelect">
        <option value="">— Choisir un prénom déjà utilisé —</option>
      </select>
      <p class="name-modal-or">ou saisis un nouveau prénom :</p>
      <input type="text" id="nameModalInput" maxlength="24" placeholder="Ex. Nicolas" autocomplete="off">
      <div class="name-modal-actions">
        <button type="button" class="name-modal-cancel">Annuler</button>
        <button type="button" class="name-modal-save">Valider</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const select = overlay.querySelector("#nameModalSelect");
  const input = overlay.querySelector("#nameModalInput");
  const saveBtn = overlay.querySelector(".name-modal-save");
  const cancelBtn = overlay.querySelector(".name-modal-cancel");
  let resolveFn = null;

  select.addEventListener("change", () => {
    if (select.value) input.value = select.value;
  });

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

  return async function open(currentValue) {
    input.value = currentValue || "";
    select.value = "";

    const names = await fetchKnownVoterNames();
    select.innerHTML = '<option value="">— Choisir un prénom déjà utilisé —</option>'
      + names.map(n => `<option value="${n}">${n}</option>`).join("");

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

// ---------- Résumé des votes en haut de page ----------
function buildVoteSummary(cityKey) {
  const el = document.getElementById("voteSummary");
  if (!el) return;

  onSnapshot(collection(db, "votes"), (snap) => {
    const prefix = `${cityKey}--`;
    const voterSet = new Set();
    let withVotes = 0;
    const voteCounts = [];

    snap.forEach((docSnap) => {
      const voters = docSnap.data().voters || {};
      const names = Object.keys(voters);
      names.forEach((n) => voterSet.add(n));
      if (docSnap.id.startsWith(prefix) && names.length > 0) {
        withVotes++;
        voteCounts.push(names.length);
      }
    });

    const totalVoters = voterSet.size;
    const majority = totalVoters >= 2 ? Math.ceil(totalVoters / 2) : null;
    const highVotes = majority ? voteCounts.filter((n) => n >= majority).length : 0;

    if (withVotes === 0) {
      el.hidden = true;
      return;
    }

    const parts = [
      `${withVotes} activité${withVotes > 1 ? "s ont" : " a"} reçu au moins un vote`
    ];
    if (majority && highVotes > 0) {
      parts.push(`${highVotes} activité${highVotes > 1 ? "s ont" : " a"} la majorité des votes (≥ ${majority}/${totalVoters})`);
    }

    el.hidden = false;
    el.innerHTML = parts.map((p) => `<span>${p}</span>`).join("");
  });
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
    <div class="poi-vote-buttons">
      <button type="button" class="poi-vote-btn" aria-label="Voter pour ce lieu">
        🗳️ <span class="poi-vote-count">0</span>
      </button>
      <button type="button" class="poi-exclude-btn" aria-label="Je ne veux pas faire ça">
        🚫 <span class="poi-exclude-count">0</span>
      </button>
    </div>
    <div class="poi-vote-names" hidden></div>
  `;
  card.appendChild(wrap);

  const btn = wrap.querySelector(".poi-vote-btn");
  const countEl = wrap.querySelector(".poi-vote-count");
  const excludeBtn = wrap.querySelector(".poi-exclude-btn");
  const excludeCountEl = wrap.querySelector(".poi-exclude-count");
  const namesEl = wrap.querySelector(".poi-vote-names");

  let currentVoters = {};
  let currentExcluders = {};

  function render() {
    const names = Object.keys(currentVoters);
    const excludedNames = Object.keys(currentExcluders);
    countEl.textContent = names.length;
    excludeCountEl.textContent = excludedNames.length;

    const parts = [];
    parts.push(names.length ? `Pour : ${names.join(", ")}` : "Aucun vote pour l'instant");
    if (excludedNames.length) parts.push(`Ne veulent pas : ${excludedNames.join(", ")}`);
    namesEl.textContent = parts.join(" · ");

    const me = getVoterName();
    btn.classList.toggle("voted", !!me && !!currentVoters[me]);
    excludeBtn.classList.toggle("excluded", !!me && !!currentExcluders[me]);
  }

  onSnapshot(ref, (snap) => {
    const data = snap.exists() ? snap.data() : {};
    currentVoters = data.voters || {};
    currentExcluders = data.excluders || {};
    render();
  });

  countEl.addEventListener("click", (e) => {
    e.stopPropagation();
    namesEl.hidden = !namesEl.hidden;
  });

  async function toggleField(fieldName, oppositeFieldName, currentMap, oppositeMap) {
    let me = getVoterName();
    if (!me) {
      if (promptNameFn) await promptNameFn();
      me = getVoterName();
      if (!me) return;
    }

    const already = !!currentMap[me];
    try {
      const updates = {};
      if (already) {
        updates[`${fieldName}.${me}`] = deleteField();
      } else {
        updates[`${fieldName}.${me}`] = true;
        // Voter pour et exclure sont mutuellement exclusifs — activer l'un retire l'autre.
        if (oppositeMap[me]) updates[`${oppositeFieldName}.${me}`] = deleteField();
      }
      try {
        await updateDoc(ref, updates);
      } catch {
        await setDoc(ref, { [fieldName]: { [me]: true } }, { merge: true });
      }
    } catch (e) {
      console.error("Erreur de vote :", e);
    }
  }

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    await toggleField("voters", "excluders", currentVoters, currentExcluders);
    btn.disabled = false;
  });

  excludeBtn.addEventListener("click", async () => {
    excludeBtn.disabled = true;
    await toggleField("excluders", "voters", currentExcluders, currentVoters);
    excludeBtn.disabled = false;
  });

  document.addEventListener("voterNameChanged", render);
}

document.addEventListener("DOMContentLoaded", () => {
  const cityKey = getCityKey();
  const openNameModal = buildNameModal();
  const { promptName } = buildNameBadge(openNameModal);
  promptNameFn = promptName;

  document.querySelectorAll(".poi-card").forEach((card) => attachVoting(card, cityKey));
  buildVoteSummary(cityKey);
});