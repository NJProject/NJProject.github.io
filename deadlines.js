// Données des échéances de réservation, affichées dans le calendrier (section 4 d'index.html)
// Pour ajouter une échéance : ajouter un objet ici, rien à toucher dans script.js
const DEADLINES = [
    {
      date: '2027-01-10',
      type: 'attraction',
      title: 'Musée Ghibli — visite le 22 ou 23 fév.',
      time: '10h00 JST',
      url: 'https://www.ghibli-museum.jp/en/tickets/',
      urlLabel: 'ghibli-museum.jp ↗'
    },
    {
      date: '2027-01-26',
      type: 'transport',
      title: 'Thunderbird (Kyoto→Kanazawa, 26 fév.)',
      time: '10h00 JST',
      url: 'https://www.westjr.co.jp/global/en/ticket/overview/',
      urlLabel: 'westjr.co.jp ↗'
    },
    {
      date: '2027-01-28',
      type: 'transport',
      title: 'Hokuriku Shinkansen (Kanazawa→Tokyo, 28 fév.)',
      time: '10h00 JST',
      url: 'https://www.eki-net.com/en/jreast-train-reservation/Top/Index',
      urlLabel: 'eki-net.com ↗'
    },
    {
      date: '2027-02-10',
      type: 'attraction',
      title: 'Musée Ghibli — visite entre le 1ᵉʳ et le 9 mars',
      time: '10h00 JST',
      url: 'https://www.ghibli-museum.jp/en/tickets/',
      urlLabel: 'ghibli-museum.jp ↗'
    },
    {
      date: '2026-11-30',
      type: 'attraction',
      title: 'Nintendo Museum (Uji) — dernier jour pour candidater à la loterie (visite fév. 2027)',
      time: 'candidature ouverte tout nov.',
      url: 'https://museum-tickets.nintendo.com/en/',
      urlLabel: 'museum-tickets.nintendo.com ↗'
    },
    {
      date: '2026-12-01',
      type: 'attraction',
      title: 'Nintendo Museum — résultat du tirage',
      time: 'à partir de l\'après-midi JST',
      url: 'https://museum-tickets.nintendo.com/en/',
      urlLabel: 'museum-tickets.nintendo.com ↗'
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
    },
    {
      date: '2027-01-18',
      type: 'attraction',
      title: 'Pokémon Café Osaka — ouverture réservation pour le 18 fév. (J-31)',
      time: '18h00 JST',
      url: 'https://www.pokemon-cafe.jp/en/cafe/reservation.html',
      urlLabel: 'pokemon-cafe.jp ↗'
    }
  ];