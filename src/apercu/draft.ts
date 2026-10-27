// Brouillon de livret d'un hôte (aperçu non publié). Pré-rempli à partir de
// la fiche officielle SIT Québec, complété dans l'éditeur, converti en Guide
// pour l'aperçu mobile. Stocké dans le navigateur ; export / import en JSON.
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Guide, OptionDef, Text } from '../content/schema'
import { load, save } from '../storage'
import { modules } from '../content'
import { bi } from './vocab'
import type { SitRecord } from './dataset'

export type Bi = { fr: string; en: string }

export interface Draft {
  version: 1
  /** Fiche d'origine (données publiques non personnelles). */
  source: { id: string; citq: string; region: string; updated?: string } | null
  name: string
  kind: Bi
  tagline: Bi
  municipality: string
  region: string
  capacity: number | null
  location: { lat: number; lon: number }
  legalId: string
  illustration: Guide['illustration']
  booking: Guide['booking']
  checkIn: string
  checkOut: string
  directions: Bi
  winterAccess: Bi
  /** Listes : une ligne par élément, dans chaque langue. */
  bring: Bi
  doorCode: string
  arrivalSteps: Bi
  parking: Bi
  wifiSsid: string
  wifiPassword: string
  houseIntro: Bi
  amenities: Bi
  modules: string[]
  rules: Bi
  checklist: Bi
  hospital: { name: string; city: string }
  activities: Bi
  options: Record<string, { on: boolean; price: number }>
}

const empty = (): Bi => ({ fr: '', en: '' })
const lines = (s: string) =>
  s
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
const joinBi = (items: Bi[]): Bi => ({ fr: items.map((i) => i.fr).join('\n'), en: items.map((i) => i.en).join('\n') })

// --- Catalogue d'options proposées à l'hôte ------------------------------
export const OPTION_CATALOG: (OptionDef & { defaultPrice: number })[] = [
  { id: 'firewood', icon: 'axe', title: { fr: 'Bois de chauffage supplémentaire', en: 'Extra firewood' }, description: { fr: 'Livré sur la galerie.', en: 'Delivered to the porch.' }, price: 0, defaultPrice: 35, unit: { fr: 'livraison', en: 'delivery' }, leadTime: { fr: 'Le jour même', en: 'Same day' }, highlight: 'cold' },
  { id: 'early-checkin', icon: 'clock', title: { fr: 'Arrivée anticipée', en: 'Early check-in' }, description: { fr: 'Selon les disponibilités.', en: 'Subject to availability.' }, price: 0, defaultPrice: 40, unit: { fr: 'séjour', en: 'stay' }, leadTime: { fr: '48 h à l’avance', en: '48 h in advance' }, highlight: 'before' },
  { id: 'late-checkout', icon: 'clock', title: { fr: 'Départ tardif', en: 'Late check-out' }, description: { fr: 'Selon les disponibilités.', en: 'Subject to availability.' }, price: 0, defaultPrice: 40, unit: { fr: 'séjour', en: 'stay' }, leadTime: { fr: 'La veille du départ', en: 'The day before departure' }, highlight: 'lastDay' },
  { id: 'grocery', icon: 'shopping-basket', title: { fr: 'Panier du terroir à l’arrivée', en: 'Local food basket on arrival' }, description: { fr: 'Produits locaux dans le frigo à votre arrivée.', en: 'Local products in the fridge when you arrive.' }, price: 0, defaultPrice: 85, unit: { fr: 'panier', en: 'basket' }, leadTime: { fr: '72 h à l’avance', en: '72 h in advance' }, highlight: 'before' },
  { id: 'cleaning', icon: 'sparkles', title: { fr: 'Ménage en cours de séjour', en: 'Mid-stay cleaning' }, description: { fr: 'Ménage complet et linge propre.', en: 'Full cleaning and fresh linen.' }, price: 0, defaultPrice: 90, unit: { fr: 'passage', en: 'visit' }, leadTime: { fr: '48 h à l’avance', en: '48 h in advance' } },
  { id: 'pet', icon: 'paw', title: { fr: 'Séjour avec un animal', en: 'Stay with a pet' }, description: { fr: 'Gamelles et couverture fournies.', en: 'Bowls and blanket provided.' }, price: 0, defaultPrice: 40, unit: { fr: 'séjour', en: 'stay' }, leadTime: { fr: 'À la réservation', en: 'When booking' }, highlight: 'before' },
]

/** Modules proposés pour un chalet au Québec (le jeu SIT ne couvre que le Québec). */
export const QC_MODULES = Object.values(modules)
  .filter((m) => m.countries.includes('qc'))
  .map((m) => m.id)

// --- Pré-remplissage depuis une fiche SIT ----------------------------------
const SMALL = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'et', 'à', 'au', 'aux', 'en', 'sur', 'sous'])

/** « MAISON DES BOULEAUX » → « Maison des Bouleaux ». */
export function titleCase(name: string): string {
  if (name !== name.toUpperCase()) return name
  return name
    .toLowerCase()
    .split(/(\s+|-)/)
    .map((w, i) => {
      if (/^\s+$|^-$/.test(w) || (i > 0 && SMALL.has(w))) return w
      const m = /^([dl]’|[dl]')(.*)$/.exec(w)
      if (m) return m[1] + m[2].charAt(0).toUpperCase() + m[2].slice(1)
      return w.charAt(0).toUpperCase() + w.slice(1)
    })
    .join('')
}

function kindFrom(r: SitRecord): Bi {
  const apt = r.typesUnites.length > 0 && r.typesUnites.every((t) => t === 'Appartement')
  const base = apt ? { fr: 'Appartement', en: 'Apartment' } : { fr: 'Chalet', en: 'Cottage' }
  const env = r.environnement
  if (env.includes("Au bord d'une rivière, d'un lac ou du fleuve")) return { fr: `${base.fr} au bord de l’eau`, en: `Waterfront ${base.en.toLowerCase()}` }
  if (env.includes('En forêt')) return { fr: `${base.fr} en forêt`, en: `${base.en} in the forest` }
  if (env.includes('Au centre-ville')) return { fr: `${base.fr} au centre-ville`, en: `Downtown ${base.en.toLowerCase()}` }
  if (env.includes('À la ferme')) return { fr: `${base.fr} à la ferme`, en: `${base.en} on a farm` }
  if (env.includes('À la campagne')) return { fr: `${base.fr} à la campagne`, en: `${base.en} in the countryside` }
  return base
}

function illustrationFrom(r: SitRecord): Guide['illustration'] {
  const env = r.environnement
  if (env.includes("Au bord d'une rivière, d'un lac ou du fleuve")) return 'river'
  if (env.includes('En forêt')) return 'winter'
  return 'maple'
}

const POOLS = new Set(['Piscine extérieure', 'Piscine intérieure', "Glissade d'eau"])

export function fromRecord(r: SitRecord): Draft {
  const parkingLabels = r.transport.filter((t) => t.startsWith('Stationnement'))
  const amenities: Bi[] = []
  for (const p of r.activitesNautiques.filter((a) => POOLS.has(a))) amenities.push(bi(p))
  for (const t of r.transport.filter((t) => t.startsWith('Borne'))) amenities.push(bi(t))
  for (const s of r.services.filter((s) => ['Literie incluse', "Rampe de mise à l'eau", 'Centre de détente', 'Panorama / belvédère'].includes(s))) amenities.push(bi(s))
  if (r.location.length) {
    const items = r.location.map(bi)
    amenities.push({ fr: `Location sur place : ${items.map((i) => i.fr.toLowerCase()).join(', ')}`, en: `On-site rental: ${items.map((i) => i.en.toLowerCase()).join(', ')}` })
  }

  const rules: Bi[] = []
  if (r.capacite) rules.push({ fr: `${r.capacite} personnes maximum.`, en: `${r.capacite} guests maximum.` })
  if (r.animaux.includes('Animaux de compagnie admis gratuitement')) rules.push({ fr: 'Animaux admis gratuitement.', en: 'Pets allowed free of charge.' })
  else if (r.animaux.includes('Animaux de compagnie admis payant')) rules.push({ fr: 'Animaux admis, avec frais.', en: 'Pets allowed, for a fee.' })
  else rules.push({ fr: 'Animaux non admis.', en: 'No pets.' })

  const activities = [...r.activitesTerrestres, ...r.activitesNautiques.filter((a) => !POOLS.has(a))].map(bi)
  const env = r.environnement
  const annual = r.periodes.some((p) => p.type === 'Annuelle')
  // Modules suggérés d'après la fiche ; l'hôte confirme dans l'éditeur.
  const suggested = ['municipal-rules']
  if (env.some((e) => e === 'En forêt' || e === 'À la campagne' || e.startsWith('Au bord'))) suggested.push('wildlife')
  if (annual && !env.includes('Au centre-ville')) suggested.push('snow-access')

  return {
    version: 1,
    source: { id: r.id, citq: r.citq, region: r.region, updated: r.maj },
    name: titleCase(r.nom),
    kind: kindFrom(r),
    tagline: empty(),
    municipality: r.municipalite,
    region: r.region,
    capacity: r.capacite ?? null,
    location: { lat: r.lat, lon: r.lon },
    legalId: r.citq,
    illustration: illustrationFrom(r),
    booking: 'airbnb',
    checkIn: '16:00',
    checkOut: '11:00',
    directions: empty(),
    winterAccess: empty(),
    bring: empty(),
    doorCode: '',
    arrivalSteps: empty(),
    parking: parkingLabels.length ? { fr: parkingLabels.join(', ') + '.', en: parkingLabels.map((p) => bi(p).en).join(', ') + '.' } : empty(),
    wifiSsid: '',
    wifiPassword: '',
    houseIntro: empty(),
    amenities: joinBi(amenities),
    modules: suggested,
    rules: joinBi(rules),
    checklist: empty(),
    hospital: { name: '', city: '' },
    activities: joinBi(activities),
    options: Object.fromEntries(OPTION_CATALOG.map((o) => [o.id, { on: false, price: o.defaultPrice }])),
  }
}

// --- Modèles insérables ----------------------------------------------------
export const TEMPLATES: Record<'checklist' | 'rules' | 'arrivalSteps', Bi> = {
  checklist: joinBi([
    { fr: 'Vaisselle lavée et rangée.', en: 'Dishes washed and put away.' },
    { fr: 'Ordures et recyclage dans les bacs.', en: 'Garbage and recycling in the bins.' },
    { fr: 'Thermostat baissé, fenêtres fermées.', en: 'Thermostat turned down, windows closed.' },
    { fr: 'Lumières éteintes, porte verrouillée.', en: 'Lights off, door locked.' },
  ]),
  rules: joinBi([
    { fr: 'Silence de 22 h à 8 h.', en: 'Quiet hours from 10 pm to 8 am.' },
    { fr: 'Non-fumeur, à l’intérieur comme à l’extérieur.', en: 'No smoking, inside or outside.' },
    { fr: 'Pas de fêtes ni d’événements.', en: 'No parties or events.' },
  ]),
  arrivalSteps: joinBi([
    { fr: 'Stationnez-vous dans l’entrée.', en: 'Park in the driveway.' },
    { fr: 'Le boîtier à code est à côté de la porte principale.', en: 'The keypad is next to the front door.' },
    { fr: 'Entrez le code, puis tournez la poignée.', en: 'Enter the code, then turn the handle.' },
  ]),
}

// --- Conversion en Guide (aperçu) -------------------------------------------
const PLACEHOLDER = '—'
/** Texte bilingue : l'anglais manquant reprend le français dans l'aperçu. */
const T = (b: Bi, fallback = PLACEHOLDER): Text => ({ fr: b.fr.trim() || fallback, en: b.en.trim() || b.fr.trim() || fallback })
function list(b: Bi): Text[] {
  const fr = lines(b.fr)
  const en = lines(b.en)
  return fr.map((f, i) => ({ fr: f, en: en[i] || f }))
}

export function draftToGuide(d: Draft): Guide {
  const winter = d.winterAccess.fr.trim() ? T(d.winterAccess) : undefined
  return {
    slug: 'apercu',
    country: 'qc',
    name: d.name.trim() || PLACEHOLDER,
    kind: T(d.kind),
    ...(d.tagline.fr.trim() ? { tagline: T(d.tagline) } : {}),
    region: { fr: d.region, en: d.region },
    municipality: d.municipality,
    location: d.location,
    illustration: d.illustration,
    legalId: d.legalId || undefined,
    hostLabel: { fr: 'Aperçu non publié', en: 'Unpublished preview' },
    booking: d.booking,
    capacity: d.capacity ?? 0,
    stay: { checkIn: d.checkIn, checkOut: d.checkOut },
    before: { directions: T(d.directions), ...(winter ? { winterAccess: winter } : {}), bring: list(d.bring) },
    arrival: { doorCode: d.doorCode.trim() || PLACEHOLDER, steps: list(d.arrivalSteps), parking: T(d.parking) },
    wifi: { ssid: d.wifiSsid.trim() || PLACEHOLDER, password: d.wifiPassword.trim() || PLACEHOLDER },
    house: {
      ...(d.houseIntro.fr.trim() ? { intro: T(d.houseIntro) } : {}),
      amenities: list(d.amenities).map((label) => ({ icon: 'check', label })),
      modules: d.modules.filter((id) => modules[id]).map((id) => ({ id })),
    },
    rules: list(d.rules).map((text) => ({ icon: 'check', text })),
    departure: { checklist: list(d.checklist) },
    emergency: { ...(d.hospital.name.trim() ? { hospital: { name: d.hospital.name.trim(), city: d.hospital.city.trim() } } : {}), notes: [] },
    around: [],
    activities: list(d.activities),
    options: OPTION_CATALOG.filter((o) => d.options[o.id]?.on).map(({ defaultPrice: _unused, ...o }) => ({ ...o, price: d.options[o.id].price })),
    faq: [],
  }
}

// --- Complétude ---------------------------------------------------------------
export type Section = 'identity' | 'arrival' | 'wifi' | 'house' | 'rules' | 'departure' | 'emergency' | 'options' | 'translation'

export interface Check {
  id: string
  section: Section
  done: boolean
}

/** Champs bilingues à traduire, pour le contrôle « traduction anglaise ». */
const BI_FIELDS: (keyof Draft)[] = ['kind', 'tagline', 'directions', 'winterAccess', 'bring', 'arrivalSteps', 'parking', 'houseIntro', 'amenities', 'rules', 'checklist', 'activities']

export function untranslated(d: Draft): (keyof Draft)[] {
  return BI_FIELDS.filter((k) => {
    const b = d[k] as Bi
    return b.fr.trim() !== '' && lines(b.en).length < lines(b.fr).length
  })
}

export function checks(d: Draft): Check[] {
  const has = (b: Bi) => b.fr.trim() !== ''
  const n = (b: Bi) => lines(b.fr).length
  return [
    { id: 'name', section: 'identity', done: d.name.trim() !== '' },
    { id: 'tagline', section: 'identity', done: has(d.tagline) },
    { id: 'directions', section: 'arrival', done: has(d.directions) },
    { id: 'doorCode', section: 'arrival', done: d.doorCode.trim() !== '' },
    { id: 'arrivalSteps', section: 'arrival', done: n(d.arrivalSteps) >= 2 },
    { id: 'parking', section: 'arrival', done: has(d.parking) },
    { id: 'wifi', section: 'wifi', done: d.wifiSsid.trim() !== '' && d.wifiPassword.trim() !== '' },
    { id: 'houseIntro', section: 'house', done: has(d.houseIntro) },
    { id: 'amenities', section: 'house', done: n(d.amenities) >= 3 },
    { id: 'modules', section: 'house', done: d.modules.length > 0 },
    { id: 'rules', section: 'rules', done: n(d.rules) >= 3 },
    { id: 'checklist', section: 'departure', done: n(d.checklist) >= 3 },
    { id: 'hospital', section: 'emergency', done: d.hospital.name.trim() !== '' },
    { id: 'options', section: 'options', done: Object.values(d.options).some((o) => o.on) },
    { id: 'translation', section: 'translation', done: untranslated(d).length === 0 },
  ]
}

export function completion(d: Draft): number {
  const c = checks(d)
  return Math.round((c.filter((x) => x.done).length / c.length) * 100)
}

// --- Stockage, export, import --------------------------------------------------
export const DRAFT_KEY = 'cg.apercu.draft'

export function exportJson(d: Draft): string {
  return JSON.stringify({ format: 'chalet-guide/apercu', ...d }, null, 2)
}

/** Import d'un fichier exporté : vérifie la forme minimale, complète les champs absents. */
export function importJson(text: string): Draft {
  const data = JSON.parse(text) as Partial<Draft> & { format?: string }
  if (data.format !== 'chalet-guide/apercu' || data.version !== 1) throw new Error('format')
  if (!data.location || typeof data.location.lat !== 'number' || typeof data.location.lon !== 'number') throw new Error('location')
  const base: Draft = { ...fromBlank(data.location), ...data } as Draft
  delete (base as Partial<Draft> & { format?: string }).format
  for (const k of BI_FIELDS) {
    const v = base[k] as Bi
    if (!v || typeof v.fr !== 'string' || typeof v.en !== 'string') (base[k] as Bi) = empty()
  }
  return base
}

function fromBlank(location: { lat: number; lon: number }): Draft {
  return {
    version: 1, source: null, name: '', kind: empty(), tagline: empty(), municipality: '', region: '', capacity: null, location, legalId: '',
    illustration: 'winter', booking: 'airbnb', checkIn: '16:00', checkOut: '11:00', directions: empty(), winterAccess: empty(), bring: empty(),
    doorCode: '', arrivalSteps: empty(), parking: empty(), wifiSsid: '', wifiPassword: '', houseIntro: empty(), amenities: empty(), modules: [],
    rules: empty(), checklist: empty(), hospital: { name: '', city: '' }, activities: empty(),
    options: Object.fromEntries(OPTION_CATALOG.map((o) => [o.id, { on: false, price: o.defaultPrice }])),
  }
}

// --- Hook : brouillon partagé entre l'éditeur et l'aperçu (iframe) ---------------

export function useDraft(): [Draft | null, (d: Draft | null) => void] {
  const [draft, setDraft] = useState<Draft | null>(() => load<Draft | null>(DRAFT_KEY, null))
  const timer = useRef<number>(undefined)
  useEffect(() => {
    // L'aperçu dans l'iframe reçoit les modifications par l'événement « storage ».
    const onStorage = (e: StorageEvent) => {
      if (e.key === DRAFT_KEY) setDraft(load<Draft | null>(DRAFT_KEY, null))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])
  const update = useCallback((d: Draft | null) => {
    setDraft(d)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      if (d) save(DRAFT_KEY, d)
      else {
        try {
          localStorage.removeItem(DRAFT_KEY)
        } catch {
          /* stockage indisponible */
        }
      }
    }, 250)
  }, [])
  return [draft, update]
}
