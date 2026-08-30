const allSidenavLinks = document.querySelectorAll('#sidenav a');
const links = Array.from(allSidenavLinks).filter(a => a.getAttribute('href')?.startsWith('#'));
const sections = links.map(a => document.querySelector(a.getAttribute('href')));

// Bandeau "prochaine échéance"
const nextDeadlineBanner = document.getElementById('nextDeadlineBanner');
if (nextDeadlineBanner && typeof DEADLINES !== 'undefined') {
  const todayIso = new Date().toISOString().slice(0, 10);
  const next = DEADLINES
    .filter(e => e.date >= todayIso)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  if (next) {
    const days = Math.ceil((new Date(next.date) - new Date(todayIso)) / 86400000);
    nextDeadlineBanner.hidden = false;
    nextDeadlineBanner.innerHTML = `
      ⏳ Prochaine échéance dans <strong>${days} jour${days > 1 ? 's' : ''}</strong> :
      <a href="#calendrier">${next.title}</a>
    `;
  }
}

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

// Category filter (city pages) — délégation d'événement pour inclure les cartes ajoutées après coup
const filterBar = document.querySelector('.filter-bar');

if (filterBar) {
  filterBar.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    filterBar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    const cat = chip.dataset.cat;
    document.querySelectorAll('.poi-card').forEach(card => {
      if (cat === 'all' || card.dataset.cat === cat) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
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

  const calUpcomingPager = document.getElementById('calUpcomingPager');
  const calUpcomingPrev = document.getElementById('calUpcomingPrev');
  const calUpcomingNext = document.getElementById('calUpcomingNext');
  const calUpcomingPageLabel = document.getElementById('calUpcomingPageLabel');
  const UPCOMING_PAGE_SIZE = 4;

  if (calUpcoming) {
    const todayIso = ymd(new Date());
    const upcoming = DEADLINES
      .filter(e => e.date >= todayIso)
      .sort((a, b) => a.date.localeCompare(b.date));
    const pageCount = Math.max(1, Math.ceil(upcoming.length / UPCOMING_PAGE_SIZE));
    let upcomingPage = 0;

    function renderUpcoming() {
      const start = upcomingPage * UPCOMING_PAGE_SIZE;
      const pageItems = upcoming.slice(start, start + UPCOMING_PAGE_SIZE);

      calUpcoming.innerHTML = pageItems.length
        ? pageItems.map(e => `
          <li>
            <span class="cal-type-dot type-${e.type}"></span>
            <button type="button" data-date="${e.date}">
              <span class="cal-up-date">${formatShort(e.date)}</span>
              <span class="cal-up-title">${e.title}</span>
              <span class="cal-up-time">${TYPE_LABELS[e.type]} · ${e.time}</span>
            </button>
          </li>
        `).join('')
        : '<li class="cal-upcoming-empty">Aucune échéance à venir.</li>';

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

      if (calUpcomingPager && calUpcomingPrev && calUpcomingNext && calUpcomingPageLabel) {
        const showPager = upcoming.length > UPCOMING_PAGE_SIZE;
        calUpcomingPager.hidden = !showPager;
        if (showPager) {
          calUpcomingPrev.disabled = upcomingPage === 0;
          calUpcomingNext.disabled = upcomingPage >= pageCount - 1;
          calUpcomingPageLabel.textContent = `${upcomingPage + 1} / ${pageCount}`;
        }
      }
    }

    if (calUpcomingPrev) {
      calUpcomingPrev.addEventListener('click', () => {
        if (upcomingPage > 0) { upcomingPage -= 1; renderUpcoming(); }
      });
    }
    if (calUpcomingNext) {
      calUpcomingNext.addEventListener('click', () => {
        if (upcomingPage < pageCount - 1) { upcomingPage += 1; renderUpcoming(); }
      });
    }

    renderUpcoming();
  }

  render();
}

// Rendu du tableau Réservations (section 5) à partir de DEADLINES + RECURRING_RESERVATIONS
const reservationsTableBody = document.getElementById('reservationsTableBody');
if (reservationsTableBody && typeof DEADLINES !== 'undefined') {
  const fromDeadlines = DEADLINES
  .filter(e => e.table)
  .sort((a, b) => a.date.localeCompare(b.date))
  .map(e => ({
    ...e.table,
    url: e.url,
    urlLabel: e.urlLabel
  }));

  const fromRecurring = typeof RECURRING_RESERVATIONS !== 'undefined' ? RECURRING_RESERVATIONS : [];

  const rows = [...fromDeadlines, ...fromRecurring];

  reservationsTableBody.innerHTML = rows.map(r => `
    <tr>
      <td data-label="Attraction">${r.attraction}</td>
      <td data-label="Fenêtre">${r.window}</td>
      <td data-label="Où"><a href="${r.url}" target="_blank" rel="noopener noreferrer">${r.urlLabel}</a></td>
    </tr>
  `).join('');
}

// Rendu des notes "fenêtre glissante" dans le calendrier (section 4)
const calRecurringNotes = document.getElementById('calRecurringNotes');
if (calRecurringNotes && typeof RECURRING_RESERVATIONS !== 'undefined') {
  const notes = RECURRING_RESERVATIONS.filter(r => r.calendarNote);
  calRecurringNotes.innerHTML = notes.map(r => `
    <div class="cal-flex-item cal-card-note">
      <span class="cal-type-dot type-transport"></span>
      <div>
        <strong>${r.attraction}</strong>
        <p>${r.window} <a href="${r.url}" target="_blank" rel="noopener noreferrer">${r.urlLabel}</a></p>
      </div>
    </div>
  `).join('');
}