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
  


  // Export PDF — même identité graphique que le planificateur
  $("expPdf").onclick = () => {
    if (!window.jspdf?.jsPDF) {
      alert("La bibliothèque PDF n'a pas pu être chargée. Vérifie ta connexion.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    const COLORS = {
      ink: [27, 42, 65],
      indigo: [37, 60, 99],
      seal: [178, 58, 46],
      gold: [166, 135, 59],
      muted: [111, 106, 97],
      paper: [250, 248, 243],
      line: [221, 215, 202],
      white: [255, 255, 255],
      green: [63, 122, 92]
    };

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;

    const rate = Math.max(1, Number(S.rate) || 165);
    const allItems = [...S.items];

    // Reprendre le tri choisi dans le planner
    allItems.sort(
      sort === "city"
        ? (a, b) => a.city - b.city || a.done - b.done || a.prio - b.prio
        : (a, b) => a.done - b.done || a.prio - b.prio || a.cat - b.cat
    );

    const totalYen = allItems.reduce(
      (sum, item) => sum + item.price * item.qty, 0
    );

    const remainingYen = allItems
      .filter(item => !item.done)
      .reduce((sum, item) => sum + item.price * item.qty, 0);

    const totalWeight = allItems.reduce(
      (sum, item) => sum + item.wt * item.qty, 0
    ) / 1000;

    const remainingWeight = allItems
      .filter(item => !item.done)
      .reduce((sum, item) => sum + item.wt * item.qty, 0) / 1000;

    const euro = yen => yen / rate;
    const money = value => Math.round(value).toLocaleString("fr-FR");
    const decimal = value => (Math.round(value * 10) / 10).toLocaleString("fr-FR");

    const cityName = item => CITIES[item.city] || "Sans préférence";

    // Les polices standards de jsPDF ne prennent pas en charge les emoji.
    // On conserve donc le libellé textuel des catégories et des priorités.
    const categoryName = item =>
      (CATS[item.cat] || "Autre").replace(/^[^\p{L}\p{N}]*/u, "");

    const priorityName = item => ({
      1: "Indispensable",
      2: "Si possible",
      3: "Bonus"
    }[item.prio] || "Si possible");

    function paintBackground() {
      doc.setFillColor(...COLORS.paper);
      doc.rect(0, 0, pageWidth, pageHeight, "F");
    }

    function drawSeal(x, y) {
      doc.setDrawColor(...COLORS.seal);
      doc.setLineWidth(0.9);
      doc.circle(x, y, 6.5, "S");
      doc.setLineWidth(0.4);
      doc.circle(x, y, 4.4, "S");
      doc.setFillColor(...COLORS.seal);
      doc.circle(x, y, 1, "F");
    }

    function drawHeader(pageNumber) {
      paintBackground();

      drawSeal(margin + 6, 22);

      doc.setTextColor(...COLORS.ink);
      doc.setFont("times", "bold");
      doc.setFontSize(19);
      doc.text("Liste shopping — Japon", margin + 17, 19);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.gold);
      doc.text(
        "SOUVENIRS · ACHATS · LISTE DE SOUHAITS",
        margin + 17,
        25
      );

      doc.setDrawColor(...COLORS.line);
      doc.setLineWidth(0.3);
      doc.line(margin, 34, pageWidth - margin, 34);

      doc.setFontSize(8);
      doc.setTextColor(...COLORS.muted);
      doc.text(
        `Généré le ${new Date().toLocaleDateString("fr-FR")}`,
        pageWidth - margin,
        29,
        { align: "right" }
      );
    }

    function drawFooter(page, totalPages) {
      doc.setDrawColor(...COLORS.line);
      doc.setLineWidth(0.25);
      doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(...COLORS.muted);
      doc.text("Généré par le planner shopping Japon 2027", margin, pageHeight - 9);
      doc.text(`${page} / ${totalPages}`, pageWidth - margin, pageHeight - 9, {
        align: "right"
      });
    }

    let y = 42;

    drawHeader(1);

    // Résumé en trois blocs
    const summaryY = y;
    const gap = 3;
    const cardWidth = (contentWidth - gap * 2) / 3;

    const summaries = [
      {
        label: "ARTICLES",
        value: `${allItems.length}`,
        detail: `${allItems.filter(item => !item.done).length} restant(s)`
      },
      {
        label: "RESTE À ACHETER",
        value: `${money(remainingYen)} ¥`,
        detail: `≈ ${decimal(euro(remainingYen))} €`
      },
      {
        label: "BUDGET TOTAL",
        value: S.budget ? `${decimal(S.budget)} €` : "Non défini",
        detail: S.budget
          ? `${decimal(euro(totalYen))} € engagés`
          : "Aucun plafond renseigné"
      }
    ];

    summaries.forEach((card, index) => {
      const x = margin + index * (cardWidth + gap);

      doc.setFillColor(...COLORS.white);
      doc.setDrawColor(...COLORS.line);
      doc.roundedRect(x, summaryY, cardWidth, 23, 2, 2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.gold);
      doc.text(card.label, x + 3, summaryY + 6);

      doc.setFont("times", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...COLORS.ink);
      doc.text(card.value, x + 3, summaryY + 13);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.muted);
      doc.text(card.detail, x + 3, summaryY + 19);
    });

    y += 32;

    doc.setFont("times", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...COLORS.indigo);
    doc.text("Ma liste de souhaits", margin, y);
    y += 7;

    // Colonnes du tableau
    const columns = {
      item: margin,
      city: margin + 91,
      qty: margin + 119,
      price: margin + 139,
      status: margin + 160
    };

    const headerHeight = 8;
    const rowBottom = pageHeight - 21;

    function drawTableHeader() {
      doc.setFillColor(239, 234, 224);
      doc.roundedRect(margin, y - 5, contentWidth, headerHeight, 1.5, 1.5, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.indigo);

      doc.text("ARTICLE / DÉTAILS", columns.item + 3, y);
      doc.text("VILLE", columns.city, y);
      doc.text("QTÉ", columns.qty, y, { align: "center" });
      doc.text("PRIX TOTAL", columns.price, y);
      doc.text("STATUT", columns.status, y);

      y += 7;
    }

    function newPage() {
      doc.addPage();
      drawHeader(doc.internal.getNumberOfPages());
      y = 43;
      drawTableHeader();
    }

    drawTableHeader();

    if (allItems.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.muted);
      doc.text("Aucun article dans la liste pour le moment.", margin + 2, y + 5);
      y += 14;
    }

    allItems.forEach(item => {
      const details = [
        categoryName(item),
        priorityName(item),
        item.shop ? `Boutique : ${item.shop}` : "",
        item.who ? `Pour : ${item.who}` : "",
        item.wt ? `Poids : ${money(item.wt * item.qty)} g` : ""
      ].filter(Boolean).join(" · ");

      const detailLines = doc.splitTextToSize(details, 64);
      const nameLines = doc.splitTextToSize(item.name || "Sans nom", 64);

      const textHeight = nameLines.length * 4.2 + detailLines.length * 3.4;
      const rowHeight = Math.max(15, textHeight + 5);

      if (y + rowHeight > rowBottom) {
        newPage();
      }

      // Séparation visuelle des articles
      doc.setDrawColor(...COLORS.line);
      doc.setLineWidth(0.2);
      doc.line(margin, y + rowHeight - 2, pageWidth - margin, y + rowHeight - 2);

      if (item.done) {
        doc.setFillColor(240, 240, 236);
        doc.roundedRect(margin, y - 4, contentWidth, rowHeight, 1, 1, "F");
      }

      let textX = columns.item + 3;

      // Miniature facultative
      if (IMG_RE.test(item.img || "")) {
        try {
          doc.addImage(item.img, "JPEG", textX, y - 3, 11, 11);
          textX += 14;
        } catch (error) {
          console.warn("Photo ignorée dans le PDF :", error);
        }
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...(item.done ? COLORS.muted : COLORS.ink));
      doc.text(nameLines, textX, y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.8);
      doc.setTextColor(...COLORS.muted);
      doc.text(detailLines, textX, y + nameLines.length * 4.2);

      doc.setFontSize(7.5);
      doc.setTextColor(...COLORS.ink);
      doc.text(cityName(item), columns.city, y + 1);

      doc.text(String(item.qty), columns.qty, y + 1, { align: "center" });

      if (item.price) {
        doc.setFont("helvetica", "bold");
        doc.text(`${money(item.price * item.qty)} ¥`, columns.price, y);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(...COLORS.muted);
        doc.text(
          `≈ ${decimal(euro(item.price * item.qty))} €`,
          columns.price,
          y + 4
        );
      } else {
        doc.text("—", columns.price, y + 1);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(...(item.done ? COLORS.green : COLORS.seal));
      doc.text(item.done ? "Acheté" : "À acheter", columns.status, y + 1);

      y += rowHeight;
    });

    // Informations récapitulatives
    if (y + 44 > rowBottom) {
      newPage();
    } else {
      y += 7;
    }

    doc.setFont("times", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...COLORS.indigo);
    doc.text("Budget et bagages", margin, y);
    y += 8;

    const info = [
      ["Taux de conversion", `1 € = ${money(rate)} ¥`],
      ["Valeur totale de la liste", `${money(totalYen)} ¥ · ${decimal(euro(totalYen))} €`],
      ["Reste à acheter", `${money(remainingYen)} ¥ · ${decimal(euro(remainingYen))} €`],
      ["Poids total des articles", `${decimal(totalWeight)} kg`],
      ["Poids restant à acheter", `${decimal(remainingWeight)} kg`],
      ["Franchise bagages", S.kg ? `${decimal(S.kg)} kg` : "Non définie"],
      ["Budget renseigné", S.budget ? `${decimal(S.budget)} €` : "Non défini"],
      [
        "Écart avec le budget",
        S.budget
          ? `${decimal(S.budget - euro(totalYen))} €`
          : "Non calculé"
      ]
    ];

    info.forEach(([label, value]) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.muted);
      doc.text(label, margin + 2, y);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.ink);
      doc.text(value, pageWidth - margin - 2, y, { align: "right" });

      y += 6;
    });

    // Pieds de page sur toutes les pages
    const totalPages = doc.internal.getNumberOfPages();

    for (let page = 1; page <= totalPages; page++) {
      doc.setPage(page);
      drawFooter(page, totalPages);
    }

    // Téléchargement direct, sans fenêtre d'impression
    doc.save("japon-liste-shopping.pdf");
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

  function showPrev() {
    const has = IMG_RE.test(pendingImg);
    $("photoImg").hidden = !has;
    $("photoEmpty").hidden = has;
    $("imgClr").hidden = !has;
    $("imgPick").textContent = has ? "🔄 Changer la photo" : "📷 Choisir une photo";
    if (has) $("photoImg").src = pendingImg;
    else { $("photoImg").removeAttribute("src"); $("img").value = ""; }
  }

  $("img").onchange = async e => {
    const f = e.target.files[0];
    if (!f) return;
    try { pendingImg = await compressImage(f); showPrev(); }
    catch (err) { alert(err.message); e.target.value = ""; }
  };
  $("imgClr").onclick = () => { pendingImg = ""; showPrev(); };

  $("imgPick").onclick = () => $("img").click();

  // Premier affichage
  showPrev();
  render();
  