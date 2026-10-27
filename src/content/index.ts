// Chargement des contenus JSON. Ajouter un guide = déposer un fichier dans
// src/content/guides/ (voir README). La validation par le schéma Zod se fait
// en dev (ci-dessous) et dans tests/content.test.ts, pas dans le build livré.
import type { Guide, ModuleDef } from './schema'

const guideFiles = import.meta.glob<Guide>('./guides/*.json', { eager: true, import: 'default' })
const moduleFiles = import.meta.glob<ModuleDef>('./modules/*.json', { eager: true, import: 'default' })

const ORDER = ['refuge-lac-brule', 'maison-des-battures', 'domaine-des-erables', 'mas-des-oliviers', 'la-parenthese']

export const guides: Guide[] = Object.values(guideFiles).sort(
  (a, b) => (ORDER.indexOf(a.slug) + 1 || 99) - (ORDER.indexOf(b.slug) + 1 || 99),
)
export const modules: Record<string, ModuleDef> = Object.fromEntries(Object.values(moduleFiles).map((m) => [m.id, m]))

export function getGuide(slug: string): Guide | undefined {
  return guides.find((g) => g.slug === slug)
}

/** Fichiers bruts, pour la validation (tests et dev). */
export const rawContent = { guides: guideFiles, modules: moduleFiles }

if (import.meta.env.DEV) {
  void import('./schema').then(({ Guide, ModuleDef }) => {
    for (const [path, data] of Object.entries(guideFiles)) {
      const r = Guide.safeParse(data)
      if (!r.success) console.error(`Contenu invalide : ${path}`, r.error.issues)
    }
    for (const [path, data] of Object.entries(moduleFiles)) {
      const r = ModuleDef.safeParse(data)
      if (!r.success) console.error(`Contenu invalide : ${path}`, r.error.issues)
    }
  })
}
