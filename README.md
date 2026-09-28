# Guide Japon 2027

Site de référence partagé pour un voyage de groupe de 20 jours au Japon (février–mars 2027). Il centralise l'itinéraire, les logements, les transports, les réservations à ne pas manquer et les lieux à voir ville par ville, avec un système de vote pour décider des activités à plusieurs et un planificateur qui construit automatiquement les journées à partir de ces votes.

Site en ligne : https://njproject.github.io

## Principe de structure

- **`index.html`** regroupe tout ce qui relève du **temps et de la logistique** : itinéraire, logements, transports, calendrier des réservations, festivals, documents administratifs, infos pratiques. Tout est accessible par ancre depuis la navigation latérale.
- **Les pages villes et la page excursions** ne traitent que ce qui est **lié au lieu** (à voir et à faire sur place), filtrable par catégorie.

Il n'y a volontairement pas de pages séparées pour les transports ou l'administratif : ce sont des informations que l'on consulte ensemble.

## Structure du dépôt

```
.
├── index.html            Guide principal
├── osaka.html            Pages villes (générées, voir ci-dessous)
├── nara.html
├── kyoto.html
├── kanazawa.html
├── tokyo.html
├── fuji.html
├── excursions.html       Kamakura, Nikko, Yokohama, Takao & Mitake
├── generate_cities.py    Source de vérité du contenu des pages ci-dessus
├── assets/               Ressources partagées par les pages statiques
│   ├── style.css
│   ├── script.js         Navigation, filtres, calendrier, bandeau d'échéance
│   ├── deadlines.js      Échéances de réservation
│   ├── votes.js          Votes par lieu (Firestore)
│   ├── custom-pois.js    Ajout / édition de lieux en mode admin
│   └── firebase-config.js
├── japan-planner/        Code source du planificateur (React + Vite)
├── planner/              Version compilée du planificateur
└── favicon.*, apple-touch-icon.png, site.webmanifest
```

## Génération des pages

`osaka.html`, `nara.html`, `kyoto.html`, `kanazawa.html`, `tokyo.html`, `fuji.html` et `excursions.html` sont produites par `generate_cities.py` à partir du dictionnaire `CITIES`. Tout changement de contenu (lieu, lien, description) se fait dans ce script, pas dans le HTML généré, qui serait écrasé à la génération suivante.

`index.html` est le seul fichier de contenu édité à la main.

## Fonctionnalités

**Guide**
- Timeline de l'itinéraire, avec code couleur lorsque le groupe se sépare
- Cartes de logements avec statut (réservé / à réserver) et lien vers l'annonce
- Tableaux de transport avec liens de réservation directs, affichés en cartes empilées sur mobile
- Calendrier des réservations et bandeau de la prochaine échéance, alimentés par `assets/deadlines.js`
- Festivals et événements datés tombant pendant le séjour
- Évaluation du Hokuriku Arch Pass, météo, bagages, détaxe, onsen et tatouages, contacts d'urgence
- Navigation latérale fixe sur desktop, menu déroulant sur mobile

**Pages villes**
- Lieux classés par catégorie, filtrables
- Vote nominatif par lieu : chaque personne peut voter pour un lieu ou signaler qu'elle ne veut pas le faire, et retirer son choix à tout moment
- Mode admin (`?admin=1`, protégé par mot de passe) pour ajouter, modifier ou supprimer des lieux sans toucher au code

**Planificateur (`/planner/`)**
- Génération d'un parcours pour une journée ou plusieurs jours enchaînés, sans répétition d'activités
- Prise en compte des votes et exclusions, de la géographie (trajets estimés depuis le logement du jour), des horaires d'ouverture et des durées par catégorie, avec un bonus pour les repas
- Contraintes personnalisables : jour précis, plusieurs jours, activités obligatoires ou exclues, créneau horaire, temps libre, durée libre pour les balades, groupe non séparé
- Validation des contraintes contradictoires et résumé des contraintes actives avant génération
- Export PDF du parcours généré

## Catégories de lieux

Villes : touristique, culturel, commerces, gastronomie, parcs & loisirs, vie nocturne, randonnée, otaku / geek.
Excursions : classées par destination (Kamakura, Nikko, Yokohama, Takao & Mitake).

## Stack

- Site statique : HTML, CSS et JavaScript sans framework
- Planificateur : React et Vite
- Données partagées : Firebase Firestore (votes, lieux ajoutés, métadonnées géographiques des activités)
- Génération des pages : Python
- Export PDF : jsPDF

## Conventions

- Les liens (CSS, JS, navigation, favicons) utilisent des chemins absolus depuis la racine du domaine.
- Les échéances de réservation ont une source unique, `assets/deadlines.js` : le calendrier et le tableau des réservations en sont dérivés.
- Toutes les pages portent `noindex, nofollow`, et les liens externes `rel="noopener noreferrer"`.
- Les règles de sécurité Firestore sont gérées dans la console Firebase et ne sont pas versionnées ici.

## Développement du planificateur

```bash
cd japan-planner
npm install
npm run dev      # serveur local
npm run build    # génère planner-build/ (ignoré par Git)
```