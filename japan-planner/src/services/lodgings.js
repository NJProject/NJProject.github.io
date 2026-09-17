// Emplacements de logement par ville, utilisés comme point de départ de la
// journée pour que le premier trajet du planner soit réaliste (au lieu de
// démarrer "de nulle part"). Coordonnées approximatives (quartier/gare la
// plus proche mentionnée dans l'annonce elle-même) — Airbnb ne communique
// jamais l'adresse exacte avant réservation, donc une précision au mètre
// près n'est ni possible ni nécessaire ici : l'écart (quelques centaines de
// mètres) est négligeable à l'échelle d'une journée de visite.
const LODGINGS = {
    osaka: [
      {
        start: "2027-02-18",
        end: "2027-02-22",
        label: "Maison Tsuruhashi (Ikuno-ku)",
        location: { lat: 34.6654, lng: 135.5302 }
      }
    ],
    nara: [
      {
        start: "2027-02-22",
        end: "2027-02-23",
        label: "Auberge proche Tōdai-ji (Kyōbate)",
        location: { lat: 34.6700, lng: 135.8286 }
      }
    ],
    kyoto: [
      {
        start: "2027-02-23",
        end: "2027-02-26",
        label: "Maison quartier gare de Kyoto (Tōji)",
        location: { lat: 34.9799, lng: 135.7526 }
      }
    ],
    kanazawa: [
      {
        start: "2027-02-26",
        end: "2027-02-28",
        label: "Machiya proche Kenrokuen",
        location: { lat: 36.5622, lng: 136.6625 }
      }
    ],
    fuji: [
      {
        start: "2027-02-28",
        end: "2027-03-02",
        label: "Villa lac Yamanaka",
        location: { lat: 35.4167, lng: 138.8750 }
      }
    ],
    tokyo: [
      {
        start: "2027-03-02",
        end: "2027-03-09",
        label: "Appartement Kōenji (Suginami)",
        location: { lat: 35.7053, lng: 139.6497 }
      },
      {
        start: "2027-03-09",
        end: "2027-03-10",
        label: "Maison proche Haneda (Ōta-ku)",
        location: { lat: 35.5550, lng: 139.7400 }
      }
      // Hôtel capsule Tokyo est (26–28 fév.) volontairement absent :
      // pas encore réservé, donc pas d'adresse à renseigner pour l'instant.
    ]
  };
  
// Les excursions (Kamakura, Nikko, Yokohama, Takao) sont des sorties à la
// journée depuis Tokyo — elles n'ont pas de logement propre, donc on réutilise
// le logement de Tokyo actif à la date donnée comme point de départ.
const CITY_ALIASES = { excursions: "tokyo" };

export function getLodgingForDate(cityKey, date) {
  const entries = LODGINGS[CITY_ALIASES[cityKey] || cityKey];
  if (!entries) return null;
  const match = entries.find(e => date >= e.start && date <= e.end);
  return match ? match.location : (entries[0]?.location || null);
}

export function getLodgingLabel(cityKey, date) {
  const entries = LODGINGS[CITY_ALIASES[cityKey] || cityKey];
  if (!entries) return null;
  const match = entries.find(e => date >= e.start && date <= e.end);
  return match ? match.label : (entries[0]?.label || null);
}