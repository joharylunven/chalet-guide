// Qualité minimale de l'assistant de démo : questions courantes → bonne section.
import { describe, expect, it } from 'vitest'
import { getGuide } from '../src/content'
import { searchProvider } from '../src/assistant/searchProvider'

const refuge = getGuide('refuge-lac-brule')!
const mas = getGuide('mas-des-oliviers')!

const cases: [typeof refuge, 'fr' | 'en', string, RegExp][] = [
  [refuge, 'fr', 'où je mets les poubelles ?', /bac/],
  [refuge, 'fr', 'mot de passe wifi', /Huard-Boreal-2026/],
  [refuge, 'fr', 'quel est le code de la porte', /4821/],
  [refuge, 'fr', 'à quelle heure est le départ ?', /11:00/],
  [refuge, 'fr', 'comment allumer le poêle', /Allumer/],
  [refuge, 'fr', "l'eau du robinet est potable ?", /puits|potable/i],
  [refuge, 'fr', 'que faire si je vois un ours', /ours/],
  [refuge, 'fr', 'peut-on faire un feu dehors', /feu/i],
  [refuge, 'en', 'where do I park', /Park|garage/],
  [refuge, 'en', 'wifi password', /Huard-Boreal-2026/],
  [refuge, 'en', 'hot tub cover', /cover/i],
  [mas, 'fr', 'où jeter le verre', /verre/i],
  [mas, 'fr', 'taxe de séjour', /taxe/i],
]

describe('assistant de démo', () => {
  for (const [guide, lang, q, expected] of cases) {
    it(`${guide.slug} [${lang}] « ${q} »`, async () => {
      const answers = await searchProvider.ask(q, guide, lang)
      expect(answers.length).toBeGreaterThan(0)
      expect(answers.map((a) => `${a.title} ${a.text}`).join(' | ')).toMatch(expected)
    })
  }

  it('ne répond pas à côté quand le guide ne sait pas', async () => {
    expect(await searchProvider.ask('location de trottinette électrique', refuge, 'fr')).toEqual([])
    expect(await searchProvider.ask('is there a gym nearby', refuge, 'en')).toEqual([])
  })
})
