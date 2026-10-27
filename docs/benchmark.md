# Benchmark — livrets d'accueil digitaux

*Note interne, 26 octobre 2026. Sources : sites publics et pages produit des éditeurs. On reprend des patterns d'UX, jamais des textes, des visuels ni des marques.*

## Vue d'ensemble

| Plateforme | Cible | Ce qu'elle fait de mieux | Ce qu'on reprend |
|---|---|---|---|
| **Touch Stay** | Locations courte durée, conciergeries | Guide web sans téléchargement, découpé selon le séjour (avant / pendant / après). Envoi programmé par courriel ou SMS via le PMS. Traduction automatique. Boutique d'options en quelques touches. Assistant qui répond à partir du contenu du guide seulement. Statistiques de lecture. | Sections courtes à une seule fonction. Assistant limité au contenu du guide, qui renvoie toujours la section source. Statistiques « ce que les voyageurs lisent ». Lien et QR code comme points d'entrée. |
| **Hostfully Guidebooks** | Hôtes et gestionnaires | Recommandations locales riches avec carte, importables puis modifiables. Options payantes (navette, ménage, partenaires locaux) réglées par Stripe ; l'hôte est notifié puis exécute. Partage par lien privé ou PDF. | Fiche recommandation : catégorie, distance, pourquoi on aime, saison. Carte et liste synchronisées. Option = demande → notification hôte → exécution. Export imprimable. |
| **Enso Connect** (« boarding pass ») | Gestionnaires, petits hôtels | Parcours voyageur unique, de la réservation au départ : vérification, check-in à distance, accès, guide, options. Messages déclenchés par des conditions (date, durée de séjour). Aperçu de l'expérience voyageur avant mise en ligne. | La métaphore « carte d'embarquement » : un en-tête qui change selon le moment du séjour (J-3 : itinéraire et accès hiver ; sur place : codes et wifi ; dernier jour : check-list de départ). Aperçu en direct côté hôte. |
| **Duve** | Hôtellerie | Options proposées au moment où le voyageur est le plus susceptible d'accepter. Messagerie unifiée (dont Airbnb). IA qui répond aux questions simples (wifi…) puis passe la main à l'humain. Check-in en ligne, puis « mode séjour ». Aucun mot de passe. | Options contextuelles (bois de chauffage mis en avant quand il fait froid, départ tardif la veille du départ). Bascule de mode avant / pendant. Escalade de l'assistant vers l'hôte quand il ne trouve pas. |
| **Sunver** (FR) | Hôtes, hôtels | QR code imprimable depuis le tableau de bord (supports physiques en vente). Traduction automatique selon la langue du téléphone. Paiements Stripe sans commission. Module FAQ, avis, statistiques. | QR code par guide, avec page d'impression A5 soignée. Langue initiale = langue du navigateur, bascule toujours visible. |
| **GetWelcom** (FR) | Hôtels, résidences | Room directory centralisé (infos et services de l'établissement), commandes directes (petit-déjeuner, room service), check-in dématérialisé, enquêtes de satisfaction. | Écran d'accueil en tuiles, façon room directory. Une tuile = un service ou un besoin. Interface colorée qu'on peut modifier sans formation. |

## Patterns retenus pour Chalet Guide

1. **Accès sans friction.** On ouvre un lien ou on scanne un QR code : pas de compte ni de mot de passe. PWA installable *en option*.
2. **Accueil en tuiles, mobile-first.** Huit à dix tuiles avec une icône et un libellé court, à la façon d'un room directory. Les infos critiques (code de porte, wifi) sont à un toucher près.
3. **Parcours en trois temps.** Bandeau type « boarding pass » : avant, pendant, départ. Le contenu mis en avant change selon la date (simulable dans la démo).
4. **Assistant limité au guide.** Réponses tirées uniquement du contenu, avec lien vers la section. Sans réponse : « je transmets à votre hôte » (simulé).
5. **Options au bon moment.** Mise en avant contextuelle selon la météo et le jour. Deux modes de paiement, notre ajout :
   - réservation directe : bouton « Payer » (simulé) ;
   - Airbnb : bouton « Faire une demande ». Le paiement passe par Airbnb, et la démo l'explique.
6. **Recommandations sur carte.** Liste et carte synchronisées, catégorie, distance, saison.
7. **Statistiques orientées valeur.** Pas de tableaux bruts. Un rapport qui chiffre le temps gagné : « 37 questions répondues sans vous ».
8. **Aperçu en direct côté hôte.** Formulaire à gauche, téléphone à droite (comme Enso), plus un indicateur de complétude.

## Ce que personne ne fait (notre différenciation)

- **Modules chalet québécois prêts à l'emploi** : poêle à bois, spa, fosse septique et puits, déneigement et accès l'hiver, faune (ours, déchets), règlements municipaux sur le bruit et les feux, n° CITQ affiché. Les concurrents restent généralistes (appartements, hôtels).
- **Hors ligne réel.** Aucun concurrent étudié ne met le hors-ligne en avant. Or la couverture cellulaire est faible dans beaucoup de chalets.
- **Conformité Airbnb visible.** Le mode « demande » sans paiement hors plateforme. Les concurrents poussent le paiement Stripe partout.
- **Infos vivantes locales** : météo, danger d'incendie, avertissements routiers et alertes météo officielles autour du chalet.
- **Pré-remplissage depuis le registre officiel** (SIT Québec / CITQ) : un aperçu prêt en une minute pour la prospection.

## Marché France : ce qui change

En France, le livret digital est déjà bien couvert par des acteurs locaux :
- **Sunver** : hôtels, campings, conciergeries ;
- **GetWelcom** et **Cool'n Camp** (eSeason) : campings, villages et clubs vacances, avec réservation d'activités et click & collect ;
- **Hitenant** : modules par logement.

Un livret générique de plus n'y a pas de place. Notre angle est **l'hébergement équipé d'un spa** (gîtes, chambres d'hôtes, campings, love rooms) :

- **Section spa pour le voyageur.** Les guides étudiés traitent le spa comme un équipement parmi d'autres ; aucun n'en fait un module complet (utilisation, hygiène, incidents).
- **Suivi du spa pour l'exploitant.** Saisie des autocontrôles, historique, rappels d'entretien, affichage des derniers résultats pour les voyageurs. Aucun des outils étudiés ne le propose. Le cadre réglementaire évolue (Code de la santé publique art. D.1332-1 et suivants, textes 2025-2026, transfert de certains prélèvements à l'exploitant à partir de 2027 selon l'ARS), mais son application aux gîtes et chambres d'hôtes reste à confirmer par établissement. On outille le suivi, on ne tranche pas l'obligation.
- **Love rooms** : prix par nuit élevé, réservation souvent directe, options qui se vendent bien. C'est la vitrine idéale pour la boutique d'options.

Source réglementaire consultée : ARS Hauts-de-France, « Les eaux de piscines » (hauts-de-france.ars.sante.fr/les-eaux-de-piscines).

## Flux de données en direct : vérifications du 26 octobre 2026

Vérifiés par requête réelle, avec un en-tête `Origin` de type GitHub Pages.

| Besoin | Source | Licence | CORS | Décision |
|---|---|---|---|---|
| Météo | Open-Meteo `api.open-meteo.com` | CC-BY 4.0, sans clé | `*` ✅ | En direct |
| Alertes météo | Environnement Canada, GeoMet-OGC-API `api.weather.gc.ca/collections/weather-alerts` (GeoJSON, filtre `bbox`) | Licence du gouvernement ouvert – Canada | `*` ✅ | En direct. Si aucune alerte : « Aucune alerte en vigueur » |
| Avertissements routiers | MTMD (données de Québec 511), WFS `ws.mapserver.transports.gouv.qc.ca/swtq` couche `ms:evenements`, GeoJSON | CC-BY 4.0 | renvoie l'origine appelante ✅ | En direct, filtré par distance autour du chalet. Lien vers Québec 511 pour l'état des routes en hiver (chaussée enneigée, etc. : pas de flux public trouvé) |
| Danger d'incendie | **SOPFEU** : pas d'API publique documentée. Leur site appelle une API interne (`geofeux.sopfeu.qc.ca`), non publiée et sans licence ; on ne l'utilise pas. Indice publié seulement en saison (printemps–automne). | — | — | Lien officiel SOPFEU + **alternative** : indice fédéral CWFIS (Ressources naturelles Canada), WMS `GetFeatureInfo` couche `fdr_current`, licence gouvernement ouvert, CORS `*` ✅. Libellé « Indice fédéral (CWFIS) », jamais présenté comme l'indice SOPFEU. |

Hors ligne : la dernière valeur est conservée en cache, avec son horodatage (« mis à jour il y a 3 h »). On ne fabrique jamais d'alerte présentée comme réelle. Les exemples de démo portent l'étiquette « Exemple — démo ».

## Sources

- https://touchstay.com
- https://www.hostfully.com/digital-guidebooks/features/ · https://www.hostfully.com/digital-guidebooks/features/upselling
- https://www.ensoconnect.com/boarding-pass
- https://duve.com
- https://www.sunver.app
- https://www.getwelcom.com
- https://www.donneesquebec.ca/recherche/dataset/avertissement-routier
- https://api.weather.gc.ca/collections/weather-alerts
- https://cwfis.cfs.nrcan.gc.ca
- https://www.sopfeu.qc.ca
