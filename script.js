// Scroll-spy: highlight the active section in the nav
const links = document.querySelectorAll('#sidenav a');
const sections = Array.from(links).map(a => document.querySelector(a.getAttribute('href')));

function onScroll() {
  let idx = 0;
  const y = window.scrollY + 120;
  sections.forEach((s, i) => { if (s && s.offsetTop <= y) idx = i; });
  links.forEach(a => a.classList.remove('active'));
  if (links[idx]) links[idx].classList.add('active');
}
window.addEventListener('scroll', onScroll);
onScroll();

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const sidenav = document.getElementById('sidenav');

if (navToggle && sidenav) {
  navToggle.addEventListener('click', () => {
    sidenav.classList.toggle('open');
  });
  // Close the menu after tapping a link (mobile)
  links.forEach(a => a.addEventListener('click', () => {
    sidenav.classList.remove('open');
  }));
}

// Category filter (city pages)
const filterChips = document.querySelectorAll('.filter-chip');
const poiCards = document.querySelectorAll('.poi-card');

if (filterChips.length && poiCards.length) {
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const cat = chip.dataset.cat;
      poiCards.forEach(card => {
        if (cat === 'all' || card.dataset.cat === cat) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });
}

const CAL_MIN = { y: 2026, m: 7 };  // août 2026 (mois 0-indexé)
const CAL_MAX = { y: 2027, m: 2 };  // mars 2027
const TYPE_LABELS = { logement: 'Logement', attraction: 'Attraction', transport: 'Transport' };
const MONTH_NAMES = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
];

function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function eventsOn(iso) {
  return DEADLINES.filter(e => e.date === iso);
}

function formatShort(iso) {
  const d = parseISODate(iso);
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

const calGrid = document.getElementById('calGrid');
const calMonthLabel = document.getElementById('calMonthLabel');
const calPrev = document.getElementById('calPrev');
const calNext = document.getElementById('calNext');
const calDetail = document.getElementById('calDetail');
const calUpcoming = document.getElementById('calUpcoming');

if (calGrid && calMonthLabel && calPrev && calNext && calDetail) {
  let viewY = 2027;
  let viewM = 0; // janvier
  let selected = null;

  function inBounds(y, m) {
    const n = y * 12 + m;
    return n >= CAL_MIN.y * 12 + CAL_MIN.m && n <= CAL_MAX.y * 12 + CAL_MAX.m;
  }

  function showDetail(iso) {
    const items = eventsOn(iso);
    if (!items.length) {
      calDetail.hidden = true;
      calDetail.innerHTML = '';
      return;
    }
    calDetail.hidden = false;
    calDetail.innerHTML = items.map(e => `
      <div class="cal-detail-item">
        <strong>${e.title}</strong>
        <div class="cal-meta">
          <span class="cal-type-dot type-${e.type}"></span>
          ${TYPE_LABELS[e.type]} · ${formatShort(e.date)} · ${e.time}
        </div>
        <a href="${e.url}" target="_blank" rel="noopener noreferrer">${e.urlLabel}</a>
      </div>
    `).join('');
  }

  function render() {
    calMonthLabel.textContent = `${MONTH_NAMES[viewM]} ${viewY}`;
    calPrev.disabled = !inBounds(viewM === 0 ? viewY - 1 : viewY, viewM === 0 ? 11 : viewM - 1);
    calNext.disabled = !inBounds(viewM === 11 ? viewY + 1 : viewY, viewM === 11 ? 0 : viewM + 1);

    const first = new Date(viewY, viewM, 1);
    const startPad = (first.getDay() + 6) % 7; // lundi = 0
    const daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
    const todayIso = ymd(new Date());

    const cells = [];
    for (let i = 0; i < startPad; i++) {
      cells.push('<button type="button" class="cal-cell empty" tabindex="-1" disabled></button>');
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const iso = ymd(new Date(viewY, viewM, day));
      const evs = eventsOn(iso);
      const types = [...new Set(evs.map(e => e.type))];
      const cls = [
        'cal-cell',
        evs.length ? 'has-event' : '',
        iso === todayIso ? 'today' : '',
        iso === selected ? 'selected' : ''
      ].filter(Boolean).join(' ');
      const dots = types.map(t => `<span class="cal-type-dot type-${t}"></span>`).join('');
      const label = evs.length
        ? `${day} ${MONTH_NAMES[viewM]}, ${evs.length} échéance${evs.length > 1 ? 's' : ''}`
        : `${day} ${MONTH_NAMES[viewM]} ${viewY}`;
      cells.push(
        `<button type="button" class="${cls}" data-date="${iso}" aria-label="${label}">` +
        `<span class="cal-num">${day}</span>` +
        `<span class="cal-dots">${dots}</span>` +
        `</button>`
      );
    }
    calGrid.innerHTML = cells.join('');

    calGrid.querySelectorAll('.cal-cell.has-event').forEach(btn => {
      btn.addEventListener('click', () => {
        selected = btn.dataset.date;
        render();
        showDetail(selected);
      });
    });

    if (selected) showDetail(selected);
    else {
      calDetail.hidden = true;
      calDetail.innerHTML = '';
    }
  }

  calPrev.addEventListener('click', () => {
    if (viewM === 0) { viewY -= 1; viewM = 11; } else viewM -= 1;
    render();
  });
  calNext.addEventListener('click', () => {
    if (viewM === 11) { viewY += 1; viewM = 0; } else viewM += 1;
    render();
  });

  if (calUpcoming) {
    const sorted = [...DEADLINES].sort((a, b) => a.date.localeCompare(b.date));
    calUpcoming.innerHTML = sorted.map(e => `
      <li>
        <span class="cal-type-dot type-${e.type}"></span>
        <button type="button" data-date="${e.date}">
          <span class="cal-up-date">${formatShort(e.date)}</span>
          <span class="cal-up-title">${e.title}</span>
          <span class="cal-up-time">${TYPE_LABELS[e.type]} · ${e.time}</span>
        </button>
      </li>
    `).join('');
    calUpcoming.querySelectorAll('button[data-date]').forEach(btn => {
      btn.addEventListener('click', () => {
        const d = parseISODate(btn.dataset.date);
        viewY = d.getFullYear();
        viewM = d.getMonth();
        selected = btn.dataset.date;
        render();
        showDetail(selected);
        calGrid.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    });
  }

  render();
}
