# Planner Japon 2027

Application React/Vite à placer dans `planner/` du dépôt `NJProject.github.io`.

## Objectif

À partir des activités déjà présentes dans les pages `osaka.html`, `nara.html`, `kyoto.html`, `kanazawa.html` et `tokyo.html`, l'application :

- lit les votes booléens déjà présents dans Firestore ;
- détecte les votants ;
- filtre les activités par ville/date ;
- propose jusqu'à 3 parcours ;
- autorise des séparations du groupe ;
- prend en compte durée, horaires et coordonnées lorsqu'elles sont renseignées ;
- expose une interface d'administration pour compléter les métadonnées des activités.

Le guide existant reste intact.

## Installation locale

Depuis le dossier `planner/` :

```bash
npm install
npm run dev
```

Puis ouvrir l'URL affichée par Vite.

Pour l'intégration GitHub Pages, construire avec :

```bash
npm run build
```

Le build est écrit dans `../planner-build/`. Pour le déploiement statique,
copier le contenu de `planner-build/` dans un dossier `/planner/` à la racine
du dépôt. Le `base` Vite est déjà réglé sur `/planner/`.

Une fois déployé :

`https://njproject.github.io/planner/`

Tu peux ensuite ajouter un lien dans `index.html` vers `/planner/`.

## Firebase

L'application utilise le même projet Firestore que le guide actuel :

`japon-2027-votes`

La structure de vote existante est conservée :

```text
votes/{city--slug}
  voters:
    Nicolas: true
    ...
```

Le planner ajoute seulement :

```text
plannerActivities/{city--slug}
```

pour les métadonnées supplémentaires.

### Important : règles Firestore

Les règles Firestore existantes doivent autoriser la lecture des documents `votes/{id}` et la lecture/écriture de `plannerActivities/{id}` pour l'administration.

Ne remplace pas les règles actuelles sans les vérifier.

## Données d'activités

Les activités sont chargées directement depuis les pages HTML du guide au runtime. Cela évite de maintenir une seconde liste de lieux.

Le planner ajoute ensuite les métadonnées Firestore :

- `location: { lat, lng }`
- `durationMin`
- `openingHours: { open, close }`
- `availableDates: ["YYYY-MM-DD", ...]`

Tant que les coordonnées ne sont pas renseignées, le parcours utilise une estimation grossière des déplacements.

## Routage

La V1 possède une abstraction de routage dans `src/services/routing.js`.

Sans API, elle utilise une estimation basée sur la distance à vol d'oiseau.

Pour une vraie optimisation des transports japonais, il faudra brancher un fournisseur d'itinéraires multimodal derrière cette abstraction. Ne mets pas une clé API secrète directement dans le frontend.

## Administration

Ajouter `?admin=1` à l'URL du planner pour afficher l'interface de métadonnées.

Exemple :

`/planner/?admin=1`

Cette V1 ne fournit pas encore d'authentification administrateur. Si le planner devient accessible publiquement, il faut sécuriser les écritures Firestore avant de considérer cette interface comme une vraie administration.

## Limites volontaires de la V1

- Les repas ne sont pas planifiés.
- Les contraintes sont volontairement simples.
- Tokyo Ouest/Est est prévu dans l'architecture mais doit être modélisé avec les logements/zones réelles.
- Le routage réel (marche/transports en commun) n'est pas encore branché.
- L'algorithme est déterministe et explicable : pas d'IA nécessaire.

## Première mise en place recommandée

1. Installer et lancer le planner localement.
2. Ouvrir `?admin=1`.
3. Compléter les coordonnées et durées des activités réellement utilisées.
4. Vérifier les dates possibles et horaires.
5. Brancher un fournisseur de routage réel.
6. Tester les propositions avec les votes réels du groupe.
7. Seulement ensuite déployer sous `/planner/`.
