// Accès au jeu assaini public/data/etablissements/ (produit par
// scripts/prepare_data.py) : index de recherche, puis fiche détaillée.
// Source : Ministère du Tourisme du Québec, SIT Québec, Données Québec, CC-BY 4.0.

export interface IndexData {
  source: string
  sourceUrl: string
  genere: string
  champsListes: string[]
  vocabulaire: string[]
  regions: { nom: string; slug: string; fiches: number }[]
  /** [id, nom, municipalité, CITQ, indice de région] */
  fiches: [string, string, string, string, number][]
}

export interface SitRecord {
  id: string
  nom: string
  municipalite: string
  citq: string
  region: string
  cp?: string
  lat: number
  lon: number
  capacite?: number
  unites?: number
  typesUnites: string[]
  environnement: string[]
  activitesTerrestres: string[]
  activitesNautiques: string[]
  animaux: string[]
  transport: string[]
  services: string[]
  location: string[]
  periodes: { type?: string; debut?: string; fin?: string }[]
  maj?: string
}

export interface SearchHit {
  id: string
  nom: string
  municipalite: string
  citq: string
  region: string
}

const dataUrl = (file: string) => `${import.meta.env.BASE_URL}data/etablissements/${file}`

let indexPromise: Promise<IndexData> | null = null
const regionCache = new Map<string, Promise<{ fiches: Record<string, unknown>[] }>>()

export function loadIndex(): Promise<IndexData> {
  indexPromise ??= fetch(dataUrl('index.json')).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json() as Promise<IndexData>
  })
  indexPromise.catch(() => (indexPromise = null))
  return indexPromise
}

export const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[’']/g, ' ')

/** Recherche par nom, municipalité ou n° CITQ. Tous les mots doivent correspondre. */
export function search(index: IndexData, query: string, limit = 20): SearchHit[] {
  const terms = fold(query).split(/[^a-z0-9]+/).filter(Boolean)
  if (!terms.length) return []
  const scored: { row: IndexData['fiches'][number]; score: number }[] = []
  for (const row of index.fiches) {
    const [, nom, muni, citq] = row
    const n = fold(nom)
    const m = fold(muni)
    const hay = `${n} ${m} ${citq}`
    if (!terms.every((t) => hay.includes(t))) continue
    let score = 0
    for (const t of terms) {
      if (citq === t) score += 10
      if (n.startsWith(t)) score += 3
      else if (new RegExp(`\\b${t}`).test(n)) score += 2
      if (m === t || m.startsWith(t)) score += 2
    }
    scored.push({ row, score })
  }
  return scored
    .sort((a, b) => b.score - a.score || a.row[1].localeCompare(b.row[1], 'fr'))
    .slice(0, limit)
    .map(({ row: [id, nom, municipalite, citq, ri] }) => ({ id, nom, municipalite, citq, region: index.regions[ri]?.nom ?? '' }))
}

export async function loadRecord(index: IndexData, id: string): Promise<SitRecord | null> {
  const row = index.fiches.find((f) => f[0] === id)
  if (!row) return null
  const region = index.regions[row[4]]
  let p = regionCache.get(region.slug)
  if (!p) {
    p = fetch(dataUrl(`${region.slug}.json`)).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return r.json()
    })
    regionCache.set(region.slug, p)
    p.catch(() => regionCache.delete(region.slug))
  }
  const data = await p
  const raw = data.fiches.find((f) => f.id === id)
  if (!raw) return null
  const decode = (k: string) => ((raw[k] as number[] | undefined) ?? []).map((i) => index.vocabulaire[i])
  return {
    id,
    nom: row[1],
    municipalite: row[2],
    citq: row[3],
    region: region.nom,
    cp: raw.cp as string | undefined,
    lat: raw.lat as number,
    lon: raw.lon as number,
    capacite: raw.capacite as number | undefined,
    unites: raw.unites as number | undefined,
    typesUnites: decode('typesUnites'),
    environnement: decode('environnement'),
    activitesTerrestres: decode('activitesTerrestres'),
    activitesNautiques: decode('activitesNautiques'),
    animaux: decode('animaux'),
    transport: decode('transport'),
    services: decode('services'),
    location: decode('location'),
    periodes: (raw.periodes as SitRecord['periodes']) ?? [],
    maj: raw.maj as string | undefined,
  }
}
