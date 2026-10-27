// Statistiques de l'hôte à partir des événements enregistrés par la démo
// (src/analytics/track.ts), ou d'un jeu d'exemple clairement étiqueté.
import type { StoredEvent } from '../analytics/track'

const DAY = 86400000

export interface Filters {
  guide: string | 'all'
  days: number
}

export interface Stats {
  opens: number
  /** Ouvertures par jour, du plus ancien au plus récent. */
  perDay: { date: string; n: number }[]
  sections: { id: string; n: number }[]
  questions: number
  answered: number
  topQuestions: { q: string; n: number; answered: boolean }[]
  options: { id: string; n: number; direct: number; airbnb: number }[]
  copies: number
}

const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function compute(events: StoredEvent[], f: Filters, now = new Date()): Stats {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  start.setTime(start.getTime() - (f.days - 1) * DAY)
  const evs = events.filter((e) => Date.parse(e.at) >= start.getTime() && (f.guide === 'all' || e.guide === f.guide))

  const perDayMap = new Map<string, number>()
  for (let i = 0; i < f.days; i++) perDayMap.set(dayKey(new Date(start.getTime() + i * DAY)), 0)
  const sections = new Map<string, number>()
  const questions = new Map<string, { n: number; answered: boolean }>()
  const options = new Map<string, { n: number; direct: number; airbnb: number }>()
  let opens = 0
  let answered = 0
  let qCount = 0
  let copies = 0

  for (const e of evs) {
    switch (e.type) {
      case 'open': {
        opens++
        const k = dayKey(new Date(e.at))
        if (perDayMap.has(k)) perDayMap.set(k, perDayMap.get(k)! + 1)
        break
      }
      case 'section':
        sections.set(e.section, (sections.get(e.section) ?? 0) + 1)
        break
      case 'question': {
        qCount++
        if (e.answered) answered++
        const key = e.question.trim().toLowerCase()
        const q = questions.get(key) ?? { n: 0, answered: e.answered }
        questions.set(key, { n: q.n + 1, answered: q.answered || e.answered })
        break
      }
      case 'option': {
        const o = options.get(e.option) ?? { n: 0, direct: 0, airbnb: 0 }
        o.n++
        o[e.mode]++
        options.set(e.option, o)
        break
      }
      case 'copy':
        copies++
        break
    }
  }

  const desc = <T extends { n: number }>(a: T, b: T) => b.n - a.n
  return {
    opens,
    perDay: [...perDayMap].map(([date, n]) => ({ date, n })),
    sections: [...sections].map(([id, n]) => ({ id, n })).sort(desc),
    questions: qCount,
    answered,
    topQuestions: [...questions].map(([q, v]) => ({ q, ...v })).sort(desc).slice(0, 6),
    options: [...options].map(([id, v]) => ({ id, ...v })).sort(desc),
    copies,
  }
}

/** Questions répondues par le guide pendant le mois civil en cours. */
export function monthReport(events: StoredEvent[], guide: string | 'all', now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const evs = events.filter((e) => Date.parse(e.at) >= start && (guide === 'all' || e.guide === guide))
  const answered = evs.filter((e) => e.type === 'question' && e.answered).length
  return {
    answered,
    opens: evs.filter((e) => e.type === 'open').length,
    options: evs.filter((e) => e.type === 'option').length,
  }
}

// --- Jeu d'exemple (étiqueté « exemple » dans l'interface) --------------------
const SAMPLE_QUESTIONS: [string, boolean][] = [
  ['mot de passe wifi', true],
  ['à quelle heure est le départ ?', true],
  ['où mettre les poubelles', true],
  ['comment allumer le poêle', true],
  ['code de la porte', true],
  ['wifi password', true],
  ['peut-on faire un feu dehors', true],
  ['location de pédalo', false],
  ['hot tub cover', true],
]
const SAMPLE_SECTIONS: [string, number][] = [
  ['arrival', 10], ['wifi', 9], ['house', 6], ['departure', 6], ['around', 5], ['options', 4], ['assistant', 4], ['rules', 3], ['spa', 3], ['emergency', 1],
]
const SAMPLE_OPTIONS: [string, number][] = [['firewood', 5], ['late-checkout', 4], ['early-checkin', 2], ['grocery', 2]]

/** Pseudo-aléatoire déterministe : le jeu d'exemple est le même à chaque visite. */
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

export function sampleEvents(guides: { slug: string; booking: 'direct' | 'airbnb' }[], now = new Date()): StoredEvent[] {
  const r = rng(42)
  const out: StoredEvent[] = []
  const pick = <T,>(items: [T, number][]) => {
    const total = items.reduce((s, [, w]) => s + w, 0)
    let x = r() * total
    for (const [v, w] of items) if ((x -= w) < 0) return v
    return items[0][0]
  }
  for (let d = 59; d >= 0; d--) {
    const weekend = [0, 5, 6].includes(new Date(now.getTime() - d * DAY).getDay())
    for (const g of guides) {
      const opens = Math.floor(r() * (weekend ? 5 : 3))
      for (let i = 0; i < opens; i++) {
        const at = new Date(now.getTime() - d * DAY - Math.floor(r() * 10) * 3600000).toISOString()
        out.push({ type: 'open', guide: g.slug, at })
        const n = 1 + Math.floor(r() * 3)
        for (let j = 0; j < n; j++) out.push({ type: 'section', guide: g.slug, section: pick(SAMPLE_SECTIONS), at })
        if (r() < 0.45) {
          const [q, answered] = SAMPLE_QUESTIONS[Math.floor(r() * SAMPLE_QUESTIONS.length)]
          out.push({ type: 'question', guide: g.slug, question: q, answered, at })
        }
        if (r() < 0.12) out.push({ type: 'option', guide: g.slug, option: pick(SAMPLE_OPTIONS), mode: g.booking, at })
        if (r() < 0.3) out.push({ type: 'copy', guide: g.slug, what: 'wifi', at })
      }
    }
  }
  return out
}
