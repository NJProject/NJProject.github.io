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
  // Estimation volontairement prudente en ville, à remplacer par une API.
  return {
    distanceKm: km,
    durationMin: Math.max(5, Math.round((km / 4.5) * 60)),
    estimated: true
  };
}
