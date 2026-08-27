# Guide Japon 2027

Guide de voyage statique (HTML/CSS/JS) pour le groupe — itinéraire, logements, transports, réservations, festivals, infos pratiques, et une page détaillée par ville + une page excursions.

## Principe de structure

- **`index.html`** = colonne vertébrale unique pour tout ce qui est **lié au temps/à la logistique** : itinéraire, logements, transports, réservations à dates fixes, festivals, documents administratifs, infos pratiques. Tout est accessible par ancre depuis la nav latérale.
- **Pages villes + excursions** = uniquement pour ce qui est **lié au lieu** (à voir/faire une fois sur place), filtrable par catégorie.

Pas de pages séparées pour "transports" ou "administratif" — ces sections restent dans `index.html` pour éviter de devoir naviguer entre plusieurs pages pour des infos qu'on consulte ensemble.

## ⚠️ Déploiement important

Tous les liens (CSS, JS, favicons, navigation entre pages) utilisent des **chemins absolus** (`/style.css`, `/tokyo.html`, etc.) car le site est prévu pour être servi depuis la **racine** du domaine `https://njproject.github.io/`.

➜ Tous les fichiers doivent être à la racine du dépôt `njproject.github.io` (pas dans un sous-dossier), sinon le CSS/JS ne se chargera pas.

➜ À chaque mise à jour, remplacez **tous les fichiers modifiés** (souvent `index.html` ET `style.css` ensemble) — ne mettez pas à jour un seul fichier en pensant que les autres n'ont pas changé.

## Structure

```
/ (racine du repo njproject.github.io)
├── index.html          → guide principal (itinéraire, logements, transports, réservations & festivals, docs admin, infos pratiques)
├── osaka.html          → points d'intérêt Osaka (19)
├── nara.html           → points d'intérêt Nara (9)
├── kyoto.html          → points d'intérêt Kyoto (15)
├── kanazawa.html        → points d'intérêt Kanazawa (11)
├── tokyo.html           → points d'intérêt Tokyo (21, + spots otaku/geek)
├── excursions.html      → Kamakura, Nikko, Fuji Five Lakes, Yokohama, Takao & Mitake (20)
├── style.css           → mise en forme partagée (responsive, cartes, timeline, filtres)
├── deadlines.js         → données des échéances de réservation (calendrier section 4) — à éditer à chaque nouvelle attraction/fenêtre de résa
├── script.js           → logique : nav active au scroll, menu mobile, filtre par catégorie, rendu du calendrier
├── generate_cities.py   → script Python qui génère les 5 pages villes (source de vérité pour leur contenu)
└── README.md
```

## Favicons

Chaque page référence (en chemin absolu, à la racine) :
- `/favicon-96x96.png`
- `/favicon.svg`
- `/favicon.ico`
- `/apple-touch-icon.png`
- `/site.webmanifest`

➜ Ces fichiers ne sont pas fournis dans ce zip — à ajouter à la racine du dépôt pour que les icônes s'affichent (sinon 404 silencieux, sans casser le reste du site).

## Catégories de points d'intérêt

Villes : 🗺️ touristique, ⛩️ culturel, 🛍️ commerces, 🍜 gastronomie, 🎢 parcs & loisirs, 🌃 vie nocturne, 🥾 randonnée (Kyoto/Nara), 🎮 otaku/geek (Tokyo).
Excursions : filtrable par destination (Kamakura, Nikko, Fuji Five Lakes, Yokohama, Takao & Mitake).

## Déploiement (GitHub Pages)

1. Copier **tous les fichiers** (pas le dossier, son contenu) à la racine du dépôt `njproject.github.io`
2. Settings → Pages → source = branche principale, dossier racine
3. Site disponible à https://njproject.github.io/

`index.html` et les pages villes/excursions contiennent déjà :
- `<meta name="robots" content="noindex, nofollow">` pour éviter l'indexation par les moteurs de recherche
- Balises Open Graph pour un aperçu propre quand un lien est partagé
- `rel="noopener noreferrer"` sur tous les liens externes

## Fonctionnalités

- Timeline visuelle de l'itinéraire, avec code couleur quand le groupe se sépare
- Cartes logements avec statut (réservé / à réserver) et lien direct vers l'annonce
- Cartes "Explorer [ville]" avec badge nombre de lieux, cohérentes avec le reste du design
- Tableaux transport → transformés en cartes empilées sur mobile (<620px)
- Pages villes/excursions avec filtre par catégorie ou destination
- Nav latérale fixe (desktop) / menu déroulant (mobile)
- Liens de réservation directs pour chaque trajet
- Encart d'évaluation du Hokuriku Arch Pass (pass ferroviaire régional)
- Festivals & événements datés qui tombent pendant le séjour (Baika-sai Kyoto, Hinamatsuri, etc.)
- Infos météo, bagages, détaxe, onsen/tatouages, contacts d'urgence (ambassade de France à Tokyo)
