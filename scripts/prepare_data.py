#!/usr/bin/env python3
"""Prépare les données d'établissements à partir de l'export SIT Québec.

Source : Ministère du Tourisme du Québec, Système d'information touristique
Québec (SIT Québec), jeu « Chalets, appartements et résidences de tourisme »,
via Données Québec, licence CC-BY 4.0.

Deux sorties, strictement séparées :

1. public/data/etablissements/   (publié avec le site)
   - index.json            index de recherche léger
   - <region>.json         fiches détaillées, sans aucune donnée personnelle
2. data/private/            (jamais publié, ignoré par Git)
   - prospects.csv         un contact par ligne, pour la prospection
   - noms_masques.csv      noms de fiche remplacés, à relire

Usage : python3 scripts/prepare_data.py [--source CHEMIN]
Aucune dépendance hors bibliothèque standard.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import shutil
import sys
import unicodedata
from collections import defaultdict
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SOURCE = ROOT / "data/raw/sit-quebec-residences-tourisme.json"
PUBLIC_DIR = ROOT / "public/data/etablissements"
PRIVATE_DIR = ROOT / "data/private"

SOURCE_LABEL = "Ministère du Tourisme — SIT Québec, Données Québec, CC-BY 4.0"
SOURCE_URL = (
    "https://www.donneesquebec.ca/recherche/dataset/"
    "chalets-appartements-et-residences-de-tourisme"
)

# Ordre de priorité pour la prospection (garder aligné avec src/config.ts).
PRIORITY_REGIONS = ["Laurentides", "Lanaudière", "Cantons-de-l'Est", "Charlevoix"]
MANAGER_THRESHOLD = 5

MAX_PUBLIC_BYTES = 5 * 1024 * 1024

# --- Détection des noms de personne dans les noms de fiche -----------------
#
# Heuristique volontairement large : un faux positif coûte seulement un nom
# générique (« Chalet à Saint-Sauveur »), un faux négatif publie un nom de
# personne. Tous les remplacements sont listés dans noms_masques.csv.

FIRST_NAMES = set(
    """
    alain alexandre alexis alice alain amelie andre andree anne annie antoine
    audrey benoit bernard brigitte bruno carl carole caroline catherine cedric
    celine chantal charles charlotte chloe christian christiane christine
    claude claudette claudia claudine daniel daniele danielle david denis
    denise diane dominic dominique dany eric emilie emily emma emy etienne
    eve fabien felix florence france francine francis francois francoise
    frederic gabriel gaetan gaston genevieve georges gerald gerard ghislain
    gilles gilbert ginette guillaume guy guylaine helene henri hugo isabelle
    jacques jacqueline jean jeanne jeannine jerome jessica jimmy joanne joel
    johanne john jonathan jose josee joseph julie julien justin karine kevin
    laurent laurette laurie lea leo line linda lise lisette louis louise luc
    lucie lucien lyne madeleine manon marc marcel marco marguerite maria
    marie mario marise martin martine mathieu mathilde maxime melanie michel
    micheline mireille monique nancy nathalie nelson nicolas nicole noel
    normand olivier pascal pascale patrice patrick paul pauline philippe
    pierrette rachel raymond real rejean remi renee richard robert roger
    roland ronald sam samuel sandra sebastien serge simon solange sonia
    sophie stephane stephanie steve suzanne sylvain sylvie therese thomas tom
    valerie veronique vincent virginie yannick yves yvon yvonne zoe
    """.split()
)
# Prénoms qui sont aussi des mots courants dans les noms de chalets.
FIRST_NAMES -= {"france", "line", "noel", "real"}

SAFE_AFTER_CHEZ = {"vous", "nous", "soi", "moi", "toi", "lui", "eux"}
STREET_WORDS = (
    r"chemin|ch|rue|rang|route|rte|montee|boul|boulevard|avenue|av|place|"
    r"impasse|cote|allee|croissant|promenade|terrasse|domaine|lac"
)
RE_CHEZ = re.compile(r"\bchez\s+([a-z]+)")
RE_ADDRESS = re.compile(
    rf"^\s*(\d{{2,5}}[a-z]?[\s,-]+\w|\d{{1,5}}[a-z]?[\s,-]+({STREET_WORDS})\b)"
)
RE_TOKEN = re.compile(r"(?<![-a-z])([a-z]+)(?:'s)?(?![-a-z])")
# « St-Laurent », « Place St Bernard », « La Madeleine » : toponymes, pas des personnes.
RE_PLACE_PREFIX = re.compile(r"\b(st|ste|saint|sainte|la)\.?\s+$")


def fold(text: str) -> str:
    """Minuscules sans accents, apostrophes typographiques normalisées."""
    text = text.replace("’", "'").lower()
    return "".join(
        c for c in unicodedata.normalize("NFD", text) if unicodedata.category(c) != "Mn"
    )


def personal_name_reason(name: str) -> str | None:
    f = fold(name)
    m = RE_CHEZ.search(f)
    if m and m.group(1) not in SAFE_AFTER_CHEZ:
        return "chez + nom"
    if RE_ADDRESS.search(f):
        return "adresse civique"
    for m in RE_TOKEN.finditer(f):
        tok = m.group(1)
        if tok in FIRST_NAMES and not RE_PLACE_PREFIX.search(f[: m.start()]):
            return f"prénom ({tok})"
    return None


# --- Lecture des fiches ------------------------------------------------------


def first(lst, *keys, default=None):
    """Premier élément d'une liste puis chemin de clés, avec valeur par défaut."""
    if not lst:
        return default
    cur = lst[0]
    for k in keys:
        if not isinstance(cur, dict) or k not in cur:
            return default
        cur = cur[k]
    return cur


def labels(rec: dict, outer: str, inner: str) -> list[str]:
    out = []
    for group in rec.get(outer) or []:
        for item in group.get(inner) or []:
            lab = item.get("ThesLibelle")
            if lab and lab not in out:
                out.append(lab)
    return out


def tourist_region(rec: dict) -> str:
    # ZonesGeographiquess et ZonesGeographiquesTypes s'associent par ID.
    types = {t["ID"]: t.get("ZoneTypeLibelle") for t in rec.get("ZonesGeographiquesTypes") or []}
    for z in rec.get("ZonesGeographiquess") or []:
        if types.get(z["ID"]) == "Région touristique":
            return z["ZoneLibelle"]
    return "Non précisée"


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", fold(text)).strip("-")


def round2(value) -> float | None:
    try:
        return round(float(value), 2)
    except (TypeError, ValueError):
        return None


def to_public(rec: dict) -> tuple[dict, str | None]:
    """Fiche assainie : uniquement des champs non personnels."""
    addr = rec.get("Adresses") or [{}]
    municipalite = addr[0].get("Municipalite") or ""
    raw_name = (rec.get("SyndicObjectName") or "").strip()
    reason = personal_name_reason(raw_name)
    name = f"Chalet à {municipalite}" if reason else raw_name

    periods = []
    for p in rec.get("PeriodeOuvertures") or []:
        entry = {"type": first([p], "Typedexploitation", "ThesLibelle")}
        if p.get("Datedebut"):
            entry["debut"] = p["Datedebut"][:10]
        if p.get("Datefin"):
            entry["fin"] = p["Datefin"][:10]
        periods.append(entry)

    out = {
        "id": rec["SyndicObjectID"],
        "nom": name,
        "municipalite": municipalite,
        "cp": (addr[0].get("CodePostal") or "")[:3],
        "region": tourist_region(rec),
        "lat": round2(first(rec.get("Geolocalisations"), "Latitude")),
        "lon": round2(first(rec.get("Geolocalisations"), "Longitude")),
        "citq": first(rec.get("NumeroEnregistrementHebergements"), "Numerodenregistrementdhebergement"),
        "capacite": first(
            rec.get("CapaciteMaximaleHebergements"),
            "Capacitemaximaleenhebergementnombredepersonnes",
        ),
        "unites": sum(u.get("Nombredunites") or 0 for u in rec.get("Unitess") or []) or None,
        "typesUnites": [
            u["Typedunite"]["ThesLibelle"]
            for u in rec.get("Unitess") or []
            if (u.get("Typedunite") or {}).get("ThesLibelle")
        ],
        "environnement": labels(rec, "Environnements", "Environnement"),
        "activitesTerrestres": labels(rec, "ActivitesSportivesTerrestress", "Activitessportivesterrestres"),
        "activitesNautiques": labels(rec, "ActivitesSportivesNautiquess", "Activitessportivesnautiques"),
        "animaux": labels(rec, "ServicesAnimauxCompagnies", "Animauxdecompagnie"),
        "transport": labels(rec, "ServicesTransports", "Servicesdetransport"),
        "services": labels(rec, "ServicesDisponibless", "Servicesdisponibles"),
        "location": labels(rec, "LocationEquipements", "Locationdequipement"),
        "periodes": periods,
        "maj": (rec.get("Updated") or "")[:10],
    }
    return out, reason


# --- Compression des fiches publiques ---------------------------------------

LIST_FIELDS = [
    "typesUnites", "environnement", "activitesTerrestres", "activitesNautiques",
    "animaux", "transport", "services", "location",
]
INDEX_ONLY = {"region", "nom", "municipalite", "citq"}


def write_public(records: list[dict]) -> dict:
    if PUBLIC_DIR.exists():
        shutil.rmtree(PUBLIC_DIR)
    PUBLIC_DIR.mkdir(parents=True)

    # Libellés du thésaurus remplacés par des indices dans un vocabulaire commun.
    vocab: list[str] = []
    vocab_idx: dict[str, int] = {}

    def code(label: str) -> int:
        if label not in vocab_idx:
            vocab_idx[label] = len(vocab)
            vocab.append(label)
        return vocab_idx[label]

    by_region: dict[str, list[dict]] = defaultdict(list)
    for r in records:
        by_region[r["region"]].append(r)

    regions = sorted(by_region, key=lambda x: (-len(by_region[x]), x))
    region_meta = []
    index_rows = []
    sizes = {}
    for ri, region in enumerate(regions):
        slug = slugify(region)
        rows = []
        for r in sorted(by_region[region], key=lambda x: fold(x["nom"])):
            # nom, municipalité et CITQ sont déjà dans index.json, chargé en premier.
            row = {k: v for k, v in r.items() if k not in INDEX_ONLY and v not in (None, "", [])}
            for f in LIST_FIELDS:
                if f in row:
                    row[f] = [code(x) for x in row[f]]
            rows.append(row)
            index_rows.append([r["id"], r["nom"], r["municipalite"], r["citq"] or "", ri])
        path = PUBLIC_DIR / f"{slug}.json"
        path.write_text(json.dumps({"region": region, "fiches": rows}, ensure_ascii=False, separators=(",", ":")))
        sizes[path.name] = path.stat().st_size
        region_meta.append({"nom": region, "slug": slug, "fiches": len(rows)})

    index = {
        "source": SOURCE_LABEL,
        "sourceUrl": SOURCE_URL,
        "genere": date.today().isoformat(),
        "champsListes": LIST_FIELDS,
        "vocabulaire": vocab,
        "regions": region_meta,
        # [id, nom, municipalite, citq, indice de région]
        "fiches": index_rows,
    }
    path = PUBLIC_DIR / "index.json"
    path.write_text(json.dumps(index, ensure_ascii=False, separators=(",", ":")))
    sizes[path.name] = path.stat().st_size
    return sizes


# --- Liste de prospection privée ---------------------------------------------

RE_EMAIL = re.compile(r"^[a-z0-9._%+'-]+@[a-z0-9.-]+\.[a-z]{2,}$")


def normalize_email(value: str | None) -> str | None:
    if not value:
        return None
    e = value.strip().lower()
    if e.startswith("mailto:"):
        e = e[7:]
    return e if RE_EMAIL.match(e) else None


def write_prospects(raw: list[dict], public_by_id: dict[str, dict]) -> dict:
    PRIVATE_DIR.mkdir(parents=True, exist_ok=True)
    contacts: dict[str, list[dict]] = defaultdict(list)
    invalid = 0
    for rec in raw:
        for c in rec.get("Courriels") or []:
            email = normalize_email(c.get("Coordonnees"))
            if email:
                contacts[email].append(public_by_id[rec["SyndicObjectID"]])
            elif c.get("Coordonnees"):
                invalid += 1

    def region_rank(regions: list[str]) -> int:
        ranks = [PRIORITY_REGIONS.index(r) for r in regions if r in PRIORITY_REGIONS]
        return min(ranks) if ranks else len(PRIORITY_REGIONS)

    rows = []
    for email, fiches in contacts.items():
        regions = sorted({f["region"] for f in fiches}, key=lambda r: (region_rank([r]), r))
        rows.append({
            "courriel": email,
            "nb_fiches": len(fiches),
            "gestionnaire": "oui" if len(fiches) >= MANAGER_THRESHOLD else "non",
            "regions": " | ".join(regions),
            "municipalites": " | ".join(sorted({f["municipalite"] for f in fiches})),
            "capacite_totale": sum(f["capacite"] or 0 for f in fiches),
            "citq": " | ".join(sorted({f["citq"] for f in fiches if f["citq"]})),
            "ids_fiches": " | ".join(f["id"] for f in fiches),
            "derniere_maj": max(f["maj"] for f in fiches),
            "source": SOURCE_LABEL,
            "date_extraction": date.today().isoformat(),
            "consentement_base": "",
            "statut_contact": "",
            "desinscrit": "",
            "_rank": region_rank(regions),
        })

    rows.sort(key=lambda r: (r["gestionnaire"] != "oui", r["_rank"], -r["nb_fiches"], r["courriel"]))
    path = PRIVATE_DIR / "prospects.csv"
    fields = [k for k in rows[0] if not k.startswith("_")]
    with path.open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)
    managers = [r for r in rows if r["gestionnaire"] == "oui"]
    return {
        "contacts": len(rows),
        "gestionnaires": len(managers),
        "fiches_gestionnaires": sum(r["nb_fiches"] for r in managers),
        "courriels_invalides": invalid,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    args = ap.parse_args()

    if not args.source.exists():
        print(f"Fichier source introuvable : {args.source}", file=sys.stderr)
        return 1
    raw = json.loads(args.source.read_text(encoding="utf-8"))["value"]

    public, masked = [], []
    for rec in raw:
        pub, reason = to_public(rec)
        public.append(pub)
        if reason:
            masked.append((pub["id"], rec.get("SyndicObjectName", ""), pub["nom"], reason))

    sizes = write_public(public)
    stats = write_prospects(raw, {p["id"]: p for p in public})

    PRIVATE_DIR.mkdir(parents=True, exist_ok=True)
    with (PRIVATE_DIR / "noms_masques.csv").open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["id", "nom_original", "nom_publie", "raison"])
        w.writerows(masked)

    total = sum(sizes.values())
    print(f"Fiches lues            : {len(raw)}")
    print(f"Noms masqués           : {len(masked)} (voir data/private/noms_masques.csv)")
    print(f"Sortie publique        : {len(sizes)} fichiers, {total / 1024 / 1024:.2f} Mo")
    print(f"  dont index.json      : {sizes['index.json'] / 1024:.0f} Ko")
    print(f"  plus gros fichier    : {max(sizes, key=sizes.get)} ({max(sizes.values()) / 1024:.0f} Ko)")
    print(f"Contacts (prospects)   : {stats['contacts']}")
    print(f"  gestionnaires (≥{MANAGER_THRESHOLD})  : {stats['gestionnaires']} ({stats['fiches_gestionnaires']} fiches)")
    print(f"  courriels invalides  : {stats['courriels_invalides']}")
    if total > MAX_PUBLIC_BYTES:
        print("ATTENTION : la sortie publique dépasse 5 Mo.", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
