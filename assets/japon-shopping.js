const CATS = [
    "🍫 Snacks & sucreries",
    "🍵 Thé & alimentation",
    "🎮 Jeux & figurines",
    "📚 Manga & livres",
    "👕 Vêtements",
    "💄 Beauté & santé",
    "🔪 Cuisine & maison",
    "✏️ Papeterie",
    "🎁 Cadeaux",
    "📦 Autre"
  ];
  
  const PR = ["", "⭐", "👍", "💭"];
  
  let pendingImg = "";
  const IMG_RE = /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/;
  
  function compressImage(file, max = 320, q = 0.72) {
    return new Promise((resolve, reject) => {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return reject(new Error("Format non supporté (JPG, PNG ou WebP)."));
      if (file.size > 10 * 1024 * 1024) return reject(new Error("Fichier trop lourd (10 Mo max)."));
      const url = URL.createObjectURL(file);
      const im = new Image();
      im.onload = () => {
        const r = Math.min(1, max / Math.max(im.width, im.height));
        const c = document.createElement("canvas");
        c.width = Math.round(im.width * r);
        c.height = Math.round(im.height * r);
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(im, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL("image/jpeg", q));
      };
      im.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image illisible.")); };
      im.src = url;
    });
  }
  
  // Valide chaque article venant du stockage ou d'un fichier importé
  function cleanItem(i) {
    const city = Number(i.city);
    return {
      id: Number(i.id) || Date.now() + Math.random(),
      done: !!i.done,
      name: String(i.name || "").slice(0, 120),
      cat: Math.min(Math.max(parseInt(i.cat) || 0, 0), CATS.length - 1),
      price: Math.max(0, +i.price || 0),
      qty: Math.max(1, Math.min(999, +i.qty || 1)),
      prio: [1, 2, 3].includes(+i.prio) ? +i.prio : 2,
      city: Number.isInteger(city) && city >= 0 && city <= 5 ? city : 5,
      wt: Math.max(0, +i.wt || 0),
      shop: String(i.shop || "").slice(0, 120),
      who: String(i.who || "").slice(0, 120),
      img: IMG_RE.test(i.img || "") ? i.img : ""
    };
  }

  let S = {
    items: [],
    rate: 165,
    budget: 0,
    kg: 0
  };
  
  let filter = "all";
  let sort = "prio";
  let editId = null;
  
  try {
    const saved = localStorage.getItem("japon-shop");
    if (saved) S = Object.assign(S, JSON.parse(saved));
  } catch (error) {
    console.warn("Impossible de charger les données sauvegardées.", error);
  }

  S.items = (Array.isArray(S.items) ? S.items : []).slice(0, 500).map(cleanItem);
  
  const $ = id => document.getElementById(id);
  
  const save = () => {
    try { localStorage.setItem("japon-shop", JSON.stringify(S)); }
    catch (error) { alert("Stockage plein : retire quelques photos ou exporte ta liste."); }
  };
  
  const esc = value =>
    String(value).replace(/[&<>"]/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;"
    })[char]);
  
  const fmt = number =>
    Math.round(number).toLocaleString("fr-FR");
  
  const fmt1 = number =>
    (Math.round(number * 10) / 10).toLocaleString("fr-FR");
  
  const CITIES = [
    "Osaka",
    "Nara",
    "Kyoto",
    "Kanazawa",
    "Tokyo",
    "Sans préférence"
  ];
  
  const meter = (label, value, maximum, unit) => {
    const percent = maximum
      ? Math.min(100, 100 * value / maximum)
      : 0;
  
    const over = maximum && value > maximum;
  
    return `
      <div class="mt">
        <div class="mr">
          <span>${label}</span>
          <span class="${over ? "ov" : ""}">
            ${fmt1(value)} / ${maximum ? fmt1(maximum) : "—"} ${unit}
            ${over ? " ⚠️ dépassé" : ""}
          </span>
        </div>
        <div class="bar" style="margin-bottom:0">
          <i style="width:${percent}%;background:${over ? "var(--ac)" : "var(--ok)"}"></i>
        </div>
      </div>
    `;
  };
  
  // Initialisation des sélecteurs
  
  $("cat").innerHTML = CATS
    .map((category, index) =>
      `<option value="${index}">${category}</option>`
    )
    .join("");
  
  $("rate").value = S.rate;
  
  $("city").innerHTML = CITIES
    .map((city, index) =>
      `<option value="${index}" ${index === 5 ? "selected" : ""}>
        ${index < 5 ? "📍 " : ""}${city}
      </option>`
    )
    .join("");
  
  S.items.forEach(item => {
    if (item.city == null) item.city = 5;
    if (item.wt == null) item.wt = 0;
  });
  
  // Affichage de la liste
  
  function render() {
    const items = S.items;
    const todo = items.filter(item => !item.done);
  
    const yen = todo.reduce(
      (total, item) => total + (item.price || 0) * item.qty,
      0
    );
  
    $("sN").textContent = `${todo.length} / ${items.length}`;
    $("sY").textContent = `${fmt(yen)} ¥`;
    $("sE").textContent = `${fmt(yen / (S.rate || 165))} €`;
  
    $("pg").style.width =
      (items.length
        ? 100 * (items.length - todo.length) / items.length
        : 0) + "%";
  
    if (document.activeElement !== $("budget")) {
      $("budget").value = S.budget || "";
    }
  
    if (document.activeElement !== $("kg")) {
      $("kg").value = S.kg || "";
    }
  
    const all = items.reduce(
      (total, item) => total + (item.price || 0) * item.qty,
      0
    ) / (S.rate || 165);
  
    $("budInfo").innerHTML = S.budget
      ? meter("💶 Budget (liste complète)", all, S.budget, "€")
      : "";
  
    const weight = items.reduce(
      (total, item) => total + (item.wt || 0) * item.qty,
      0
    ) / 1000;
  
    $("wgtInfo").innerHTML = (S.kg || weight)
      ? meter("🧳 Poids des achats", weight, S.kg || 0, "kg")
      : "";
  
    const filters = [
      ["all", "Tout"],
      ["todo", "À acheter"],
      ["done", "Achetés"]
    ].map(([key, label]) =>
      `<button class="chip ${filter === key ? "on" : ""}" data-f="${key}">
        ${label}
      </button>`
    );
  
    CATS.forEach((category, index) => {
      if (items.some(item => item.cat === index)) {
        filters.push(`
          <button class="chip ${filter === "c" + index ? "on" : ""}" data-f="c${index}">
            ${category.split(" ")[0]}
          </button>
        `);
      }
    });
  
    $("filters").innerHTML = filters.join("");
  
    let visible = [...items].filter(item =>
      filter === "all" ||
      (filter === "todo" && !item.done) ||
      (filter === "done" && item.done) ||
      filter === "c" + item.cat
    );
  
    visible.sort(
      sort === "city"
        ? (a, b) =>
            a.city - b.city ||
            a.done - b.done ||
            a.prio - b.prio
        : (a, b) =>
            a.done - b.done ||
            a.prio - b.prio ||
            a.cat - b.cat
    );
  
    const heading = (list, index) =>
      sort === "city" &&
      (index === 0 || list[index - 1].city !== list[index].city)
        ? `<h3 class="gh">${list[index].city < 5 ? "📍 " : ""}${CITIES[list[index].city]}</h3>`
        : "";
  
    $("list").innerHTML = visible.length
      ? visible.map((item, index) => `
          ${heading(visible, index)}
          <div class="item ${item.done ? "done" : ""}">
            <input
              type="checkbox"
              data-t="${item.id}"
              ${item.done ? "checked" : ""}
              aria-label="Acheté"
            >

            ${IMG_RE.test(item.img || "") ? `<img class="thumb" src="${item.img}" alt="">` : ""}

            <div class="bd">
              <div class="nm">
                ${PR[item.prio]} ${esc(item.name)}
                ${item.qty > 1 ? " ×" + item.qty : ""}
              </div>
  
              <div class="meta">
                <span class="tag">${CATS[item.cat] || "📦 Autre"}</span>
                ${item.shop ? `<span>📍 ${esc(item.shop)}</span>` : ""}
                ${item.who ? `<span>🎁 ${esc(item.who)}</span>` : ""}
                ${sort !== "city" && item.city < 5
                  ? `<span>🗺️ ${CITIES[item.city]}</span>`
                  : ""}
                ${item.wt
                  ? `<span>⚖️ ${item.wt * item.qty} g</span>`
                  : ""}
              </div>
            </div>
  
            <div class="pr">
              ${item.price
                ? `${fmt(item.price * item.qty)} ¥<br>
                   <span style="color:var(--mu)">
                     ≈ ${fmt(item.price * item.qty / (S.rate || 165))} €
                   </span>`
                : ""}
            </div>
  
            <button class="x" data-e="${item.id}" aria-label="Modifier">✎</button>
            <button class="x" data-d="${item.id}" aria-label="Supprimer">×</button>
          </div>
        `).join("")
      : `<div class="empty">Rien ici pour le moment 🗾</div>`;
  }
  
  // Mode ajout / modification
  
  const setMode = () => {
    $("add").textContent = editId
      ? "Enregistrer les modifications"
      : "Ajouter à la liste";
  
    $("cancel").hidden = !editId;
  
    if (!editId) {
      document.querySelector(".more").open = false;
      $("cat").value = 0;
      $("prio").value = 2;
      $("city").value = 5;
    }
  };
  
  const startEdit = id => {
    const item = S.items.find(item => String(item.id) === id);
    if (!item) return;
  
    editId = item.id;
  
    $("name").value = item.name;
    $("cat").value = item.cat;
    $("price").value = item.price || "";
    $("qty").value = item.qty;
    $("prio").value = item.prio;
    $("city").value = item.city;
    $("wt").value = item.wt || "";
    $("shop").value = item.shop || "";
    $("for").value = item.who || "";
    pendingImg = item.img || ""; showPrev();
  
    setMode();
  
    document.querySelector(".more").open = true;
    $("name").scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
    $("name").focus();
  };
  
  // Ajouter ou enregistrer un article
  
  $("add").onclick = () => {
    const name = $("name").value.trim();
  
    if (!name) {
      $("name").focus();
      return;
    }
  
    const existing = editId
      ? S.items.find(item => item.id === editId)
      : null;
  
    const item = Object.assign(
      existing || {
        id: Date.now() + Math.random(),
        done: false
      },
      {
        name,
        cat: +$("cat").value,
        price: +$("price").value || 0,
        qty: Math.max(1, +$("qty").value || 1),
        prio: +$("prio").value,
        city: +$("city").value,
        wt: +$("wt").value || 0,
        shop: $("shop").value.trim(),
        who: $("for").value.trim(),
        img: pendingImg,
      }
    );
  
    if (!existing) S.items.push(item);
  
    editId = null;
  
    ["name", "price", "shop", "for", "wt"].forEach(
      id => $(id).value = ""
    );
  
    $("qty").value = 1;

    pendingImg = ""; showPrev();
  
    setMode();
    save();
    render();
    $("name").focus();
  };
  
  ["name", "price"].forEach(id => {
    $(id).onkeydown = event => {
      if (event.key === "Enter") $("add").click();
    };
  });
  
  // Taux de change
  
  $("rate").onchange = event => {
    S.rate = Math.max(1, +event.target.value || 165);
    save();
    render();
  };
  
  // Filtres
  
  $("filters").onclick = event => {
    const selected = event.target.dataset.f;
  
    if (selected) {
      filter = selected;
      render();
    }
  };
  
  // Actions sur les articles
  
  $("list").onclick = event => {
    const target = event.target.dataset;
  
    if (target.t) {
      const item = S.items.find(
        item => String(item.id) === target.t
      );
  
      if (item) {
        item.done = event.target.checked;
        save();
        render();
      }
    }
  
    if (target.d) {
      if (String(editId) === target.d) {
        editId = null;
        setMode();
      }
  
      S.items = S.items.filter(
        item => String(item.id) !== target.d
      );
  
      save();
      render();
    }
  
    if (target.e) startEdit(target.e);
  };
  
  // Retirer les articles achetés
  
  $("clr").onclick = () => {
    if (
      S.items.some(item => item.done) &&
      confirm("Retirer tous les articles achetés ?")
    ) {
      S.items = S.items.filter(item => !item.done);
      save();
      render();
    }
  };
  
  // Export JSON
  
  $("exp").onclick = () => {
    const link = document.createElement("a");
  
    link.href =
      "data:application/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(S));
  
    link.download = "japon-liste.json";
    link.click();
  };
  
  // Import JSON
  
  $("imp").onclick = () => $("file").click();
  
  $("file").onchange = event => {
    const reader = new FileReader();
  
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
  
        if (Array.isArray(data.items)) {
          S.items = data.items.slice(0, 500).map(cleanItem);
          S.rate = Math.max(1, +data.rate || 165);
          S.budget = Math.max(0, +data.budget || 0);
          S.kg = Math.max(0, +data.kg || 0);
          $("rate").value = S.rate;
          save();
          render();
        }
      } catch (error) {
        alert("Fichier invalide");
      }
    };
  
    if (event.target.files[0]) {
      reader.readAsText(event.target.files[0]);
    }
  };
  
  // Copier la liste
  
  $("shr").onclick = async () => {
    const text = S.items
      .filter(item => !item.done)
      .map(item =>
        `☐ ${item.name}${item.qty > 1 ? " ×" + item.qty : ""}${item.price ? " — " + fmt(item.price * item.qty) + " ¥" : ""}`
      )
      .join("\n");
  
    try {
      await navigator.clipboard.writeText(text || "Liste vide");
      $("shr").textContent = "Copié ✓";
    } catch (error) {
      prompt("Copie la liste :", text);
    }
  
    setTimeout(() => {
      $("shr").textContent = "Copier la liste";
    }, 1500);
  };
  
  // Budget et franchise bagages
  
  $("budget").onchange = event => {
    S.budget = Math.max(0, +event.target.value || 0);
    save();
    render();
  };
  
  $("kg").onchange = event => {
    S.kg = Math.max(0, +event.target.value || 0);
    save();
    render();
  };
  
  // Tri
  
  $("sort").onchange = event => {
    sort = event.target.value;
    render();
  };
  
  // Thème clair / sombre
  
  const dark = () => {
    const theme = document.documentElement.dataset.theme;
  
    return theme
      ? theme === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches;
  };
  
  const setTheme = theme => {
    document.documentElement.dataset.theme = theme;
  
    $("theme").textContent =
      theme === "dark" ? "☀️ Mode clair" : "🌙 Mode sombre";
  };
  
  try {
    const theme = localStorage.getItem("japon-theme");
    if (theme) document.documentElement.dataset.theme = theme;
  } catch (error) {
    console.warn("Impossible de charger le thème.");
  }
  
  setTheme(dark() ? "dark" : "light");
  
  $("theme").onclick = () => {
    const theme = dark() ? "light" : "dark";
  
    setTheme(theme);
  
    try {
      localStorage.setItem("japon-theme", theme);
    } catch (error) {
      console.warn("Impossible de sauvegarder le thème.");
    }
  };
  
  // Annuler une modification
  
  $("cancel").onclick = () => {
    editId = null;
  
    ["name", "price", "shop", "for", "wt"].forEach(
      id => $(id).value = ""
    );
  
    $("qty").value = 1;
    setMode();
  };
  
  // Premier affichage
  function showPrev() {
    const box = $("imgPrev");
    if (IMG_RE.test(pendingImg)) {
      box.querySelector("img").src = pendingImg;
      box.hidden = false;
    } else {
      box.hidden = true;
      $("img").value = "";
    }
  }
  $("img").onchange = async e => {
    const f = e.target.files[0];
    if (!f) return;
    try { pendingImg = await compressImage(f); showPrev(); }
    catch (err) { alert(err.message); e.target.value = ""; }
  };
  $("imgClr").onclick = () => { pendingImg = ""; showPrev(); };

  render();
  