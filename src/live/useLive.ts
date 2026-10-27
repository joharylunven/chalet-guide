import { useEffect, useState } from 'react'
import { cachedFetch, type LiveState } from './cache'

/** Charge une source en direct avec cache local et repli hors ligne. */
export function useLive<T>(key: string | null, maxAgeMin: number, fetcher: () => Promise<T>): LiveState<T> | null {
  const [state, setState] = useState<LiveState<T> | null>(key ? { status: 'loading' } : null)
  useEffect(() => {
    if (!key) return
    let alive = true
    setState({ status: 'loading' })
    cachedFetch(key, maxAgeMin, fetcher).then((s) => alive && setState(s))
    return () => {
      alive = false
    }
    // fetcher dépend des mêmes coordonnées que la clé : la clé suffit.
  }, [key, maxAgeMin])
  return state
}
