// Configuration du suivi du spa.
//
// RÈGLE : aucun seuil ni aucune fréquence réglementaire n'est codé en dur.
// Les seuils de l'exploitant sont vides par défaut. Les valeurs « exemple »
// ci-dessous ne sont proposées qu'à la demande de l'exploitant, toujours
// étiquetées comme telles : ce sont des ordres de grandeur courants de
// fabricants, pas une norme. L'exploitant doit vérifier ses obligations.
import type { Text } from '../content/schema'

export type ParamKind = 'number' | 'bool'

export interface SpaParam {
  id: string
  label: Text
  unit: string
  kind: ParamKind
  step?: number
  /** Valeurs d'exemple, proposées seulement sur demande et étiquetées « exemple ». */
  example?: { min?: number; max?: number }
}

export const SPA_PARAMS: SpaParam[] = [
  { id: 'temp', label: { fr: 'Température de l’eau', en: 'Water temperature' }, unit: '°C', kind: 'number', step: 0.5, example: { max: 40 } },
  { id: 'ph', label: { fr: 'pH', en: 'pH' }, unit: '', kind: 'number', step: 0.1, example: { min: 7.2, max: 7.6 } },
  {
    id: 'free',
    label: { fr: 'Désinfectant libre (chlore ou brome)', en: 'Free sanitizer (chlorine or bromine)' },
    unit: 'mg/L',
    kind: 'number',
    step: 0.1,
    example: { min: 1, max: 3 },
  },
  { id: 'total', label: { fr: 'Désinfectant total', en: 'Total sanitizer' }, unit: 'mg/L', kind: 'number', step: 0.1 },
  { id: 'clarity', label: { fr: 'Eau limpide, fond visible', en: 'Clear water, bottom visible' }, unit: '', kind: 'bool' },
]

export interface SpaTask {
  id: string
  label: Text
  /** Fréquence d'exemple en jours, proposée seulement sur demande. */
  exampleEveryDays?: number
}

export const SPA_TASKS: SpaTask[] = [
  { id: 'filter', label: { fr: 'Nettoyage du filtre', en: 'Filter cleaning' }, exampleEveryDays: 7 },
  { id: 'water', label: { fr: 'Vidange et renouvellement de l’eau', en: 'Drain and refill' }, exampleEveryDays: 90 },
  { id: 'disinfect', label: { fr: 'Désinfection complète du bassin', en: 'Full shell disinfection' }, exampleEveryDays: 90 },
  { id: 'cover', label: { fr: 'Nettoyage du couvercle', en: 'Cover cleaning' }, exampleEveryDays: 30 },
  { id: 'cartridge', label: { fr: 'Remplacement de la cartouche filtrante', en: 'Filter cartridge replacement' }, exampleEveryDays: 365 },
  { id: 'winter', label: { fr: 'Hivernage ou remise en service', en: 'Winterizing or start-up' } },
]

/**
 * Lien de réassort de consommables (partenaire distributeur). Vide par
 * défaut : le bouton n'apparaît que si un lien est configuré ici ou saisi
 * par l'exploitant dans l'écran de suivi.
 */
export const SPA_SUPPLIER: { label: Text; url: string } = {
  label: { fr: 'Commander des consommables', en: 'Order supplies' },
  url: '',
}
