import type { Text } from '../content/schema'
import { qc } from './qc'
import { fr } from './fr'

export type CountryCode = 'qc' | 'fr'

export interface EmergencyNumber {
  id: string
  /** Numéro tel qu'affiché. */
  number: string
  /** Numéro composé (lien tel:). */
  dial: string
  label: Text
  description: Text
  primary?: boolean
}

export interface CountryProfile {
  code: CountryCode
  name: Text
  locale: { fr: string; en: string }
  currency: 'CAD' | 'EUR'
  legalId: { label: Text; help: Text }
  emergency: EmergencyNumber[]
  /** Centre antipoison par défaut (null : dépend de la région, voir le guide). */
  poisonCentre: EmergencyNumber | null
  /** Centres antipoison régionaux, référencés par emergency.poisonCentre dans un guide. */
  poisonCentres?: Record<string, EmergencyNumber>
  poisonDirectory?: { label: Text; url: string }
  /** Mention réglementaire affichée dans le suivi du spa (jamais d'affirmation sur l'obligation). */
  spaNotice: Text
  /** Sources de données en direct utilisées pour ce pays. */
  live: {
    alerts: 'ec' | null
    roads: 'mtq' | null
    fire: 'cwfis' | null
    links: { id: string; label: Text; url: string }[]
  }
}

export const countries: Record<CountryCode, CountryProfile> = { qc, fr }
