# Planner Japon 2027

Application React/Vite qui construit automatiquement des parcours de visite à partir des votes du groupe. Elle fait partie du guide de voyage du dépôt `njproject.github.io` et est servie sous `/planner/`.

## Fonctionnement

À partir des activités des pages du guide et des votes enregistrés dans Firestore, le planner :

- détecte les votants et filtre les activités par ville et par date ;
- génère jusqu'à 3 parcours par jour, avec ou sans séparation du groupe ;
- classe les jours d'un séjour du meilleur au moins bon, ou enchaîne plusieurs jours choisis sans répéter d'activité ;
- calcule les horaires en tenant compte des durées, des horaires d'ouverture et des trajets depuis le logement du jour ;
- exporte le parcours en PDF.

L'algorithme est déterministe et explicable, sans recours à un modèle d'IA.

## Sources de données

| Source | Contenu |
|---|---|
| Pages HTML du guide | Lieux de `osaka`, `nara`, `kyoto`, `kanazawa`, `tokyo`, `fuji` et `excursions`, lus à l'exécution pour éviter de maintenir une seconde liste |
| Firestore `customPois` | Lieux ajoutés par le groupe depuis les pages villes |
| Firestore `votes/{ville--slug}` | Votes `voters` (pour) et `excluders` (ne veut pas faire), par prénom |
| Firestore `plannerActivities/{ville--slug}` | Métadonnées propres au planner (voir ci-dessous) |
| `src/services/lodgings.js` | Logement de chaque étape, utilisé comme point de départ de la journée |

Les excursions à la journée n'ont pas de logement propre : elles partent du logement de Tokyo actif à la date choisie.

### Métadonnées d'une activité

```text
location:       { lat, lng }
durationMin:    nombre de minutes
openingHours:   { open: "HH:MM", close: "HH:MM" }
availableDates: ["YYYY-MM-DD", ...]
```

Sans durée renseignée, une durée par défaut est appliquée selon la catégorie (de 60 minutes pour le culturel ou la gastronomie à 240 pour un parc de loisirs). Sans coordonnées, les trajets retombent sur une valeur par défaut.

## Algorithme

Pour chaque jour et chaque répartition du groupe envisagée, le parcours est construit de façon gloutonne : à chaque étape, on retient l'activité qui maximise un score combinant votes, coût du trajet depuis l'étape précédente, temps d'attente avant ouverture, bonus pour les activités obligatoires et bonus pour la gastronomie sur les créneaux de repas.

- Les poids sont regroupés dans la constante `WEIGHTS` de `src/algorithm/planner.js`.
- Le pool de candidats est limité aux 12 activités les plus votées par sous-groupe.
- Une activité qu'un membre du sous-groupe a exclue n'est jamais proposée à ce sous-groupe.
- En mode multi-jours, une répartition du groupe déjà utilisée un jour reçoit un bonus les jours suivants pour éviter les recompositions inutiles.

## Contraintes

| Type | Effet |
|---|---|
| Jour précis | Limite la génération à une date |
| Plusieurs jours | Enchaîne les jours choisis, sans répétition d'activité |
| Activité obligatoire | Force l'activité dans le parcours, plusieurs par contrainte |
| Activité exclue | Retire les activités du pool, plusieurs par contrainte |
| Créneau horaire | Borne le début et la fin de journée |
| Temps libre | Bloque une plage au milieu de la journée |
| Durée libre | Étire ou raccourcit une activité (parc, balade) entre un minimum et un maximum |
| Rester groupé | Désactive les propositions de séparation |

Les contraintes contradictoires (obligatoire et exclue à la fois, jour précis et multi-jours, plages incohérentes) bloquent la génération, et un résumé en clair des contraintes actives est affiché avant de lancer le calcul.

## Routage

`src/services/routing.js` fournit les temps de trajet, avec trois niveaux :

1. **Google Directions** (transport en commun) si `VITE_GOOGLE_MAPS_API_KEY` est définie. Non activé à ce jour.
2. **Proxy d'itinéraires** si `VITE_ROUTING_URL` est définie.
3. **Estimation à vol d'oiseau** par défaut : marche en dessous de 1,2 km, sinon vitesse de transport en commun avec un forfait d'accès de 8 minutes.

Une clé Google exposée dans un frontend statique n'est jamais secrète : elle doit être restreinte par domaine et protégée par un quota journalier et une alerte de budget côté Google Cloud.

## Administration

`/planner/?admin=1` affiche, après saisie du mot de passe, le panneau d'administration :

- édition des métadonnées d'une activité (coordonnées, durée, horaires, dates possibles) ;
- import groupé au format JSON, avec génération d'un squelette contenant les identifiants de chaque ville.

Le mot de passe est vérifié côté navigateur : il limite l'accès à l'interface mais ne constitue pas un contrôle d'accès. Les règles Firestore valident la forme des données écrites, sans authentifier l'auteur.

## Structure

```
src/
├── App.jsx                     Interface et orchestration
├── firebase.js
├── algorithm/
│   ├── planner.js              Génération des parcours
│   └── validateConstraints.js  Validation et résumé des contraintes
├── components/
│   ├── PlanCard.jsx            Affichage d'un parcours
│   └── AdminPanel.jsx          Métadonnées et import groupé
├── services/
│   ├── activities.js           Chargement des activités, villes et dates
│   ├── votes.js                Lecture des votes et exclusions
│   ├── plannerData.js          Métadonnées Firestore
│   ├── lodgings.js             Points de départ par étape
│   ├── routing.js              Temps de trajet
│   └── googleMaps.js           Chargement de l'API Google Maps
└── utils/
    ├── exportPlan.js           Export PDF (jsPDF)
    └── slugify.js
```

## Limites connues

- Les repas ne sont pas planifiés comme des étapes : les activités de gastronomie reçoivent seulement un bonus sur les créneaux de déjeuner et de dîner.
- Les trajets sont estimés, faute de fournisseur d'itinéraires branché.
- Le logement de la première étape à Tokyo (26–28 février) n'est pas défini, donc aucun point de départ n'y est utilisé.
- Le planner n'a pas d'authentification réelle.

## Développement

```bash
npm install
npm run dev      # serveur local
npm run build    # écrit dans ../planner-build/ (ignoré par Git)
```

Le `base` de Vite est réglé sur `/planner/`. Les variables d'environnement sont décrites dans `.env.example`.