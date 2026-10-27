// Statistiques locales : chaque interaction de la démo est enregistrée dans
// localStorage et lue par le tableau de bord (#/tableau-de-bord).
import { load, save } from '../storage'

export type TrackEvent =
  | { type: 'open'; guide: string }
  | { type: 'section'; guide: string; section: string }
  | { type: 'question'; guide: string; question: string; answered: boolean }
  | { type: 'option'; guide: string; option: string; mode: 'direct' | 'airbnb' }
  | { type: 'copy'; guide: string; what: 'wifi' | 'code' }

export type StoredEvent = TrackEvent & { at: string }

const KEY = 'cg.events'
const MAX = 2000

export function track(event: TrackEvent): void {
  const events = load<StoredEvent[]>(KEY, [])
  events.push({ ...event, at: new Date().toISOString() })
  save(KEY, events.slice(-MAX))
}

export function readEvents(): StoredEvent[] {
  return load<StoredEvent[]>(KEY, [])
}
