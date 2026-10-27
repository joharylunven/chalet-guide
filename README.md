# Chalet Guide — démonstrateur

Livret d'accueil digital bilingue (FR/EN), utilisable hors ligne, pour chalets locatifs au Québec et hébergements indépendants en France. Site 100 % statique : aucun serveur, aucune clé d'API. Paiements, envois et IA sont simulés et étiquetés « démo ». Référence du projet : [CLAUDE.md](CLAUDE.md) et [docs/plan.md](docs/plan.md).

| Page | Adresse | Pour qui |
|---|---|---|
| Vitrine | `#/` | Prospects (sélecteur Québec / France) |
| Guides de démo | `#/demo`, `#/demo/<slug>` | Voyageurs (5 hébergements fictifs) |
| Générateur d'aperçu | `#/apercu`, `#/apercu/fiche/<id>` | Hôte, en prospection |
| Tableau de bord | `#/tableau-de-bord` | Hôte |
| Suivi du spa | `#/tableau-de-bord/spa` | Exploitant |

## Lancer en local (macOS)

Prérequis : Node 20.19 ou plus récent (`node -v`), Python 3.10+ pour les données.

```bash
npm install
```

```bash
npm run dev
```

Puis ouvrir http://localhost:5173. Version compilée, avec le service worker (hors ligne) :

```bash
npm run build && npm run preview
```

Tests : contenus, assistant, spa, aperçu, tableau de bord, et absence de courriels et de téléphones dans `public/` et `dist/`.

```bash
npm test
```

## Configurer

- **Nom du produit, courriel de contact, tarifs** : `src/config.ts`. Le courriel de contact doit aussi être déclaré dans `tests/pii-allowlist.json`, sinon le test anti-données personnelles bloque le build.
- **Pays** (urgences avec leurs sources, devise, identifiant légal, mention spa, sources en direct) : `src/countries/qc.ts`, `src/countries/fr.ts`.
- **Textes d'interface** : `src/i18n/fr.json`, `src/i18n/en.json` (mêmes clés, vérifié par les tests).
- **Suivi du spa** : `src/spa/config.ts`. Aucun seuil ni aucune fréquence réglementaire n'y est codé ; les valeurs « exemple » ne s'appliquent qu'à la demande de l'exploitant, avec un avertissement.
- **Icônes de l'application** : `npm run icons` (régénère les PNG à partir du dessin du favicon ; nécessite Pillow).

## Régénérer les données d'établissements

Déposer l'export SIT Québec dans `data/raw/sit-quebec-residences-tourisme.json`, puis :

```bash
npm run data
```

- `public/data/etablissements/` : jeu assaini (aucun courriel, téléphone ni nom de personne ; GPS arrondi), **à versionner** : il est publié avec le site.
- `data/private/prospects.csv` et `noms_masques.csv` : local, ignoré par Git, jamais publié.

Relancer ensuite `npm test` avant de versionner.

## Ajouter un hébergement de démo

1. Copier un fichier de `src/content/guides/` (par exemple `refuge-lac-brule.json`) sous un nouveau nom ; le champ `slug` donne l'adresse (`#/demo/<slug>`).
2. Remplir chaque texte en `{ "fr": …, "en": … }` ; le schéma est dans `src/content/schema.ts`.
3. Choisir les modules dans `house.modules` parmi `src/content/modules/` (le module doit lister le pays du guide dans `countries`).
4. Lancer `npm test` : un champ manquant, un module ou une icône inconnus font échouer le test de contenu.

Tout contenu de démo est fictif (nom, codes, exploitant, commerces) ; coordonnées à 2 décimales.

## Déployer sur GitHub Pages

1. Créer un dépôt GitHub et y pousser le projet (branche `main`). `data/raw/`, `data/private/` et `docs/interne/` sont exclus par `.gitignore`.
2. Dans le dépôt : **Settings → Pages → Build and deployment → Source : GitHub Actions**.
3. Chaque push sur `main` lance [.github/workflows/deploy.yml](.github/workflows/deploy.yml) :
   - tests sur `public/` ;
   - compilation ;
   - test anti-données personnelles sur `dist/` ;
   - publication.

   Un courriel ou un téléphone non autorisé bloque la publication.
4. Base : `./` par défaut, ce qui convient au routage par hash, quel que soit le nom du dépôt. Pour un chemin absolu, définir la variable de dépôt `VITE_BASE` (Settings → Secrets and variables → Actions → Variables), par exemple `/chalet-guide/`.

## Hors ligne (PWA)

- À la première visite, le service worker met en cache l'application, les 5 guides, les polices et les icônes (≈ 830 Ko).
- Ensuite, codes, consignes, urgences, assistant, QR code et section spa fonctionnent sans réseau.
- Les tuiles de carte déjà vues restent disponibles.
- Météo, alertes, routes et indice d'incendie affichent leur dernière valeur avec l'heure de mise à jour (« il y a 3 h »).
- Le registre des établissements (≈ 4 Mo) n'est pas pré-chargé : il ne sert qu'au générateur d'aperçu.
- Installé sur l'écran d'accueil, le guide se rouvre directement sur le dernier hébergement consulté.

## Vérifications faites (27 octobre 2026)

- **Hors ligne** : guide ouvert une fois sur la version compilée, serveur arrêté, rechargement. L'accueil, l'arrivée, le wifi, les urgences, l'assistant, la carte (tuiles en cache), le QR code, la section spa et un second guide fonctionnent.
- **Lighthouse mobile** (v12.8, guide du Refuge du Lac-Brûlé) : performance 97, accessibilité 100, bonnes pratiques 100. Rapport : [docs/lighthouse/guide-refuge-mobile.html](docs/lighthouse/guide-refuge-mobile.html). Même résultat sur le guide du Mas des Oliviers.

## Sources et attributions

- Données d'établissements : Ministère du Tourisme du Québec, Système d'information touristique Québec, via Données Québec (CC-BY 4.0).
- Météo : Open-Meteo (CC-BY 4.0).
- Alertes : Environnement Canada (Licence du gouvernement ouvert – Canada).
- Avertissements routiers : MTMD / Québec 511 (CC-BY 4.0).
- Danger d'incendie : Ressources naturelles Canada, CWFIS.
- Fonds de carte : © contributeurs OpenStreetMap.
- Icônes : Lucide (ISC). Police de titres : Fraunces (OFL).
