import { createContext, useContext } from 'react'
import type { Guide, SectionId } from '../content/schema'
import type { CountryProfile } from '../countries'
import type { LiveState } from '../live/cache'
import type { Weather } from '../live/sources'

export type Phase = 'before' | 'during' | 'departure'
export type Booking = Guide['booking']

export interface GuideCtx {
  guide: Guide
  country: CountryProfile
  phase: Phase
  setPhase: (p: Phase) => void
  booking: Booking
  setBooking: (b: Booking) => void
  weather: LiveState<Weather> | null
  sectionTitle: (id: SectionId) => string
  /** Lien vers une vue du guide (démo ou aperçu). */
  link: (...parts: string[]) => string
  /** Aperçu non publié : pas de statistiques, bandeau dédié. */
  preview: boolean
  /** Formate un prix dans la devise du pays. */
  money: (n: number) => string
}

export const GuideContext = createContext<GuideCtx | null>(null)

export function useGuide(): GuideCtx {
  const c = useContext(GuideContext)
  if (!c) throw new Error('useGuide hors de <GuideApp>')
  return c
}
