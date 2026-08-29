// custom-pois.js
import { db } from "/firebase-config.js";
import { attachVoting } from "/votes.js?v=5";
import {
  collection, query, where, onSnapshot,
  doc, setDoc, deleteDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const NAME_KEY = "voterName";

const CATS = {
  touristique: ["🗺️", "Touristique"],
  culturel: ["⛩️", "Culturel"],
  commerces: ["🛍️", "Commerces"],
  gastronomie: ["🍜", "Gastronomie"],
  loisirs: ["🎢", "Parcs & loisirs"],
  nightlife: ["🌃", "Vie nocturne"],
  randonnee: ["🥾", "Randonnée"],
  otaku: ["🎮", "Otaku / Geek"]
};

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

function isAdmin() {
  return new URLSearchParams(location.search).get("admin") === "1";
}

function getVoterName() {
  return (localStorage.getItem(NAME_KEY) || "").trim();
}

function ensureFilterChip(cat) {
  const bar = document.querySelector(".filter-bar");
  if (!bar || bar.querySelector(`.filter-chip[data-cat="${cat}"]`)) return;
  const [icon, label] = CATS[cat] || ["🔖", cat];
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "filter-chip";
  btn.dataset.cat = cat;
  btn.textContent = `${icon} ${label}`;
  bar.appendChild(btn);
}

function buildCard(id, data) {
  const [icon, label] = CATS[data.category] || ["🔖", data.category];

  const card = document.createElement("article");
  card.className = "poi-card";
  card.dataset.cat = data.category;

  const top = document.createElement("div");
  top.className = "poi-top";
  const iconSpan = document.createElement("span");
  iconSpan.className = "poi-icon";
  iconSpan.textContent = data.icon || icon;
  const catSpan = document.createElement("span");
  catSpan.className = `poi-cat cat-${data.category}`;
  catSpan.textContent = label;
  top.append(iconSpan, catSpan);

  const h4 = document.createElement("h4");
  h4.textContent = data.title;

  const p = document.createElement("p");
  p.textContent = data.description || "";

  card.append(top, h4, p);

  if (data.meta) {
    const meta = document.createElement("div");
    meta.className = "poi-meta";
    meta.textContent = data.meta;
    card.appendChild(meta);
  }

  if (data.link) {
    const linkWrap = document.createElement("div");
    linkWrap.className = "poi-link";
    const a = document.createElement("a");
    a.href = data.link;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = data.linkLabel || "Réserver / infos ↗";
    linkWrap.appendChild(a);
    card.appendChild(linkWrap);
  }

  const badge = document.createElement("div");
  badge.className = "poi-custom-badge";
  badge.textContent = "✏️ Ajouté par le groupe";
  card.appendChild(badge);

  if (isAdmin()) {
    const del = document.createElement("button");
    del.type = "button";
    del.className = "poi-custom-delete";
    del.textContent = "🗑️ Supprimer";
    del.addEventListener("click", async () => {
      if (!confirm(`Supprimer « ${data.title} » ?`)) return;
      await deleteDoc(doc(db, "customPois", id));
    });
    card.appendChild(del);
  }

  return card;
}

function buildAddModal(cityKey, grid) {
  const overlay = document.createElement("div");
  overlay.className = "poi-modal-overlay";
  overlay.hidden = true;

  const options = Object.entries(CATS)
    .map(([key, [icon, label]]) => `<option value="${key}">${icon} ${label}</option>`)
    .join("");

  overlay.innerHTML = `
    <div class="poi-modal" role="dialog" aria-modal="true" aria-labelledby="poiModalTitle">
      <div class="name-modal-seal">印</div>
      <h3 id="poiModalTitle">Ajouter un lieu</h3>
      <label>Titre<input type="text" id="poiTitle" maxlength="80" placeholder="Ex. Café à chats de Shibuya"></label>
      <label>Catégorie<select id="poiCategory">${options}</select></label>
      <label>Icône (emoji)<input type="text" id="poiIcon" placeholder="🐱"></label>
      <label>Description<textarea id="poiDescription" rows="3" placeholder="Ce qu'on y trouve, pourquoi c'est intéressant…"></textarea></label>
      <label>Info pratique <span class="opt">(optionnel)</span><input type="text" id="poiMeta" placeholder="Ex. 10 min à pied de la gare"></label>
      <label>Lien <span class="opt">(optionnel)</span><input type="url" id="poiLink" placeholder="https://…"></label>
      <div class="poi-modal-actions">
        <button type="button" class="name-modal-cancel" id="poiModalCancel">Annuler</button>
        <button type="button" class="name-modal-save" id="poiModalSave">Ajouter</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const titleInput = overlay.querySelector("#poiTitle");
  const catSelect = overlay.querySelector("#poiCategory");
  const iconInput = overlay.querySelector("#poiIcon");
  const descInput = overlay.querySelector("#poiDescription");
  const metaInput = overlay.querySelector("#poiMeta");
  const linkInput = overlay.querySelector("#poiLink");

  function close() {
    overlay.hidden = true;
    [titleInput, iconInput, descInput, metaInput, linkInput].forEach(el => el.value = "");
  }

  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  overlay.querySelector("#poiModalCancel").addEventListener("click", close);

  overlay.querySelector("#poiModalSave").addEventListener("click", async () => {
    const title = titleInput.value.trim();
    if (!title) { titleInput.focus(); return; }

    const id = `${cityKey}--${slugify(title)}`;
    const data = {
      city: cityKey,
      title,
      category: catSelect.value,
      icon: iconInput.value.trim(),
      description: descInput.value.trim(),
      meta: metaInput.value.trim(),
      link: linkInput.value.trim(),
      linkLabel: "",
      createdAt: serverTimestamp(),
      createdBy: getVoterName() || null
    };

    await setDoc(doc(db, "customPois", id), data);
    close();
  });

  return () => { overlay.hidden = false; setTimeout(() => titleInput.focus(), 50); };
}

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.querySelector(".poi-grid");
  if (!grid) return;

  const cityKey = getCityKey();

  if (isAdmin()) {
    const openModal = buildAddModal(cityKey, grid);
    const fab = document.createElement("button");
    fab.type = "button";
    fab.className = "add-poi-fab";
    fab.textContent = "＋ Ajouter un lieu";
    fab.addEventListener("click", openModal);
    document.body.appendChild(fab);
  }

  const rendered = new Map();
  const q = query(collection(db, "customPois"), where("city", "==", cityKey));

  onSnapshot(q, (snap) => {
    snap.docChanges().forEach((change) => {
      if (change.type === "removed") {
        rendered.get(change.doc.id)?.remove();
        rendered.delete(change.doc.id);
        return;
      }
      rendered.get(change.doc.id)?.remove();
      const data = change.doc.data();
      ensureFilterChip(data.category);
      const card = buildCard(change.doc.id, data);
      grid.appendChild(card);
      attachVoting(card, cityKey);
      rendered.set(change.doc.id, card);
    });
  });
});