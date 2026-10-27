// Assistant de démo : recherche plein texte dans le contenu du guide, côté
// client, tolérante aux accents et aux fautes de frappe. Aucune IA.
import MiniSearch, { type SearchResult } from 'minisearch'
import type { Lang } from '../config'
import { modules } from '../content'
import type { Guide, SectionId, Text } from '../content/schema'
import fr from '../i18n/fr.json'
import en from '../i18n/en.json'
import type { AnswerProvider } from './provider'

interface Doc {
  id: string
  title: string
  text: string
  keywords: string
  section: SectionId
  anchor?: string
}

const STOP = new Set(
  [
    'le la les un une des du de d l a au aux et ou est ce que qui quoi quel quelle quels quelles on nous vous je j il elle y en dans sur pour par pas ne plus mon ma mes notre nos votre vos',
    'peut peux pouvons faire fait mettre mets met trouver trouve avoir ai sont il-y-a besoin comment combien quand',
    'the a an is are of to in on for do does can we i you it where what how when which there my our your put find get have need much many',
  ]
    .join(' ')
    .split(' '),
)
const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

/** Normalisation d'un terme : sans accents, singulier approximatif (« poubelles » → « poubelle »). */
function normalize(term: string): string | null {
  const t = fold(term)
  if (STOP.has(t) || t.length < 2) return null
  return t.length > 3 && t.endsWith('s') && !t.endsWith('ss') ? t.slice(0, -1) : t
}

const ui = { fr, en }

function sectionTitle(id: SectionId, lang: Lang, country: Guide['country']): string {
  const s = ui[lang].sections
  return id === 'house' && country === 'fr' ? s.houseFr : s[id]
}

function buildDocs(g: Guide, lang: Lang): Doc[] {
  const L = (t?: Text) => (t ? t[lang] : '')
  const docs: Doc[] = []
  const add = (d: Omit<Doc, 'id' | 'keywords'> & { keywords?: string }) => docs.push({ keywords: '', ...d, id: String(docs.length) })
  const st = (id: SectionId) => sectionTitle(id, lang, g.country)
  const labels = ui[lang]
  const c = labels.common.colon

  add({ section: 'arrival', title: labels.arrival.directions, text: L(g.before.directions), keywords: 'route itineraire trajet directions drive gps adresse address' })
  if (g.before.winterAccess) add({ section: 'arrival', title: labels.arrival.winter, text: L(g.before.winterAccess), keywords: 'neige hiver pneus snow winter tires' })
  add({ section: 'arrival', title: labels.arrival.bring, text: g.before.bring.map(L).join(' '), keywords: 'apporter amener bring pack valise' })
  add({ section: 'arrival', title: `${labels.boarding.doorCode} — ${labels.arrival.steps}`, text: `${labels.boarding.doorCode}${c} ${g.arrival.doorCode}. ${g.arrival.steps.map(L).join(' ')}`, keywords: 'code porte cle entrer serrure arrivee checkin check-in heure door key lock enter arrive time' })
  add({ section: 'arrival', title: labels.arrival.parking, text: L(g.arrival.parking), keywords: 'stationnement stationner garer parking voiture auto car park' })
  add({ section: 'wifi', title: st('wifi'), text: `${labels.wifi.network}${c} ${g.wifi.ssid}. ${labels.wifi.password}${c} ${g.wifi.password}. ${L(g.wifi.note)}`, keywords: 'wifi wi-fi internet reseau mot de passe password network connexion' })
  add({ section: 'house', title: st('house'), text: `${L(g.house.intro)} ${g.house.amenities.map((a) => L(a.label)).join('. ')}`, keywords: 'equipements amenities chambre lit bed cuisine kitchen' })
  for (const ref of g.house.modules) {
    const m = modules[ref.id]
    if (!m) continue
    const kw = m.keywords.join(' ')
    add({ section: 'house', anchor: m.id, title: L(m.title), text: [L(m.intro), L(ref.note)].filter(Boolean).join(' '), keywords: kw })
    // Les mots-clés du module vont sur sa fiche d'intro ; les blocs sont trouvés par leur texte.
    for (const b of m.blocks) add({ section: 'house', anchor: m.id, title: `${L(m.title)} — ${L(b.title)}`, text: b.items.map(L).join(' ') })
  }
  add({ section: 'rules', title: st('rules'), text: g.rules.map((r) => L(r.text)).join(' '), keywords: 'regles interdit permis animaux fumer bruit fete rules allowed pets smoking noise party' })
  add({ section: 'departure', title: st('departure'), text: `${labels.departure.checkOut.replace('{time}', g.stay.checkOut)}. ${g.departure.checklist.map(L).join(' ')} ${L(g.departure.note)}`, keywords: 'depart partir quitter checkout check-out heure menage draps leave departure time cleaning sheets' })
  add({ section: 'emergency', title: st('emergency'), text: `${g.emergency.hospital ? `${g.emergency.hospital.name}, ${g.emergency.hospital.city}. ` : ''}${g.emergency.notes.map(L).join(' ')}`, keywords: 'urgence hopital medecin malade blesse police pompiers ambulance emergency hospital doctor sick injured fire extincteur extinguisher' })
  for (const r of g.around) add({ section: 'around', title: r.name, text: L(r.text), keywords: `${labels.around.categories[r.category]} restaurant epicerie activite faire visiter things to do visit` })
  for (const o of g.options) add({ section: 'options', title: L(o.title), text: L(o.description), keywords: 'option acheter commander reserver extra buy order book' })
  for (const f of g.faq) add({ section: f.section as SectionId, title: L(f.q), text: L(f.a), keywords: L(f.q) })
  return docs
}

const cache = new Map<string, MiniSearch<Doc>>()

function index(g: Guide, lang: Lang): { ms: MiniSearch<Doc>; docs: Doc[] } {
  const docs = buildDocs(g, lang)
  const key = `${g.slug}:${lang}`
  let ms = cache.get(key)
  if (!ms) {
    ms = new MiniSearch<Doc>({
      fields: ['title', 'text', 'keywords'],
      storeFields: ['title', 'text', 'section', 'anchor'],
      processTerm: normalize,
      searchOptions: { boost: { keywords: 2, title: 2, text: 1.5 }, fuzzy: 0.2, prefix: true, combineWith: 'OR' },
    })
    ms.addAll(docs)
    cache.set(key, ms)
  }
  return { ms, docs }
}

/** Phrases du document les plus proches de la question, pour une réponse courte. */
function bestSnippet(text: string, terms: string[]): string {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean)
  if (sentences.length <= 3 || text.length <= 260) return text
  const score = (s: string) => terms.reduce((n, t) => n + (fold(s).includes(t) ? 1 : 0), 0)
  const ranked = sentences.map((s, i) => ({ s, i, n: score(s) })).sort((a, b) => b.n - a.n || a.i - b.i)
  if (ranked[0].n === 0) return sentences.slice(0, 2).join(' ')
  return ranked
    .slice(0, 2)
    .filter((k) => k.n > 0)
    .sort((a, b) => a.i - b.i)
    .map((k) => k.s)
    .join(' ')
}

/** Termes significatifs de la question (mêmes règles que l'index). */
function queryTerms(question: string): string[] {
  return Array.from(new Set(question.split(/[^\p{L}\p{N}]+/u).map(normalize).filter((t): t is string => !!t)))
}

export const searchProvider: AnswerProvider = {
  async ask(question, guide, lang) {
    const { ms } = index(guide, lang)
    const wanted = queryTerms(question)
    if (!wanted.length) return []
    // Exige que la réponse couvre au moins deux termes de la question (ou le
    // seul terme posé) : évite de répondre à côté sur un mot générique.
    const need = Math.min(2, wanted.length)
    // Priorité aux documents qui couvrent le plus de termes de la question
    // dans leur texte (les mots-clés servent à départager).
    // r.match est indexé par terme du document : une variante approchée (« côté » pour « code »)
    // compte en plus, d'où le plafond au nombre de termes de la question.
    const inText = (r: SearchResult) =>
      Math.min(r.queryTerms.length, Object.values(r.match).filter((fields) => fields.some((f) => f !== 'keywords')).length)
    const results = ms
      .search(question)
      .filter((r) => r.queryTerms.length >= need)
      .sort((a, b) => inText(b) - inText(a) || b.queryTerms.length - a.queryTerms.length || b.score - a.score)
    if (!results.length) return []
    const top = results[0]
    return results
      .filter((r) => inText(r) === inText(top) && r.queryTerms.length === top.queryTerms.length && r.score >= top.score * 0.6)
      .slice(0, 2)
      .map((r) => ({
        title: r.title as string,
        text: bestSnippet(r.text as string, r.terms),
        section: r.section as SectionId,
        anchor: r.anchor as string | undefined,
      }))
  },
}
