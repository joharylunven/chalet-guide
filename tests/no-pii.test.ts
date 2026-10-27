// Garde-fou : aucune adresse courriel ni aucun numéro de téléphone ne doit
// se trouver dans ce qui est publié (public/ et dist/).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import allowlist from './pii-allowlist.json'

const ROOT = resolve(__dirname, '..')
const TEXT_EXT = new Set(['.json', '.js', '.mjs', '.css', '.html', '.txt', '.xml', '.webmanifest', '.svg', '.map', '.csv', '.md'])

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g
const PHONES: [string, RegExp][] = [
  // Amérique du Nord : 514-555-1234, (514) 555 1234, +1 514.555.1234
  ['nord-américain', /(?<![\d.])(?:\+?1[\s.-]?)?\(?[2-9]\d{2}\)?[\s.-]\d{3}[\s.-]\d{4}(?![\d.])/g],
  // France : 06 12 34 56 78, 01.23.45.67.89, +33 6 12 34 56 78
  ['français', /(?<![\d.])(?:\+33[\s.]?[1-9]|0[1-9])(?:[\s.-]\d{2}){4}(?![\d.])/g],
  // Liens tel: explicites
  ['lien tel:', /tel:\+?[\d\s().-]{7,}/g],
]
// Numéros publics autorisés : urgences et lignes officielles (affichés dans les guides).
const ALLOWED_PHONES = new Set<string>([
  '18004635060', // Centre antipoison du Québec (src/countries/qc.ts)
  '0491752525', // Centre antipoison de Marseille (src/countries/fr.ts)
])

function* walk(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) yield* walk(p)
    else if (TEXT_EXT.has(extname(p).toLowerCase())) yield p
  }
}

function scan(dir: string): string[] {
  const allowedEmails = new Set(allowlist.emails.map((e: string) => e.toLowerCase()))
  const problems: string[] = []
  for (const file of walk(dir)) {
    const text = readFileSync(file, 'utf8')
    const where = relative(ROOT, file)
    for (const m of text.matchAll(EMAIL)) {
      if (!allowedEmails.has(m[0].toLowerCase())) problems.push(`${where} : courriel « ${m[0]} »`)
    }
    for (const [label, re] of PHONES) {
      for (const m of text.matchAll(re)) {
        if (!ALLOWED_PHONES.has(m[0].replace(/\D/g, ''))) problems.push(`${where} : téléphone ${label} « ${m[0]} »`)
      }
    }
  }
  return problems
}

describe('aucune donnée personnelle publiée', () => {
  for (const dir of ['public', 'dist']) {
    const abs = join(ROOT, dir)
    it.skipIf(!existsSync(abs))(`${dir}/ ne contient ni courriel ni téléphone`, () => {
      expect(scan(abs)).toEqual([])
    })
  }

  it('le détecteur repère bien les motifs', () => {
    const samples = ['ecrire à prenom.nom@example.com', 'appelez le (819) 555-0123', 'tél. 06 12 34 56 78']
    expect(samples.every((s) => [EMAIL, ...PHONES.map(([, re]) => re)].some((re) => new RegExp(re.source).test(s)))).toBe(true)
  })

  it('les données privées ne sont pas sous public/', () => {
    expect(existsSync(join(ROOT, 'public/prospects.csv'))).toBe(false)
    const gitignore = readFileSync(join(ROOT, '.gitignore'), 'utf8')
    for (const p of ['data/raw/', 'data/private/', 'docs/interne/']) expect(gitignore).toContain(p)
  })
})
