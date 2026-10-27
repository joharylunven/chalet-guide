// Carnet de suivi du spa, stocké dans le navigateur (démo sans backend).
// Le même stockage est lu par l'écran exploitant et par le guide voyageur.
import { useCallback, useEffect, useState } from 'react'
import { load, save } from '../storage'
import { SPA_PARAMS, SPA_TASKS } from './config'

export type ParamValue = number | boolean | null

export interface SpaEntry {
  id: string
  /** Date et heure du contrôle (ISO). */
  at: string
  values: Record<string, ParamValue>
  bathers: number | null
  actions: string
  /** Entrée du jeu d'exemple de la démo. */
  example?: boolean
}

export interface Range {
  min: number | null
  max: number | null
}

export interface SpaLog {
  entries: SpaEntry[]
  /** Seuils fixés par l'exploitant. Vides par défaut. */
  thresholds: Record<string, Range>
  /** true si les seuils viennent des valeurs d'exemple (affiché comme tel). */
  thresholdsAreExample: boolean
  tasks: Record<string, { everyDays: number | null; lastDone: string | null; example?: boolean }>
  /** Afficher les derniers résultats aux voyageurs dans le guide. */
  publish: boolean
  supplierUrl: string
}

const DAY = 86400000

export function emptyLog(): SpaLog {
  return {
    entries: [],
    thresholds: Object.fromEntries(SPA_PARAMS.filter((p) => p.kind === 'number').map((p) => [p.id, { min: null, max: null }])),
    thresholdsAreExample: false,
    tasks: Object.fromEntries(SPA_TASKS.map((t) => [t.id, { everyDays: null, lastDone: null }])),
    publish: false,
    supplierUrl: '',
  }
}

/** Jeu d'exemple de la démo : dix jours de contrôles, tous marqués « exemple ». */
export function exampleLog(now = Date.now()): SpaLog {
  const log = emptyLog()
  const jitter = (i: number, a: number) => Math.round((Math.sin(i * 1.7) * a) * 10) / 10
  for (let i = 9; i >= 0; i--) {
    const at = new Date(now - i * DAY)
    at.setHours(9, 30 + (i % 3) * 10, 0, 0)
    log.entries.push({
      id: `ex-${i}`,
      at: at.toISOString(),
      values: {
        temp: 37.5 + jitter(i, 0.6),
        ph: Math.round((7.4 + jitter(i + 2, 0.25)) * 10) / 10,
        free: Math.round((1.8 + jitter(i + 5, 0.7)) * 10) / 10,
        total: Math.round((2.3 + jitter(i + 5, 0.7)) * 10) / 10,
        clarity: true,
      },
      bathers: [2, 4, 3, 0, 2, 5, 2, 4, 1, 3][i],
      actions: i === 6 ? 'Ajustement du pH (exemple).' : '',
      example: true,
    })
  }
  for (const t of SPA_TASKS) {
    if (t.exampleEveryDays) {
      const ago = t.id === 'filter' ? 8 : t.id === 'cover' ? 12 : 40
      log.tasks[t.id] = { everyDays: t.exampleEveryDays, lastDone: new Date(now - ago * DAY).toISOString(), example: true }
    }
  }
  log.publish = true
  return log
}

const key = (slug: string) => `cg.spa.${slug}`

export function readSpaLog(slug: string): SpaLog {
  const stored = load<SpaLog | null>(key(slug), null)
  if (stored) return { ...emptyLog(), ...stored }
  const seeded = exampleLog()
  save(key(slug), seeded)
  return seeded
}

/** Carnet d'un spa, synchronisé entre les onglets ouverts. */
export function useSpaLog(slug: string): [SpaLog, (update: (l: SpaLog) => SpaLog) => void] {
  const [log, setLog] = useState(() => readSpaLog(slug))
  useEffect(() => {
    setLog(readSpaLog(slug))
    const onStorage = (e: StorageEvent) => {
      if (e.key === key(slug)) setLog(readSpaLog(slug))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [slug])
  const update = useCallback(
    (fn: (l: SpaLog) => SpaLog) =>
      setLog((prev) => {
        const next = fn(prev)
        save(key(slug), next)
        return next
      }),
    [slug],
  )
  return [log, update]
}

export function latest(log: SpaLog): SpaEntry | undefined {
  return [...log.entries].sort((a, b) => b.at.localeCompare(a.at))[0]
}

/** Statut d'une valeur par rapport aux seuils de l'exploitant (null : pas de seuil). */
export function rangeStatus(value: ParamValue, range: Range | undefined): 'ok' | 'out' | null {
  if (typeof value !== 'number' || !range || (range.min === null && range.max === null)) return null
  if (range.min !== null && value < range.min) return 'out'
  if (range.max !== null && value > range.max) return 'out'
  return 'ok'
}

export function nextDue(task: SpaLog['tasks'][string]): Date | null {
  if (!task.everyDays || !task.lastDone) return null
  return new Date(Date.parse(task.lastDone) + task.everyDays * DAY)
}

/** Carnet au format CSV (séparateur « ; » pour Excel en français). */
export function toCsv(log: SpaLog, lang: 'fr' | 'en', exampleLabel: string): string {
  const sep = lang === 'fr' ? ';' : ','
  const head = ['date', ...SPA_PARAMS.map((p) => (p.unit ? `${p.label[lang]} (${p.unit})` : p.label[lang])), lang === 'fr' ? 'baigneurs' : 'bathers', lang === 'fr' ? 'actions correctives' : 'corrective actions', exampleLabel]
  const cell = (v: unknown) => {
    const s = v === null || v === undefined ? '' : typeof v === 'boolean' ? (v ? (lang === 'fr' ? 'oui' : 'yes') : lang === 'fr' ? 'non' : 'no') : String(v)
    const local = lang === 'fr' && typeof v === 'number' ? s.replace('.', ',') : s
    return local.includes(sep) || /["\r\n]/.test(local) ? `"${local.replace(/"/g, '""')}"` : local
  }
  const rows = [...log.entries]
    .sort((a, b) => a.at.localeCompare(b.at))
    .map((e) => [e.at.slice(0, 16).replace('T', ' '), ...SPA_PARAMS.map((p) => e.values[p.id]), e.bathers, e.actions, e.example ? exampleLabel : ''].map(cell).join(sep))
  return '﻿' + [head.map(cell).join(sep), ...rows].join('\r\n')
}
