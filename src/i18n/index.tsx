// i18n maison : textes d'interface dans fr.json / en.json, contenus sous la
// forme { fr, en } dans les JSON de src/content/.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import fr from './fr.json'
import en from './en.json'
import type { Lang } from '../config'
import type { Text } from '../content/schema'
import { load, save } from '../storage'

const dictionaries = { fr, en } as const

type Vars = Record<string, string | number>

function lookup(dict: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>((acc, k) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[k] : undefined), dict)
}

function interpolate(s: string, vars?: Vars): string {
  return vars ? s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`)) : s
}

interface I18n {
  lang: Lang
  setLang: (l: Lang) => void
  /** Texte d'interface. */
  t: (key: string, vars?: Vars) => string
  /** Liste de textes d'interface (ex. niveaux d'un indice). */
  tList: (key: string) => string[]
  /** Contenu bilingue d'un guide. */
  tx: (text: Text | undefined) => string
}

const Ctx = createContext<I18n | null>(null)

function initialLang(): Lang {
  const stored = load<Lang | null>('cg.lang', null)
  if (stored === 'fr' || stored === 'en') return stored
  return navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  // Suit un changement de langue fait dans un autre onglet ou dans l'aperçu (iframe).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== 'cg.lang') return
      const l = load<Lang | null>('cg.lang', null)
      if (l === 'fr' || l === 'en') setLangState(l)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    save('cg.lang', l)
  }, [])

  const value = useMemo<I18n>(() => {
    const dict = dictionaries[lang]
    return {
      lang,
      setLang,
      t: (key, vars) => {
        const v = lookup(dict, key)
        if (typeof v !== 'string') {
          if (import.meta.env.DEV) console.warn(`i18n : clé manquante « ${key} » (${lang})`)
          return key
        }
        return interpolate(v, vars)
      },
      tList: (key) => {
        const v = lookup(dict, key)
        return Array.isArray(v) ? (v as string[]) : []
      },
      tx: (text) => (text ? text[lang] : ''),
    }
  }, [lang, setLang])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useI18n(): I18n {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useI18n doit être utilisé dans <I18nProvider>')
  return ctx
}
