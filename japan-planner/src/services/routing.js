/*
 * V1 : abstraction de routage.
 * - Si VITE_ROUTING_URL est configurée, elle est appelée avec un tableau
 *   de points et doit renvoyer { durationMin, distanceKm }.
 * - Sinon, on utilise une estimation haversine + facteur urbain.
 *
 * Pour le Japon, on pourra brancher ensuite une API réellement multimodale
 * (Google Routes/Maps ou autre fournisseur avec transports en commun).
 */
function haversineKm(a, b) {
  const R = 6371;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lng - a.lng) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

// En dessous de 1,2 km : marche à pied pure (~4,3 km/h, buffer pour feux/trottoirs).
// Au-delà : hypothèse transport en commun urbain japonais — vitesse moyenne plus
// élevée, mais avec un forfait fixe de ~8 min (marche vers la station, attente,
// accès quai) qui ne disparaît jamais, même sur un trajet court en transit.
function estimateDurationMin(km) {
  const WALK_THRESHOLD_KM = 1.2;
  const WALK_SPEED_KMH = 4.3;
  const TRANSIT_SPEED_KMH = 16;
  const TRANSIT_OVERHEAD_MIN = 8;

  if (km <= WALK_THRESHOLD_KM) {
    return Math.max(5, Math.round((km / WALK_SPEED_KMH) * 60));
  }
  return Math.round((km / TRANSIT_SPEED_KMH) * 60 + TRANSIT_OVERHEAD_MIN);
}

export async function routeBetween(a, b) {
  if (!a || !b) return { durationMin: 60, distanceKm: null, estimated: true };

  const base = import.meta.env.VITE_ROUTING_URL;
  if (base) {
    const response = await fetch(base, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: a, to: b })
    });
    if (!response.ok) throw new Error(`Erreur API itinéraire (${response.status})`);
    return { ...(await response.json()), estimated: false };
  }

  const km = haversineKm(a, b);
  return {
    distanceKm: km,
    durationMin: estimateDurationMin(km),
    estimated: true
  };
}
