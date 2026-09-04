// Échéances à date fixe — alimentent le calendrier (section 4)
// et, si un champ "table" est présent, la table Réservations (section 5)
const DEADLINES = [
  {
    date: '2027-01-10',
    type: 'attraction',
    title: 'Musée Ghibli — visite le 22 ou 23 fév.',
    time: '10h00 JST',
    url: 'https://www.ghibli-museum.jp/en/tickets/',
    urlLabel: 'ghibli-museum.jp ↗',
    table: { attraction: 'Musée Ghibli — visite le 22 ou 23 fév.', window: 'Ouverture le 10 janvier 2027, 10h00 JST' }
  },
  {
    date: '2027-01-26',
    type: 'transport',
    title: 'Thunderbird (Kyoto→Kanazawa, 26 fév.)',
    time: '10h00 JST',
    url: 'https://www.westjr.co.jp/global/en/ticket/overview/',
    urlLabel: 'westjr.co.jp ↗',
    table: { attraction: 'Thunderbird (Kyoto→Kanazawa, 26 fév.)', window: '26 janvier 2027, 10h00 JST' }
  },
  {
    date: '2027-01-28',
    type: 'transport',
    title: 'Hokuriku Shinkansen (Kanazawa→Tokyo, 28 fév.)',
    time: '10h00 JST',
    url: 'https://www.eki-net.com/en/jreast-train-reservation/Top/Index',
    urlLabel: 'eki-net.com ↗',
    table: { attraction: 'Hokuriku Shinkansen (Kanazawa→Tokyo, 28 fév.)', window: '28 janvier 2027, 10h00 JST' }
  },
  {
    date: '2027-02-10',
    type: 'attraction',
    title: 'Musée Ghibli — visite entre le 1ᵉʳ et le 9 mars',
    time: '10h00 JST',
    url: 'https://www.ghibli-museum.jp/en/tickets/',
    urlLabel: 'ghibli-museum.jp ↗',
    table: { attraction: 'Musée Ghibli — visite entre le 1ᵉʳ et le 9 mars', window: 'Ouverture le 10 février 2027, 10h00 JST' }
  },
  {
    date: '2026-11-30',
    type: 'attraction',
    title: 'Nintendo Museum (Uji) — dernier jour pour candidater à la loterie (visite fév. 2027)',
    time: 'candidature ouverte tout nov.',
    url: 'https://museum-tickets.nintendo.com/en/',
    urlLabel: 'museum-tickets.nintendo.com ↗',
    table: {
      attraction: 'Nintendo Museum (Uji)',
      window: 'Candidature loterie : 1-30 nov. 2026 · Tirage : 1er déc. · Paiement si gagné avant le 7 déc. 2026, 23h59 JST'
    }
  },
  {
    date: '2026-12-01',
    type: 'attraction',
    title: 'Nintendo Museum — résultat du tirage',
    time: 'à partir de l\'après-midi JST',
    url: 'https://museum-tickets.nintendo.com/en/',
    urlLabel: 'museum-tickets.nintendo.com ↗'
    // pas de "table" : ce stade n'a pas besoin d'une ligne séparée dans le tableau
  },
  {
    date: '2026-12-07',
    type: 'attraction',
    title: 'Nintendo Museum — paiement si gagné à la loterie',
    time: '23h59 JST',
    url: 'https://museum-tickets.nintendo.com/en/',
    urlLabel: 'museum-tickets.nintendo.com ↗'
  },
  {
    date: '2027-01-01',
    type: 'attraction',
    title: 'PokéPark Kanto — ouverture probable des billets (visite début mars, portail international)',
    time: '≈18h JST, date exacte à confirmer',
    url: 'https://ticket-en.pokepark-kanto.co.jp/',
    urlLabel: 'ticket-en.pokepark-kanto.co.jp ↗'
    // pas de "table" : la ligne générique vit dans RECURRING_RESERVATIONS
  },
  {
    date: '2027-01-28',
    type: 'transport',
    title: 'JR Fuji Excursion (Tokyo→Kawaguchiko, 28 fév.)',
    time: '10h00 JST',
    url: 'https://www.eki-net.com/en/jreast-train-reservation/Top/Index',
    urlLabel: 'eki-net.com ↗',
    table: { attraction: 'JR Fuji Excursion (Tokyo→Kawaguchiko, 28 fév.)', window: '28 janvier 2027, 10h00 JST' }
  },
  {
    date: '2027-02-02',
    type: 'transport',
    title: 'JR Fuji Excursion (Kawaguchiko→Tokyo, 2 mars)',
    time: '10h00 JST',
    url: 'https://www.eki-net.com/en/jreast-train-reservation/Top/Index',
    urlLabel: 'eki-net.com ↗',
    table: { attraction: 'JR Fuji Excursion (Kawaguchiko→Tokyo, 2 mars)', window: '2 février 2027, 10h00 JST' }
  },
  {
    date: '2027-01-18',
    type: 'attraction',
    title: 'Pokémon Café Osaka — ouverture réservation pour le 18 fév. (J-31)',
    time: '18h00 JST',
    url: 'https://www.pokemon-cafe.jp/en/cafe/reservation.html',
    urlLabel: 'pokemon-cafe.jp ↗'
    // pas de "table" : la ligne générique vit dans RECURRING_RESERVATIONS
  }
];

// Fenêtres glissantes / sans date fixe — table Réservations (section 5)
// + note dans le calendrier (section 4) si calendarNote: true
const RECURRING_RESERVATIONS = [
  {
    attraction: 'teamLab Planets (Toyosu)',
    window: 'Billets par lots mensuels, ~2-3 mois avant — vérifier dès nov./déc. 2026',
    url: 'https://www.teamlab.art/e/planets/',
    urlLabel: 'teamlab.art ↗',
    calendarNote: false
  },
  {
    attraction: 'Gundam Base Tokyo (Odaiba)',
    window: "Créneaux tirés au sort le weekend, réservation matin même en semaine — vérifier règles à l'approche (statue Unicorn démontée fin août 2026)",
    url: 'https://www.gundam-base.net/en/',
    urlLabel: 'gundam-base.net ↗',
    calendarNote: false
  },
  {
    attraction: 'PokéPark Kanto (Yomiuriland)',
    window: 'Portail international (pas de tirage) : billets ouverts ≈2 mois avant la date choisie, ~18h JST — date exacte à vérifier une fois le jour de visite fixé',
    url: 'https://ticket-en.pokepark-kanto.co.jp/',
    urlLabel: 'ticket-en.pokepark-kanto.co.jp ↗',
    calendarNote: false
  },
  {
    attraction: 'Pokémon Café (Tokyo Nihombashi ou Osaka)',
    window: 'Fenêtre glissante : ouverture 31 jours avant chaque date souhaitée, à 18h00 JST — Osaka généralement plus facile à obtenir que Tokyo',
    url: 'https://www.pokemon-cafe.jp/en/cafe/reservation.html',
    urlLabel: 'pokemon-cafe.jp ↗',
    calendarNote: false
  }
];