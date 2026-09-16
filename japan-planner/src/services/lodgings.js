// Emplacements de logement par ville, utilisés comme point de départ de la
// journée pour que le premier trajet du planner soit réaliste (au lieu de
// démarrer "de nulle part"). Coordonnées approximatives (quartier/gare la
// plus proche) — Airbnb ne communique jamais l'adresse exacte avant réservation,
// donc une précision au mètre près n'est ni possible ni nécessaire ici : l'écart
// (quelques centaines de mètres) est négligeable à l'échelle d'une journée de visite.
const LODGINGS = {
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
    // Osaka, Nara, Kyoto, Kanazawa : logements pas encore réservés/partagés —
    // à ajouter ici dès que vous aurez les liens, sur le même modèle.
  };
  
  export function getLodgingForDate(cityKey, date) {
    const entries = LODGINGS[cityKey];
    if (!entries) return null;
    const match = entries.find(e => date >= e.start && date <= e.end);
    return match ? match.location : (entries[0]?.location || null);
  }
  
  export function getLodgingLabel(cityKey, date) {
    const entries = LODGINGS[cityKey];
    if (!entries) return null;
    const match = entries.find(e => date >= e.start && date <= e.end);
    return match ? match.label : (entries[0]?.label || null);
  }