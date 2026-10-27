// Cache des données en direct : dernière valeur + horodatage, pour un
// affichage correct hors ligne ou si une source ne répond pas.
import { load, save } from '../storage'

export interface Cached<T> {
  data: T
  fetchedAt: string
}

export type LiveState<T> =
  | { status: 'loading' }
  | { status: 'ok'; data: T; fetchedAt: string; stale: boolean }
  | { status: 'error' }

/**
 * Renvoie la valeur fraîche si elle a moins de `maxAgeMin`, sinon refait
 * l'appel ; en cas d'échec, renvoie la dernière valeur connue marquée « stale ».
 */
export async function cachedFetch<T>(key: string, maxAgeMin: number, fetcher: () => Promise<T>): Promise<LiveState<T>> {
  const cached = load<Cached<T> | null>(`cg.live.${key}`, null)
  const age = cached ? (Date.now() - Date.parse(cached.fetchedAt)) / 60000 : Infinity
  if (cached && age < maxAgeMin) return { status: 'ok', ...cached, stale: false }
  try {
    const data = await fetcher()
    const entry = { data, fetchedAt: new Date().toISOString() }
    save(`cg.live.${key}`, entry)
    return { status: 'ok', ...entry, stale: false }
  } catch {
    return cached ? { status: 'ok', ...cached, stale: true } : { status: 'error' }
  }
}

export async function getJson<T>(url: string, timeoutMs = 10000): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as T
  } finally {
    clearTimeout(timer)
  }
}

/** Distance en km entre deux points (haversine). */
export function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLon = (b.lon - a.lon) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
