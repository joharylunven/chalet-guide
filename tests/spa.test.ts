// Suivi du spa : aucune valeur réglementaire par défaut, statuts et export.
import { describe, expect, it } from 'vitest'
import { SPA_PARAMS } from '../src/spa/config'
import { emptyLog, exampleLog, nextDue, rangeStatus, toCsv } from '../src/spa/store'
import { countries } from '../src/countries'
import fr from '../src/i18n/fr.json'
import en from '../src/i18n/en.json'

describe('suivi du spa', () => {
  it('les seuils de l’exploitant sont vides par défaut', () => {
    const log = emptyLog()
    for (const r of Object.values(log.thresholds)) expect(r).toEqual({ min: null, max: null })
    for (const task of Object.values(log.tasks)) expect(task.everyDays).toBeNull()
    expect(log.publish).toBe(false)
  })

  it('le jeu d’exemple n’impose aucun seuil et marque toutes ses entrées', () => {
    const log = exampleLog()
    for (const r of Object.values(log.thresholds)) expect(r).toEqual({ min: null, max: null })
    expect(log.entries.length).toBeGreaterThan(0)
    expect(log.entries.every((e) => e.example)).toBe(true)
    expect(Object.values(log.tasks).filter((t) => t.everyDays !== null).every((t) => t.example)).toBe(true)
  })

  it('statut par rapport aux seuils de l’exploitant', () => {
    expect(rangeStatus(7.4, { min: null, max: null })).toBeNull()
    expect(rangeStatus(7.4, { min: 7.2, max: 7.6 })).toBe('ok')
    expect(rangeStatus(8, { min: 7.2, max: 7.6 })).toBe('out')
    expect(rangeStatus(true, { min: 1, max: 2 })).toBeNull()
  })

  it('prochaine échéance d’entretien', () => {
    expect(nextDue({ everyDays: null, lastDone: '2026-10-01T00:00:00Z' })).toBeNull()
    expect(nextDue({ everyDays: 7, lastDone: '2026-10-01T00:00:00Z' })?.toISOString()).toBe('2026-10-08T00:00:00.000Z')
  })

  it('export CSV : séparateur et décimales à la française', () => {
    const log = emptyLog()
    log.entries.push({ id: 'a', at: '2026-10-26T09:30:00.000Z', values: { temp: 37.5, ph: 7.4, free: 1.5, total: 2, clarity: true }, bathers: 3, actions: 'pH ajusté; filtre', example: false })
    const lines = toCsv(log, 'fr', 'Exemple').replace('﻿', '').split('\r\n')
    expect(lines).toHaveLength(2)
    expect(lines[0].split(';')).toHaveLength(SPA_PARAMS.length + 4)
    expect(lines[1]).toBe('2026-10-26 09:30;37,5;7,4;1,5;2;oui;3;"pH ajusté; filtre";')
  })

  it('mention réglementaire présente pour chaque pays, sans trancher l’obligation', () => {
    expect(countries.fr.spaNotice.fr).toContain('D.1332-1')
    expect(countries.fr.spaNotice.fr).toContain('ARS')
    for (const c of Object.values(countries)) {
      for (const text of [c.spaNotice.fr, c.spaNotice.en]) expect(text).not.toMatch(/\b(est|n['’]est pas) soumis|\bis (not )?subject/i)
    }
  })

  it('le voyageur ne voit jamais « conforme » ni « compliant »', () => {
    const texts = JSON.stringify([fr.spa, en.spa])
    expect(texts).not.toMatch(/conforme|compliant|compliance/i)
  })
})
