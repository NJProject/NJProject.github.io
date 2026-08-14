import html

CATS = {
    "touristique": ("🗺️", "Touristique"),
    "culturel": ("⛩️", "Culturel"),
    "commerces": ("🛍️", "Commerces"),
    "gastronomie": ("🍜", "Gastronomie"),
    "loisirs": ("🎢", "Parcs & loisirs"),
    "otaku": ("🎮", "Otaku / Geek"),
}

CITY_NAV = [
    ("osaka.html", "Osaka"),
    ("nara.html", "Nara"),
    ("kyoto.html", "Kyoto"),
    ("kanazawa.html", "Kanazawa"),
    ("tokyo.html", "Tokyo"),
    ("excursions.html", "Excursions"),
]

def poi(icon, title, cat, desc, meta=None):
    return {"icon": icon, "title": title, "cat": cat, "desc": desc, "meta": meta}

CITIES = {
    "osaka": {
        "icon": "🏯",
        "name": "Osaka",
        "dates": "18 – 22 février 2027 · 6 personnes",
        "intro": "Base du séjour côté Tsuruhashi, à quelques minutes de Dotonbori. Osaka est la ville la plus \"vivante\" et gourmande du Kansai — moins de temples qu'à Kyoto, beaucoup plus de rue, de néons et de nourriture de rue. C'est aussi la ville avec le plus de grosses attractions à visiter (parc à thème, aquarium, musées) si vous voulez varier avec le patrimoine.",
        "cats_used": ["touristique","culturel","commerces","gastronomie","loisirs"],
        "pois": [
            poi("🏯","Château d'Osaka","touristique","Reconstruction du XXe siècle mais superbe, entouré de douves et d'un grand parc — vue panoramique depuis le sommet.", "Accès : 20-25 min depuis Tsuruhashi en métro"),
            poi("🌆","Umeda Sky Building","touristique","Tours jumelles reliées par un observatoire circulaire suspendu, vue à 360° sur toute la ville, particulièrement belle au coucher du soleil.", "Quartier de Kita/Umeda"),
            poi("🛕","Sumiyoshi Taisha","culturel","L'un des plus anciens sanctuaires shinto du Japon (avant l'influence chinoise), architecture unique en son genre, pont arqué emblématique (Sorihashi).", "Sud d'Osaka, accessible en tram Hankai"),
            poi("🎭","Namba Grand Kagetsu","culturel","Théâtre historique du manzai (duo comique japonais) — l'humour verbal rapide fait partie intégrante de l'identité culturelle d'Osaka.", "Quartier de Namba"),
            poi("🏮","Dotonbori","gastronomie","Le canal le plus photographié du Japon, néons géants (le fameux panneau Glico), street food non-stop : takoyaki, okonomiyaki, kushikatsu.", "À 4 min à pied du logement"),
            poi("🐙","Kuromon Ichiba Market","gastronomie","\"La cuisine d'Osaka\" — marché couvert avec fruits de mer ultra-frais, dégustations sur le pouce, ambiance moins touristique que Dotonbori.", "À 3 min à pied du logement"),
            poi("🥩","Tsuruhashi Yakiniku Alley","gastronomie","Le cœur du quartier coréen d'Osaka — dizaines de restaurants de barbecue coréen spécialisés, juste à côté du logement.", "Sur place, quartier du logement"),
            poi("🛍️","Shinsaibashi-suji","commerces","Longue arcade marchande couverte, du luxe aux boutiques de streetwear, cœur commercial du quartier Minami.", "10 min à pied de Dotonbori"),
            poi("🎮","Den Den Town","commerces","Le \"petit Akihabara\" d'Osaka — figurines, jeux rétro, manga. Repère : Super Potato pour le vintage Nintendo.", "Quartier de Nipponbashi"),
            poi("🧥","Amerikamura (Amemura)","commerces","Quartier jeune et alternatif autour du \"Triangle Park\", friperies, mode streetwear, disquaires vinyle.", "Proche Shinsaibashi"),
            poi("🏘️","Shinsekai","touristique","Quartier rétro-futuriste construit dans les années 1900 autour de la tour Tsutenkaku, ambiance old-school, spécialité locale : le kushikatsu (brochettes panées).", "Sud de Namba"),
            poi("📏","Tenjinbashisuji","commerces","La plus longue arcade couverte du Japon (2,6 km) — beaucoup plus locale et authentique que les rues touristiques de Minami.", "Quartier de Kita"),
            poi("🎢","Universal Studios Japan","loisirs","Le plus grand parc à thème du Kansai : Super Nintendo World (Mario Kart, Donkey Kong), zone Harry Potter, Minions, montagnes russes. Journée complète, très fréquenté — Express Pass conseillé pour éviter les files.", "Comptez une journée entière ; réserver billets + Express Pass en ligne à l'avance"),
            poi("🐳","Osaka Aquarium Kaiyukan","loisirs","L'un des plus grands aquariums du monde, bassin central de 9m de profondeur avec requins-baleines, tour en spirale qui descend à travers les écosystèmes du Pacifique.", "Quartier de Tempozan, à côté du Ferris wheel"),
            poi("🧱","Legoland Discovery Center Osaka","loisirs","Attraction indoor pour tous âges, zones de jeu, mini-Osaka en Lego, montagne russe douce, plutôt pour une pause de 2h que pour la journée.", "Centre commercial LaLaport Osaka Expocity, Suita"),
            poi("🍜","Cup Noodles Museum Osaka Ikeda","loisirs","Musée dédié à l'invention des nouilles instantanées par Momofuku Ando, atelier pour créer son propre pot de nouilles personnalisé.", "Ikeda, ~30 min du centre — réservation atelier conseillée"),
        ],
    },
    "nara": {
        "icon": "🦌",
        "name": "Nara",
        "dates": "22 – 23 février 2027 · 6 personnes · 1 nuit",
        "intro": "Étape courte mais dense : ancienne capitale du Japon (710-784), premier grand foyer bouddhiste du pays. L'essentiel se fait à pied depuis le logement, à côté du Tōdai-ji.",
        "cats_used": ["touristique","culturel","commerces","gastronomie"],
        "pois": [
            poi("🦌","Parc de Nara","touristique","Plus de 1 200 daims sacrés en liberté totale, considérés comme des messagers divins depuis la fondation du sanctuaire Kasuga Taisha. Ils s'inclinent pour réclamer des biscuits (shika senbei).", "Daims parfois brusques — ne pas les taquiner avec la nourriture"),
            poi("🗿","Tōdai-ji","touristique","Abrite le Daibutsu, l'un des plus grands Bouddhas en bronze du Japon, dans le plus grand bâtiment en bois du monde.", "À 30 min à pied du logement, dans le parc"),
            poi("⛩️","Kasuga Taisha","culturel","Sanctuaire shinto célèbre pour ses milliers de lanternes de pierre et de bronze couvertes de mousse, offertes par les fidèles au fil des siècles.", "Patrimoine mondial UNESCO"),
            poi("🏯","Kōfuku-ji","culturel","Pagode à cinq étages, l'une des plus hautes du Japon, vestige de l'ancien pouvoir du clan Fujiwara.", "Patrimoine mondial UNESCO, dans le parc"),
            poi("🌲","Forêt primaire du Mont Kasuga","touristique","Forêt sacrée classée UNESCO derrière Kasuga Taisha, jamais coupée depuis plus de 1000 ans — belle balade tranquille loin des foules du parc principal.", "Départ juste derrière le sanctuaire Kasuga Taisha"),
            poi("🎋","Naramachi","commerces","Ancien quartier marchand aux maisons machiya restaurées, aujourd'hui plein de boutiques d'artisanat, galeries et cafés à thème.", "15 min à pied du logement"),
            poi("🌸","Isui-en Garden","touristique","Jardin japonais traditionnel avec vue sur le Tōdai-ji en arrière-plan (technique du \"paysage emprunté\"), plus calme que le parc principal.", "Juste à côté du Tōdai-ji"),
            poi("🍡","Kudzu mochi & kakinoha zushi","gastronomie","Spécialités locales : gâteau de riz à base de racine de kudzu, et sushi enveloppé de feuille de plaqueminier (kaki) — typiques de la cuisine d'ancienne capitale.", "À goûter à Naramachi"),
            poi("🍵","Atelier wagashi & thé matcha","gastronomie","Ateliers proposés dans des boutiques historiques de Naramachi pour apprendre à confectionner des wagashi (douceurs traditionnelles) et les déguster avec du matcha.", "Réservation conseillée sur place ou en ligne"),
        ],
    },
    "kyoto": {
        "icon": "⛩️",
        "name": "Kyoto",
        "dates": "23 – 26 février 2027 · 6 personnes",
        "intro": "Capitale impériale pendant plus de 1000 ans. Logement dans le quartier de la gare, avec 6 vélos gratuits fournis — pratique pour enchaîner les quartiers sans dépendre des bus bondés.",
        "cats_used": ["touristique","culturel","commerces","gastronomie","loisirs"],
        "pois": [
            poi("⛩️","Fushimi Inari-taisha","touristique","Des milliers de torii vermillon qui grimpent la colline sacrée du renard Inari — accessible directement en train depuis la ligne JR Nara.", "Ouvert 24h/24, gratuit"),
            poi("🌟","Kinkaku-ji","touristique","Le Pavillon d'or, recouvert de feuilles d'or véritables, reflété dans son étang — l'un des symboles les plus connus du Japon.", "Nord-ouest de Kyoto"),
            poi("🎋","Arashiyama","touristique","Célèbre forêt de bambous géants, pont Togetsukyo, et parc aux singes Iwatayama avec vue panoramique sur la ville en prime.", "Ouest de Kyoto, ~30-40 min du logement"),
            poi("🏘️","Ninenzaka & Sannenzaka","touristique","Ruelles pavées les mieux préservées du vieux Kyoto, bordées de boutiques d'artisanat (céramique Kiyomizu-yaki, éventails, encens).", "Menant au temple Kiyomizu-dera"),
            poi("💃","Gion & Hanamikoji-dori","culturel","Quartier historique des geishas (geiko) et apprenties (maiko), maisons de thé traditionnelles en bois, possibilité d'apercevoir une geiko en soirée.", "Respecter la tranquillité du quartier, pas de photos des geiko sans autorisation"),
            poi("🍵","Cérémonie du thé","culturel","Plusieurs maisons de thé à Gion et près de Nishiki proposent des initiations à la cérémonie du thé traditionnelle (chanoyu), en petit groupe.", "Réservation recommandée"),
            poi("🐟","Nishiki Market","gastronomie","\"La cuisine de Kyoto\" — marché couvert vieux de 400 ans, dégustations à chaque étal, spécialités locales (tsukemono, tofu, sucreries).", "5 min à pied de la gare Kawaramachi"),
            poi("📚","Teramachi & Shinkyogoku","commerces","Deux arcades couvertes parallèles : Teramachi pour l'artisanat et les librairies anciennes, Shinkyogoku plus jeune et streetwear.", "Juste à côté de Nishiki Market"),
            poi("🚲","Balade à vélo dans le quartier de la gare","touristique","Les 6 vélos gratuits fournis par l'hôte permettent de rejoindre facilement Tōji, le temple à la plus haute pagode en bois du Japon, à quelques minutes du logement.", "Vélos fournis avec le logement"),
            poi("🎮","Nintendo Museum (Uji)","loisirs","Ouvert en 2024 dans l'ancienne usine Nintendo, retrace toute l'histoire de la marque des cartes Hanafuda à la Switch, expositions interactives. Billets uniquement par tirage au sort en ligne, pas de vente sur place ni le jour même.", "À Uji, ~45-60 min du logement (Kintetsu via Ogura) — réserver via museum-tickets.nintendo.com bien à l'avance"),
            poi("🎬","Toei Kyoto Studio Park","loisirs","Parc à thème dans un vrai studio de tournage de films de samouraïs (jidaigeki), figurants en costume, rues de l'époque Edo reconstituées.", "Ouest de Kyoto, proche d'Arashiyama"),
            poi("🚂","Musée ferroviaire de Kyoto","loisirs","Grande collection de locomotives et Shinkansen historiques, simulateurs de conduite, très bien fait pour petits et grands.", "10 min à pied de la gare de Kyoto"),
        ],
    },
    "kanazawa": {
        "icon": "🎋",
        "name": "Kanazawa",
        "dates": "26 – 28 février 2027 · 5 personnes",
        "intro": "\"Petite Kyoto\" du bord de mer du Japon, épargnée par les bombardements de la Seconde Guerre mondiale — samouraïs, geishas et art contemporain à taille humaine, tout se fait à pied.",
        "cats_used": ["touristique","culturel","commerces","gastronomie"],
        "pois": [
            poi("🌳","Kenrokuen","touristique","L'un des trois plus beaux jardins du Japon, sublime toute l'année (pruniers en février-mars), célèbre lanterne de pierre Kotoji-tōrō.", "5 min à pied du logement"),
            poi("🏯","Château de Kanazawa","touristique","Reconstruction impressionnante juste en face de Kenrokuen, remarquable pour ses murs blancs en plâtre plutôt qu'en bois foncé.", "Juste à côté de Kenrokuen"),
            poi("🗡️","Quartier des samouraïs de Nagamachi","culturel","Ruelles bordées de murs de terre et canaux, résidence Nomura ouverte au public avec son jardin, aperçu de la vie d'un samouraï de rang moyen à l'époque Edo.", "15-20 min à pied du logement"),
            poi("💮","Higashi Chaya","culturel","Le plus beau quartier de geishas préservé du Japon, façades en bois de style Edo, maisons de thé encore en activité.", "10-15 min à pied du logement"),
            poi("🥷","Myōryū-ji (Temple Ninja)","culturel","Surnommé \"temple ninja\" pour ses pièges architecturaux (escaliers cachés, passages secrets) construits pour défendre le clan Maeda — visite uniquement sur réservation guidée en japonais.", "Réservation obligatoire à l'avance"),
            poi("🎨","Musée d'art contemporain du 21e siècle","touristique","Bâtiment circulaire entièrement vitré, célèbre pour l'installation immersive \"The Swimming Pool\" de Leandro Erlich.", "12 min à pied du logement"),
            poi("🐟","Omicho Market","gastronomie","\"La cuisine de Kanazawa\" depuis 300 ans — crabe des neiges (nov-mars, en pleine saison pour votre venue !), légumes Kaga, comptoirs de sushi ultra-frais.", "Entre le logement et le château"),
            poi("✨","Glace à la feuille d'or","gastronomie","Spécialité unique de Kanazawa, qui produit 99% de la feuille d'or du Japon — un cône de glace entièrement recouvert d'une feuille d'or comestible, en vente à Higashi Chaya.", "Higashi Chaya, plusieurs boutiques"),
            poi("🛍️","Kōrinbō & Tatemachi","commerces","Quartier commerçant central, grands magasins et rues piétonnes plus locales, bon complément après la journée culturelle.", "Centre-ville de Kanazawa"),
            poi("🏔️","Shirakawa-go (excursion à la journée)","touristique","Village classé UNESCO aux fermes traditionnelles au toit de chaume pentu (style gassho-zukuri), superbe même sous la neige. Faisable en bus direct depuis Kanazawa.", "~1h15 en bus depuis Kanazawa, réservation du bus conseillée en hiver"),
        ],
    },
    "tokyo": {
        "icon": "🌆",
        "name": "Tokyo",
        "dates": "26 février – 10 mars 2027 · groupe séparé puis réuni",
        "intro": "La plus longue étape du voyage, en plusieurs temps : 1 personne côté est dès le 26, tout le monde réuni à Shibuya (ouest) du 28 fév. au 3 mars, puis 5 personnes repartent côté est jusqu'au 9, avant la dernière nuit près de Haneda. Tokyo est énorme — mieux vaut grouper les visites par quartier plutôt que sauter d'un bout à l'autre.",
        "cats_used": ["touristique","culturel","commerces","gastronomie","loisirs","otaku"],
        "pois": [
            poi("🚦","Shibuya Crossing & Shibuya Sky","touristique","Le carrefour piéton le plus célèbre du monde, à voir de nuit depuis la fenêtre du Starbucks (gratuit) ou depuis l'observatoire Shibuya Sky (payant, coucher de soleil).", "Quartier du logement Shibuya"),
            poi("🌲","Meiji Jingu","culturel","Sanctuaire shinto au cœur d'une forêt de 100 000 arbres en plein Tokyo, contraste total avec l'agitation de Harajuku juste à côté.", "Idéal tôt le matin, avant les groupes"),
            poi("🏮","Senso-ji & Nakamise-dori","touristique","Le plus vieux temple de Tokyo (628), rue commerçante Nakamise bordée de boutiques traditionnelles et de stands de street food.", "Quartier d'Asakusa, côté est"),
            poi("🗼","Tokyo Skytree","touristique","La plus haute tour du Japon (634m), vue sur tout le Kanto et, par temps clair, jusqu'au Mont Fuji.", "Juste à côté d'Asakusa"),
            poi("🗼","Tokyo Tower","touristique","La tour historique de Tokyo (1958), moins haute que le Skytree mais plus centrale et emblématique, jolie vue sur le sanctuaire Zojo-ji juste à côté.", "Quartier de Minato, entre Shibuya et Asakusa"),
            poi("🍶","Golden Gai & Omoide Yokocho","culturel","Shinjuku : plus de 150 minuscules bars dans des ruelles d'après-guerre (Golden Gai) et \"l'allée des souvenirs\" pour du yakitori sous les rails (Omoide Yokocho).", "Quartier de Shinjuku"),
            poi("🎏","Takeshita-dori, Harajuku","commerces","L'épicentre de la mode jeune et excentrique du Japon, crêpes colorées, boutiques de streetwear et de kawaii.", "Entre Shibuya et Harajuku"),
            poi("🧥","Shimokitazawa","commerces","Le quartier vintage par excellence de Tokyo — friperies, disquaires, cafés indépendants, ambiance bohème à 2 stations de Shibuya.", "Ligne Keio Inokashira depuis Shibuya"),
            poi("🍣","Sushi tournant Uobei (Shibuya)","gastronomie","Sushi au tapis roulant nouvelle génération : commande sur tablette, assiettes à 100-200¥, service ultra-rapide.", "Quartier de Shibuya, Dogenzaka"),
            poi("🍜","Omoide Yokocho","gastronomie","Ruelles enfumées de petits izakaya sous les voies ferrées de Shinjuku, spécialisées dans le yakitori grillé au charbon.", "Sortie ouest de la gare de Shinjuku"),
            poi("🏰","Tokyo Disneyland & DisneySea","loisirs","Les deux parcs Disney les plus atypiques au monde (DisneySea est unique, pas ailleurs sur la planète). Journée complète par parc, billets datés à réserver en ligne bien à l'avance.", "Urayasu, Chiba — 15 min en train depuis Tokyo, hors zone couverte par les cartes IC classiques du Kanto (ligne Disney Resort Line séparée)"),
            poi("💗","Sanrio Puroland","loisirs","Parc à thème indoor dédié à Hello Kitty et l'univers Sanrio, parades, spectacles — plus adapté à une demi-journée qu'à une journée complète.", "Tama, ouest de Tokyo"),
            poi("✨","teamLab Borderless (Azabudai Hills)","loisirs","Le successeur du musée culte d'Odaiba (fermé en 2022), musée d'art numérique immersif \"sans carte\" où les œuvres se déplacent entre les salles. Différent de teamLab Planets (déjà dans les réservations) — les deux sont complémentaires si vous avez le temps.", "Quartier de Roppongi/Azabudai, billets datés à l'avance"),
            poi("🕹️","Joypolis (Odaiba)","loisirs","Parc d'attractions indoor Sega sur plusieurs étages, montagnes russes en intérieur, réalité virtuelle, machines d'arcade dernier cri.", "Odaiba, combinable avec Gundam Base"),
            poi("🤖","Gundam Base Tokyo (Odaiba)","otaku","Le plus grand magasin/expo Gundam du monde. Statue Unicorn démontée fin août 2026 — vérifier ce qui la remplace avant la visite.", "Réservation créneau conseillée le weekend"),
            poi("⚔️","Warhammer Store & Café (Akihabara)","otaku","Le plus grand magasin Warhammer 40k d'Asie, ambiance immersive, tables de jeu sur place.", "5 min à pied de la gare d'Akihabara"),
            poi("🌃","Kabukicho, le vrai Kamurocho","otaku","Modèle réel du quartier fictif de la saga Yakuza/Like a Dragon — porte d'entrée Ichibangai, Don Quijote, Golden Gai juste à côté.", "Quartier de Shinjuku"),
            poi("🪚","Pèlerinage Chainsaw Man — Reze Arc","otaku","5 lieux du film dans le triangle Jinbōchō-Ochanomizu : cabine téléphonique, immeuble Aoi, escalier Onnazaka, café Vale.", "Départ gare de Suidōbashi, ~2-3h de balade"),
            poi("🐎","Uma Musume — Animate & Tokyo Racecourse","otaku","Animate Akihabara pour le merchandising permanent, pop-ups Cygames à vérifier début 2027, Tokyo Racecourse (Fuchu) pour le pèlerinage complet.", "Racecourse excentré, prévoir une demi-journée dédiée"),
        ],
    },
}


def render_poi(p):
    icon_cat, label_cat = CATS[p["cat"]]
    meta_html = f'<div class="poi-meta">{html.escape(p["meta"])}</div>' if p.get("meta") else ""
    return f"""        <article class="poi-card" data-cat="{p['cat']}">
          <div class="poi-top">
            <span class="poi-icon">{p['icon']}</span>
            <span class="poi-cat cat-{p['cat']}">{label_cat}</span>
          </div>
          <h4>{html.escape(p['title'])}</h4>
          <p>{html.escape(p['desc'])}</p>
          {meta_html}
        </article>"""


def render_filter_bar(cats_used):
    chips = ['<button class="filter-chip active" data-cat="all">Tout</button>']
    for c in cats_used:
        icon, label = CATS[c]
        chips.append(f'<button class="filter-chip" data-cat="{c}">{icon} {label}</button>')
    return "\n        ".join(chips)


def render_city_nav(current_key):
    links = []
    for href, label in CITY_NAV:
        cls = ' class="active"' if href == f"{current_key}.html" else ""
        links.append(f'<a href="/{href}"{cls}>{label}</a>')
    return "\n        ".join(links)


FAVICONS = '''<link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="shortcut icon" href="/favicon.ico" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />'''

PAGE_TEMPLATE = """<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<meta property="og:title" content="{name} — Japon 2027">
<meta property="og:description" content="Points d'intérêt à {name} pour le groupe — touristique, culturel, commerces, gastronomie, loisirs.">
<meta property="og:url" content="https://njproject.github.io/{key}.html">
<title>{name} — Japon 2027</title>
{favicons}
<link rel="stylesheet" href="/style.css">
</head>
<body>

<div class="city-header">
  <a class="back" href="/index.html">← Retour au guide complet</a>
  <span class="city-icon-big">{icon}</span>
  <h1>{name}</h1>
  <p>{dates}</p>
  <div class="city-nav">
        {city_nav}
  </div>
</div>

<main class="city-main">
  <p>{intro}</p>

  <div class="filter-bar">
        {filter_bar}
  </div>

  <div class="poi-grid">
{poi_cards}
  </div>
</main>

<footer>
  Guide généré le 14 août 2026 — infos à revérifier 1-2 mois avant le départ.<br>
  <a href="/index.html">← Retour au guide complet</a> · <a href="https://njproject.github.io/" target="_blank" rel="noopener noreferrer">njproject.github.io ↗</a>
</footer>

<script src="/script.js"></script>
</body>
</html>
"""

for key, data in CITIES.items():
    poi_cards = "\n".join(render_poi(p) for p in data["pois"])
    page = PAGE_TEMPLATE.format(
        key=key,
        name=data["name"],
        icon=data["icon"],
        dates=data["dates"],
        intro=data["intro"],
        favicons=FAVICONS,
        city_nav=render_city_nav(key),
        filter_bar=render_filter_bar(data["cats_used"]),
        poi_cards=poi_cards,
    )
    with open(f"/home/claude/site/{key}.html", "w", encoding="utf-8") as f:
        f.write(page)
    print(f"Wrote {key}.html ({len(data['pois'])} POIs)")
