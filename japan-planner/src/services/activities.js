import { slugify } from "../utils/slugify";

const CITIES = [
  { key: "osaka", name: "Osaka", start: "2027-02-18", end: "2027-02-22" },
  { key: "nara", name: "Nara", start: "2027-02-22", end: "2027-02-23" },
  { key: "kyoto", name: "Kyoto", start: "2027-02-23", end: "2027-02-26" },
  { key: "kanazawa", name: "Kanazawa", start: "2027-02-26", end: "2027-02-28" },
  { key: "tokyo", name: "Tokyo", start: "2027-02-26", end: "2027-03-10" }
];

export function cityForKey(key) {
  return CITIES.find(c => c.key === key);
}

export function cityList() {
  return CITIES;
}

function parsePoiCard(card, city) {
  const title = card.querySelector("h4")?.textContent?.trim();
  if (!title) return null;
  const category = card.dataset.cat || "";
  const description = card.querySelector("p")?.textContent?.trim() || "";
  const meta = card.querySelector(".poi-meta")?.textContent?.trim() || "";
  return {
    id: `${city.key}--${slugify(title)}`,
    city: city.key,
    cityName: city.name,
    title,
    category,
    description,
    meta,
    // À compléter dans l'admin pour rendre l'optimisation géographique fiable.
    location: null,
    durationMin: null,
    openingHours: null,
    availableDates: null,
    constraints: {}
  };
}

export async function loadActivities() {
  const all = [];
  for (const city of CITIES) {
    const res = await fetch(`/${city.key}.html`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Impossible de charger /${city.key}.html (${res.status})`);
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll(".poi-card").forEach(card => {
      const item = parsePoiCard(card, city);
      if (item) all.push(item);
    });
  }
  return all;
}

export function datesInRange(cityKey) {
  const city = cityForKey(cityKey);
  if (!city) return [];
  const dates = [];
  let cur = new Date(`${city.start}T00:00:00`);
  const end = new Date(`${city.end}T00:00:00`);
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export { CITIES };
