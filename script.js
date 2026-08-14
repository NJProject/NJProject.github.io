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
