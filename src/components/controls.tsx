import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useI18n } from '../i18n'
import { load, save } from '../storage'
import { Icon } from './Icon'

export type Theme = 'auto' | 'light' | 'dark'

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'auto') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', theme)
}

function isDark(theme: Theme) {
  return theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
}

export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setTheme] = useState<Theme>(() => load<Theme>('cg.theme', 'auto'))
  useEffect(() => {
    applyTheme(theme)
    save('cg.theme', theme)
  }, [theme])
  return [theme, setTheme]
}

/** Bascule clair / sombre (part du thème système). */
export function ThemeToggle() {
  const { t } = useI18n()
  const [theme, setTheme] = useTheme()
  const [, rerender] = useState(0)
  useEffect(() => {
    // Suit le thème système tant que l'utilisateur n'a rien choisi.
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => rerender((n) => n + 1)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  const dark = isDark(theme)
  return (
    <button type="button" className="icon-btn" onClick={() => setTheme(dark ? 'light' : 'dark')} aria-label={dark ? t('theme.toLight') : t('theme.toDark')} title={dark ? t('theme.toLight') : t('theme.toDark')}>
      <Icon name={dark ? 'sun' : 'moon'} />
    </button>
  )
}

export function LangToggle() {
  const { t, lang, setLang } = useI18n()
  return (
    <button type="button" className="btn btn-sm" onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')} aria-label={`${lang === 'fr' ? 'EN' : 'FR'} — ${t('common.switchLangLabel')}`} lang={lang === 'fr' ? 'en' : 'fr'}>
      <Icon name="globe" size={16} />
      {lang === 'fr' ? 'EN' : 'FR'}
    </button>
  )
}

export function CopyButton({ value, label, onCopied, className = 'btn btn-primary' }: { value: string; label: string; onCopied?: () => void; className?: string }) {
  const { t } = useI18n()
  const [done, setDone] = useState(false)
  const timer = useRef<number>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // Repli pour les navigateurs sans API presse-papiers (http, anciens iOS).
      const ta = document.createElement('textarea')
      ta.value = value
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setDone(true)
    onCopied?.()
    timer.current = window.setTimeout(() => setDone(false), 2000)
  }

  return (
    <button type="button" className={className} onClick={copy} aria-live="polite">
      <Icon name={done ? 'check' : 'copy'} size={18} />
      {done ? t('common.copied') : label}
    </button>
  )
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  const { t } = useI18n()
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog ref={ref} className="modal" onClose={onClose} onClick={(e) => e.target === ref.current && onClose()} aria-labelledby="modal-title">
      <div className="modal-body">
        <div className="modal-head">
          <h2 id="modal-title">{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t('common.close')}>
            <Icon name="x" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}

/** Contrôle segmenté (boutons à bascule). */
export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}
