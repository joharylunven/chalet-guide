// Statistiques du tableau de bord.
import { describe, expect, it } from 'vitest'
import type { StoredEvent } from '../src/analytics/track'
import { compute, monthReport, sampleEvents } from '../src/dashboard/stats'

const now = new Date('2026-10-26T15:00:00')
const at = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86400000).toISOString()

const events: StoredEvent[] = [
  { type: 'open', guide: 'a', at: at(0) },
  { type: 'open', guide: 'a', at: at(0) },
  { type: 'open', guide: 'b', at: at(3) },
  { type: 'open', guide: 'a', at: at(40) },
  { type: 'section', guide: 'a', section: 'wifi', at: at(0) },
  { type: 'section', guide: 'a', section: 'wifi', at: at(1) },
  { type: 'section', guide: 'b', section: 'arrival', at: at(3) },
  { type: 'question', guide: 'a', question: 'Wifi ?', answered: true, at: at(0) },
  { type: 'question', guide: 'a', question: 'wifi ?', answered: true, at: at(2) },
  { type: 'question', guide: 'b', question: 'trottinette', answered: false, at: at(3) },
  { type: 'option', guide: 'a', option: 'firewood', mode: 'airbnb', at: at(1) },
  { type: 'option', guide: 'b', option: 'firewood', mode: 'direct', at: at(2) },
  { type: 'copy', guide: 'a', what: 'wifi', at: at(0) },
]

describe('tableau de bord', () => {
  it('agrège sur la période et l’hébergement choisis', () => {
    const s = compute(events, { guide: 'all', days: 30 }, now)
    expect(s.opens).toBe(3)
    expect(s.perDay).toHaveLength(30)
    expect(s.perDay.at(-1)).toEqual({ date: '2026-10-26', n: 2 })
    expect(s.sections[0]).toEqual({ id: 'wifi', n: 2 })
    expect(s.questions).toBe(3)
    expect(s.answered).toBe(2)
    expect(s.topQuestions[0]).toEqual({ q: 'wifi ?', n: 2, answered: true })
    expect(s.options).toEqual([{ id: 'firewood', n: 2, direct: 1, airbnb: 1 }])
    expect(s.copies).toBe(1)

    const onlyB = compute(events, { guide: 'b', days: 7 }, now)
    expect(onlyB.opens).toBe(1)
    expect(onlyB.answered).toBe(0)
  })

  it('le rapport mensuel compte le mois civil en cours', () => {
    expect(monthReport(events, 'all', now)).toEqual({ answered: 2, opens: 3, options: 2 })
  })

  it('le jeu d’exemple est stable et plausible', () => {
    const g = [{ slug: 'x', booking: 'airbnb' as const }]
    const a = sampleEvents(g, now)
    expect(sampleEvents(g, now)).toEqual(a)
    const s = compute(a, { guide: 'all', days: 30 }, now)
    expect(s.opens).toBeGreaterThan(10)
    expect(s.answered).toBeLessThanOrEqual(s.questions)
    expect(a.every((e) => Date.parse(e.at) <= now.getTime())).toBe(true)
  })
})
