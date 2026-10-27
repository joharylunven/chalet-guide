// Cohérence des contenus : guides et modules valides, traductions complètes.
import { describe, expect, it } from 'vitest'
import { guides, modules, rawContent } from '../src/content'
import { Guide, ModuleDef } from '../src/content/schema'
import { iconNames } from '../src/components/Icon'
import fr from '../src/i18n/fr.json'
import en from '../src/i18n/en.json'

function keys(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return [prefix]
  return Object.entries(obj).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k))
}

describe('contenus', () => {
  // Le build ne revalide pas : chaque fichier doit être complet tel quel
  // (aucune valeur par défaut du schéma ne doit être nécessaire).
  for (const [path, data] of Object.entries(rawContent.guides)) {
    it(`${path} respecte le schéma`, () => expect(Guide.parse(data)).toEqual(data))
  }
  for (const [path, data] of Object.entries(rawContent.modules)) {
    it(`${path} respecte le schéma`, () => expect(ModuleDef.parse(data)).toEqual(data))
  }

  it('au moins deux guides de démo, dans les deux pays', () => {
    expect(guides.length).toBeGreaterThanOrEqual(2)
    expect(new Set(guides.map((g) => g.country))).toEqual(new Set(['qc', 'fr']))
  })

  it('fr.json et en.json ont exactement les mêmes clés', () => {
    expect(keys(fr).sort()).toEqual(keys(en).sort())
  })

  for (const g of guides) {
    it(`${g.slug} : modules, icônes et pays cohérents`, () => {
      for (const ref of g.house.modules) {
        const m = modules[ref.id]
        expect(m, `module inconnu ${ref.id}`).toBeDefined()
        expect(m.countries, `${ref.id} non prévu pour ${g.country}`).toContain(g.country)
      }
      const icons = [...g.house.amenities.map((a) => a.icon), ...g.rules.map((r) => r.icon), ...g.options.map((o) => o.icon)]
      for (const i of icons) expect(iconNames, `icône inconnue ${i}`).toContain(i)
      expect(new Set(g.around.map((r) => r.id)).size).toBe(g.around.length)
      // Position approximative : deux décimales au plus.
      for (const p of [g.location, ...g.around.map((r) => r.location)]) {
        expect(Math.round(p.lat * 100) / 100).toBe(p.lat)
        expect(Math.round(p.lon * 100) / 100).toBe(p.lon)
      }
    })
  }

  it('les icônes des modules existent', () => {
    for (const m of Object.values(modules)) expect(iconNames).toContain(m.icon)
  })
})
