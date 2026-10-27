// Schéma des contenus (guides et modules). Les fichiers JSON de
// src/content/ sont validés au chargement en dev et par tests/content.test.ts.
import { z } from 'zod'

/** Texte bilingue : chaque champ affiché au voyageur existe en FR et en EN. */
export const Text = z.object({ fr: z.string().min(1), en: z.string().min(1) })
export type Text = z.infer<typeof Text>

const LatLon = z.object({ lat: z.number(), lon: z.number() })

export const ModuleDef = z.object({
  id: z.string(),
  countries: z.array(z.enum(['qc', 'fr'])),
  icon: z.string(),
  title: Text,
  intro: Text,
  blocks: z.array(
    z.object({
      title: Text,
      tone: z.enum(['info', 'do', 'dont', 'warning']).default('info'),
      items: z.array(Text),
    }),
  ),
  /** Mots-clés supplémentaires pour l'assistant (synonymes, termes courants). */
  keywords: z.array(z.string()).default([]),
})
export type ModuleDef = z.infer<typeof ModuleDef>

export const RecoCategory = z.enum(['food', 'grocery', 'outdoor', 'culture', 'family', 'service', 'wellness'])
export const Season = z.enum(['winter', 'spring', 'summer', 'autumn'])

export const OptionDef = z.object({
  id: z.string(),
  icon: z.string(),
  title: Text,
  description: Text,
  price: z.number(),
  unit: Text,
  leadTime: Text,
  /** Moment où l'option est mise en avant. */
  highlight: z.enum(['cold', 'before', 'lastDay', 'always']).optional(),
})
export type OptionDef = z.infer<typeof OptionDef>

export const Guide = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  country: z.enum(['qc', 'fr']),
  name: z.string(),
  kind: Text,
  tagline: Text.optional(),
  region: Text,
  municipality: z.string(),
  /** Position approximative (2 décimales) : chalets fictifs. */
  location: LatLon,
  illustration: z.enum(['winter', 'river', 'maple', 'provence', 'normandy']),
  /** N° CITQ (Québec) ou n° de meublé de tourisme (France). Fictifs dans la démo. */
  legalId: z.string().optional(),
  hostLabel: Text,
  booking: z.enum(['direct', 'airbnb']),
  capacity: z.number(),
  stay: z.object({ checkIn: z.string(), checkOut: z.string() }),
  before: z.object({
    directions: Text,
    winterAccess: Text.optional(),
    bring: z.array(Text),
  }),
  arrival: z.object({
    doorCode: z.string(),
    steps: z.array(Text),
    parking: Text,
  }),
  wifi: z.object({ ssid: z.string(), password: z.string(), note: Text.optional() }),
  house: z.object({
    intro: Text.optional(),
    amenities: z.array(z.object({ icon: z.string(), label: Text })),
    modules: z.array(z.object({ id: z.string(), note: Text.optional() })),
  }),
  rules: z.array(z.object({ icon: z.string(), text: Text })),
  departure: z.object({ checklist: z.array(Text), note: Text.optional() }),
  emergency: z.object({
    hospital: z.object({ name: z.string(), city: z.string(), location: LatLon.optional(), distanceKm: z.number().optional() }).optional(),
    /** Centre antipoison propre à la région (France). Sinon : celui du profil pays. */
    poisonCentre: z.string().optional(),
    notes: z.array(Text).default([]),
  }),
  around: z.array(
    z.object({
      id: z.string(),
      category: RecoCategory,
      name: z.string(),
      text: Text,
      location: LatLon,
      seasons: z.array(Season),
    }),
  ),
  /** Activités indiquées dans la fiche officielle (aperçus pré-remplis). */
  activities: z.array(Text).optional(),
  options: z.array(OptionDef),
  faq: z.array(z.object({ q: Text, a: Text, section: z.string() })).default([]),
})
export type Guide = z.infer<typeof Guide>

export type { SectionId } from './sections'
