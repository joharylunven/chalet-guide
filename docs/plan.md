# Plan — démonstrateur Chalet Guide

*Version 2, 26 octobre 2026 : ajout du marché France (profil pays), du module Spa et du suivi sanitaire. Les décisions sur les points ouverts de la v1 sont dans la section « Décisions ». Référence générale : `CLAUDE.md`.*

## Architecture

- **Vite + React + TypeScript**, routage par hash (`#/demo/<slug>`), `base` lue depuis `VITE_BASE` (par défaut `./`).
- **CSS moderne** : variables, `clamp()`, container queries. Pas de Tailwind : on garde la maîtrise d'une identité forte.
  - Palette bois / forêt / lac / neige.
  - Typographies auto-hébergées : *Fraunces* pour les titres, *Inter* pour le texte, via `@fontsource`. Aucun appel externe.
  - Thème sombre pour le guide, automatique ou manuel.
- **Configuration unique** `src/config.ts` : nom du produit, courriel `mailto:`, tarifs, lien du jeu de données, régions prioritaires.
- **Profils pays** `src/countries/{qc,fr}.ts` : langues, devise, identifiant légal (CITQ / n° de meublé), numéros d'urgence (source officielle notée en commentaire), modules proposés par défaut, sources de données en direct, mentions de conformité. Chaque guide déclare son `country`. La vitrine propose un sélecteur Québec / France qui adapte les exemples, les tarifs et la devise.
- **i18n maison** : `src/i18n/fr.json` et `en.json`, hook `useT()`, langue mémorisée. Pas de lib lourde.
- **Contenu des guides** : `src/content/guides/<slug>.json`, validé par un schéma TypeScript (et Zod au build). Chaque texte est un champ `{ fr, en }`.
- **Modules** : bibliothèque `src/content/modules/*.json`. Chaque module est réutilisable et paramétrable par hébergement, et déclare les pays où il s'applique.
  - Québec : poêle, septique/puits, déneigement, faune, règlements, CITQ.
  - France : piscine, tri des déchets, taxe de séjour (info voyageur), voisinage, n° de meublé.
  - Commun : **spa**.
- **Suivi du spa (exploitant)** : `src/spa/` avec saisie des autocontrôles, historique, rappels d'entretien, export CSV/PDF, et carte « Derniers contrôles » publiable dans le guide. Paramètres, seuils et fréquences dans `src/spa/config.ts`, vides par défaut ou étiquetés « exemple ». Aucune valeur réglementaire codée en dur. Mention ARS obligatoire (voir `CLAUDE.md`).
- **Carte** : Leaflet + tuiles OSM, chargées à la demande (lazy) pour préserver le score Lighthouse.
- **Données en direct** : `src/live/` avec un adaptateur par source (Open-Meteo, EC alertes, MTMD 511, CWFIS). Cache `localStorage` horodaté, repli « démo » étiqueté.
- **Assistant** : interface `AnswerProvider { ask(question, guide, lang) }`. Implémentation démo : recherche plein texte côté client (index MiniSearch, tolère les accents et les fautes), avec citation de la section. Une future implémentation pourra appeler une IA via un backend.
- **Analytics locales** : `track(event)` écrit dans `localStorage` (ouvertures, sections, questions, options). Le tableau de bord lit ces événements et les fusionne avec un jeu d'exemple étiqueté.
- **PWA** : `vite-plugin-pwa` (Workbox). Précache de l'app et des JSON des guides de démo, runtime cache pour les tuiles OSM déjà vues et la météo.
- **Aperçus non publiés** : `noindex` global sur `/apercu` et `/tableau-de-bord`. `robots.txt` interdit aussi ces routes. Avec le routage par hash, le `noindex` est posé au niveau de la page HTML : sur GitHub Pages, tout le site partage un seul `index.html`. Voir *Limites*.

## Pages

| Route | Contenu |
|---|---|
| `#/` | Vitrine : promesse, 3 bénéfices, maquettes (vrais rendus du guide dans un cadre de téléphone), « Comment ça marche » en 3 étapes, tarifs configurables, formulaire de contact simulé + `mailto:`, attribution des données. |
| `#/demo` | Choix parmi les chalets de démo. |
| `#/demo/<slug>` | Guide voyageur. Bandeau « boarding pass » avant / pendant / départ (date simulable), tuiles, météo et alertes, bascule FR/EN, thème sombre. |
| `#/demo/<slug>/<section>` | Arrivée, Wifi, Le chalet (+ modules), Règles, Départ (check-list cochable), Urgences, Autour de nous (carte), Options, Assistant. |
| `#/demo/<slug>/qr` | QR code imprimable (format A5), généré côté client. |
| `#/apercu` | Recherche (nom, municipalité, CITQ) → éditeur par section + aperçu mobile en direct, complétude en %, liste de ce qui manque, export/import JSON, bandeau « Aperçu non publié — démo ». |
| `#/tableau-de-bord` | Graphiques en SVG maison (pas de lib) : ouvertures par jour, sections, questions, options. Rapport mensuel. Bascule « mes données de démo » / « exemple ». |
| `#/tableau-de-bord/spa` | Suivi du spa : saisie d'un autocontrôle, historique, rappels, export, aperçu de ce que voit le voyageur. |
| `#/demo/<slug>/spa` | Section spa du guide : consignes d'utilisation + carte « Derniers contrôles » si l'exploitant l'a publiée. |

### Chalets de démo (fictifs)

1. **Le Refuge du Lac-Brûlé**, Laurentides : hiver, spa, poêle à bois, chemin privé à déneiger.
2. **La Maison des Battures**, Charlevoix : bord du fleuve, kayaks, marées, ours.
3. **Le Domaine des Érables**, Cantons-de-l'Est : familial, puits et fosse septique, feux de camp.

Hébergements de démo France (fictifs) :

4. **Le Mas des Oliviers**, gîte en Provence : spa privatif et piscine, tri des déchets, taxe de séjour, option panier du marché local.
5. **La Parenthèse**, love room en Normandie : spa intérieur, options (bouteille, décoration, départ tardif). Le mode réservation directe montre le paiement simulé.

Visuels : illustrations SVG originales (paysages stylisés). Aucune photo d'annonce réelle.

## Données

`scripts/prepare_data.py` (Python 3, sans dépendance) :

- `public/data/etablissements/index.json` : index léger pour la recherche (id, nom, municipalité, CITQ, région). Environ 1 Mo estimé.
- `public/data/etablissements/<region>.json` : fiches détaillées assainies, chargées à la sélection. GPS arrondi à 2 décimales.
- `data/private/prospects.csv` : un contact par ligne, tri et colonnes comme demandé. Jamais copié dans `public/`.
- Vérifications intégrées : décompte des fiches et taille des sorties.
- Les noms d'établissements (`SyndicObjectName`) sont gardés, puisque c'est le nom public de l'hébergement. **Point d'attention :** certains propriétaires ont pu nommer leur fiche avec leur propre nom (« Chalet de Jean Tremblay »). Je propose un filtre heuristique : si le nom contient un prénom courant suivi d'un nom, ou le motif « chez X », il est remplacé par « Chalet à <municipalité> ». Ces cas sont listés dans un rapport local pour relecture.

Tests (`vitest`) : `tests/no-pii.test.ts` parcourt `public/` et `dist/` à la recherche de motifs de courriel et de téléphone nord-américains, et échoue au premier trouvé. Lancé par `npm test` et dans le workflow CI avant déploiement.

`.gitignore` : `data/raw/`, `data/private/`, `docs/interne/`, `node_modules/`, `dist/`.

**France (plus tard, hors démo actuelle)** : évaluer DATAtourisme (open data national du tourisme) pour un pré-remplissage des gîtes et campings. À vérifier avant tout code : licence, champs disponibles, présence de données personnelles, volume. Même séparation public assaini / prospects privés que pour le Québec, cadre RGPD.

## Étapes (avec démonstration à chaque fin)

1. **Benchmark + plan**, ce document. ✅ validé (v2).
2. ✅ **Script de données** : `prepare_data.py`, sorties, test anti-données personnelles, `.gitignore`. Je montre les chiffres et un extrait.
3. ✅ **Guide voyageur** : squelette Vite, design system, i18n, profils pays, 3 chalets québécois et 2 hébergements français, modules, assistant, carte, données en direct, QR. Vérification à 375 px et 1280 px, clair et sombre.
3b. ✅ **Module Spa** : section voyageur et suivi du spa côté exploitant (saisie, historique, rappels, export, carte publiée dans le guide), mention ARS.
4. ✅ **Générateur d'aperçu** : recherche, pré-remplissage, éditeur, aperçu en direct, complétude, import/export.
5. ✅ **Tableau de bord** : événements réels + exemple, graphiques, rapport.
6. ✅ **Vitrine** : page d'accueil FR/EN avec sélecteur Québec / France, tarifs en CAD ou EUR, section « Hébergements avec spa », contact simulé.
7. ✅ **PWA, hors ligne, déploiement** : service worker, test en mode avion (Chrome DevTools hors ligne + vrai rechargement), Lighthouse mobile, workflow GitHub Actions (`actions/deploy-pages`), README.

## Limites et alternatives (à trancher)

- **`noindex` par route** : impossible de façon fiable avec un seul `index.html` et un routage par hash. Les moteurs n'indexent de toute façon pas les fragments `#/…`. Je mets `<meta name="robots" content="noindex">` dynamique + `robots.txt`. Alternative si tu veux une garantie stricte : générer un `apercu.html` séparé (entrée Vite multi-page) avec `noindex` en dur.
- **SOPFEU** : pas d'API publique. Lien officiel + indice fédéral CWFIS clairement libellé (voir benchmark).
- **État des routes l'hiver** (chaussée enneigée/glacée) : pas de flux public trouvé. On affiche seulement les fermetures et entraves MTMD (en direct) + un lien vers Québec 511.
- **Hors ligne de la carte** : seules les tuiles déjà vues sont disponibles hors ligne. Dans la démo, la liste des recommandations reste lisible hors ligne même sans carte.
- **Lighthouse ≥ 90** : Leaflet et le jeu de données ne sont chargés qu'à la demande, les polices sont auto-hébergées en sous-ensemble.
- **`prospects.csv`** : il contient des courriels issus d'un jeu public. Il reste local et ignoré par Git. Le script n'envoie rien. La démarche anti-pourriel (LCAP) sera traitée à part, comme prévu.

## Décisions (v2)

- **`noindex`** : la solution proposée suffit pour la démo (meta dynamique + `robots.txt`). L'entrée multi-page séparée ne sera faite que si un aperçu réel de prospect est partagé publiquement.
- **SOPFEU / CWFIS** : validé tel que proposé (lien officiel SOPFEU + indice fédéral CWFIS clairement libellé).
- **Routes en hiver** : validé (événements MTMD en direct + lien Québec 511).
- **Hors ligne de la carte** : validé (liste lisible hors ligne, tuiles déjà vues en cache).
- **Filtre des noms de fiche** contenant un nom de personne : validé, avec rapport local à relire.
- **France** : profil pays et contenus fictifs dans la démo. Pas de données réelles françaises tant que DATAtourisme n'est pas vérifié.
- **Spa** : aucune valeur réglementaire codée en dur ; mention ARS visible.
