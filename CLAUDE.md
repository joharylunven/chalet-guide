# CLAUDE.md — Chalet Guide (démonstrateur)

Ce fichier est la **référence** du projet. Il remplace `consignes-claude.rtf` (gardé pour historique). En cas de conflit, ce fichier prime, puis `docs/plan.md`.

## Le produit en une phrase
Un livret d'accueil digital (guide voyageur) bilingue, utilisable hors ligne, pour les hébergements indépendants : **chalets locatifs au Québec** et **gîtes, chambres d'hôtes, campings et love rooms en France**, avec un angle fort sur les **hébergements équipés d'un spa**.

Nom de travail : **Chalet Guide**, modifiable dans `src/config.ts`. Le nom pourra changer pour le marché français.

## Deux marchés, un seul produit
Tout ce qui dépend du pays passe par un **profil pays** (`src/countries/qc.ts`, `src/countries/fr.ts`), jamais par du code en dur :

| Élément | Québec (`QC`) | France (`FR`) |
|---|---|---|
| Langues | FR-CA + EN | FR + EN (ES/DE plus tard) |
| Devise | CAD | EUR |
| Identifiant légal affiché | N° d'enregistrement CITQ | N° d'enregistrement du meublé de tourisme (si applicable) |
| Urgences | 911, Info-Santé 811, Centre antipoison du Québec | 112, 15 (SAMU), 18 (pompiers), 17 (police), 114 (SMS), centre antipoison régional |
| Modules spécifiques | Poêle à bois, spa, fosse septique et puits, déneigement et accès l'hiver, faune (ours), règlements municipaux | Spa et suivi sanitaire, piscine, tri des déchets local, taxe de séjour (info voyageur), règles de voisinage |
| Données en direct | Open-Meteo, alertes Environnement Canada, avertissements MTMD/Québec 511, indice CWFIS | Open-Meteo ; alertes Météo-France et autres flux : **à vérifier** (licence, CORS) avant intégration |
| Pré-remplissage | Jeu SIT Québec (ministère du Tourisme, CC-BY 4.0) | **Plus tard** : DATAtourisme (à vérifier : licence, champs, volume). Dans la démo, chalets et gîtes fictifs uniquement |
| Cadre de prospection | LCAP (anti-pourriel) + Loi 25 | RGPD + règles CNIL de prospection B2B |

Les numéros d'urgence et mentions légales doivent être vérifiés sur une source officielle avant affichage, et la source doit être notée en commentaire dans le fichier du profil pays.

## Module « Spa » (différenciant, surtout en France)
Deux faces :
1. **Côté voyageur** (dans le guide) : utilisation, douche avant, durée conseillée, enfants, couvercle, eau trouble, que faire en cas de problème, contact.
2. **Côté exploitant : « Suivi du spa »** (démo, dans `#/tableau-de-bord` ou une route dédiée) :
   - saisie des autocontrôles (date, paramètres mesurés, actions correctives, fréquentation), historique, rappels d'entretien (filtres, vidange, hivernage) ;
   - export du carnet (PDF ou CSV) et **affichage des derniers résultats pour les voyageurs** via le guide (QR) ;
   - lien de réassort de consommables configurable (partenaire distributeur).

   **Règles :**
   - Les seuils et fréquences réglementaires **ne sont pas codés en dur** : fichier de configuration, valeurs par défaut vides ou étiquetées « exemple ».
   - Mention visible : « Le cadre réglementaire (Code de la santé publique, art. D.1332-1 et suivants, textes 2025-2026) dépend du type d'établissement. Vérifiez vos obligations auprès de votre ARS. »
   - Ne jamais affirmer qu'un gîte ou une chambre d'hôtes est soumis ou non à l'obligation.

## Règles non négociables
- **Aucune donnée personnelle** (courriel, téléphone, nom de personne) dans `public/`, `dist/` ni dans le dépôt Git. Test `tests/no-pii.test.ts` obligatoire, lancé avant chaque build de déploiement.
- **Ignorés par Git** : `data/raw/`, `data/private/`, `docs/interne/`, `node_modules/`, `dist/`.
- **Pas de scraping** d'Airbnb, Booking ou des portails de location. Seule source de données réelles : le jeu SIT Québec (et plus tard DATAtourisme après vérification).
- **Aucun texte, visuel ni marque** repris des concurrents ou d'annonces réelles. Contenu des démos inventé, illustrations originales.
- **Aucun envoi d'emails** depuis le démonstrateur. Paiements, IA et formulaires sont simulés et étiquetés « démo ».
- **Airbnb** : mode « faire une demande » sans paiement hors plateforme, et le guide reste facultatif pour le voyageur (jamais une condition d'accès au logement).
- **Attribution** des données SIT Québec en pied de page (Ministère du Tourisme du Québec, SIT Québec, Données Québec, CC-BY 4.0) ; attribution OpenStreetMap sur la carte.

## Technique (résumé, détails dans `docs/plan.md`)
Vite + React + TypeScript, routage par hash, `base` via `VITE_BASE`, PWA (`vite-plugin-pwa`), i18n maison `{ fr, en }`, contenus en JSON validés par Zod, Leaflet chargé à la demande, analytics locales en `localStorage`, aucune clé d'API dans le dépôt. Cibles : macOS en local et GitHub Pages.

## Façon de travailler
- Avancer étape par étape (voir `docs/plan.md`) et montrer le résultat à chaque fin d'étape.
- Vérifier chaque écran à 375 px et 1280 px, en clair et en sombre, avant de le déclarer fini.
- Si une hypothèse bloque (flux indisponible, licence floue, limite de GitHub Pages), le dire et proposer une alternative, sans contourner en silence.
- Ne pas lire `docs/interne/` pour produire du contenu public : c'est du contexte stratégique uniquement.
