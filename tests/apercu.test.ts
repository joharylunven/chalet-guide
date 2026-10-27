// Générateur d'aperçu : recherche, pré-remplissage, conversion, complétude, JSON.
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { Guide } from '../src/content/schema'
import { search, type IndexData, type SitRecord } from '../src/apercu/dataset'
import { TEMPLATES, checks, completion, draftToGuide, exportJson, fromRecord, importJson, titleCase, untranslated } from '../src/apercu/draft'

const ROOT = resolve(__dirname, '..')
const indexPath = join(ROOT, 'public/data/etablissements/index.json')

const record: SitRecord = {
  id: 'TEST1',
  nom: 'MAISON DES BOULEAUX',
  municipalite: 'Carleton-sur-Mer',
  citq: '302219',
  region: 'Gaspésie',
  lat: 48.1,
  lon: -66.11,
  capacite: 4,
  unites: 1,
  typesUnites: ['Appartement, chalet ou maison'],
  environnement: ["Au bord d'une rivière, d'un lac ou du fleuve"],
  activitesTerrestres: ['Randonnée pédestre', 'Golf'],
  activitesNautiques: ['Pêche', 'Piscine extérieure'],
  animaux: ['Animaux de compagnie admis gratuitement'],
  transport: ['Stationnement extérieur gratuit'],
  services: [],
  location: [],
  periodes: [{ type: 'Annuelle' }],
  maj: '2026-10-22',
}

describe('générateur d’aperçu', () => {
  it('recherche dans le registre par nom, municipalité ou CITQ', () => {
    const index = JSON.parse(readFileSync(indexPath, 'utf8')) as IndexData
    const [byCitq] = search(index, '302219')
    expect(byCitq.citq).toBe('302219')
    const byName = search(index, 'bouleaux carleton')
    expect(byName.some((h) => h.municipalite === 'Carleton-sur-Mer')).toBe(true)
    expect(search(index, 'zzzz-aucun-resultat')).toEqual([])
  })

  it('met en forme les noms en majuscules', () => {
    expect(titleCase('MAISON DES BOULEAUX')).toBe('Maison des Bouleaux')
    expect(titleCase("CHALET L'ÉRABLIÈRE DU LAC")).toBe("Chalet l'Érablière du Lac")
    expect(titleCase('Le Refuge')).toBe('Le Refuge')
  })

  it('pré-remplit à partir des champs publics de la fiche', () => {
    const d = fromRecord(record)
    expect(d.name).toBe('Maison des Bouleaux')
    expect(d.kind.fr).toBe('Chalet au bord de l’eau')
    expect(d.legalId).toBe('302219')
    expect(d.capacity).toBe(4)
    expect(d.illustration).toBe('river')
    expect(d.parking.fr).toContain('Stationnement extérieur gratuit')
    expect(d.rules.fr).toContain('Animaux admis gratuitement')
    expect(d.amenities.fr).toContain('Piscine extérieure')
    expect(d.activities.fr.split('\n')).toEqual(['Randonnée pédestre', 'Golf', 'Pêche'])
    expect(d.modules).toEqual(expect.arrayContaining(['municipal-rules', 'wildlife', 'snow-access']))
    // Rien qui ne soit pas dans la fiche : codes, wifi, consignes restent à compléter.
    expect(d.doorCode).toBe('')
    expect(d.wifiPassword).toBe('')
    expect(d.checklist.fr).toBe('')
  })

  it('produit un guide valide même incomplet', () => {
    const g = draftToGuide(fromRecord(record))
    const r = Guide.safeParse(g)
    expect(r.success ? [] : r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)).toEqual([])
    expect(g.emergency.hospital).toBeUndefined()
    expect(g.options).toEqual([])
  })

  it('calcule la complétude et liste ce qui manque', () => {
    const d = fromRecord(record)
    const before = completion(d)
    expect(checks(d).find((c) => c.id === 'wifi')?.done).toBe(false)
    d.wifiSsid = 'Bouleaux'
    d.wifiPassword = 'secret-demo'
    d.checklist = TEMPLATES.checklist
    expect(completion(d)).toBeGreaterThan(before)
    d.tagline = { fr: 'Face à la baie.', en: '' }
    expect(untranslated(d)).toContain('tagline')
  })

  it('l’anglais manquant reprend le français dans l’aperçu', () => {
    const d = fromRecord(record)
    d.directions = { fr: 'Route 132 Est.', en: '' }
    expect(draftToGuide(d).before.directions).toEqual({ fr: 'Route 132 Est.', en: 'Route 132 Est.' })
  })

  it('export puis import JSON redonne le même brouillon', () => {
    const d = fromRecord(record)
    d.doorCode = '1234'
    expect(importJson(exportJson(d))).toEqual(d)
    expect(() => importJson('{"name":"x"}')).toThrow()
  })
})
