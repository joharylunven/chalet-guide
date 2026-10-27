import { useState, type ReactNode } from 'react'
import { config } from '../config'
import { useI18n } from '../i18n'
import { href } from '../router'
import { LangToggle, ThemeToggle } from '../components/controls'
import { Icon } from '../components/Icon'

const NAV = [
  { id: 'home', path: [] as string[] },
  { id: 'demo', path: ['demo'] },
  { id: 'preview', path: ['apercu'] },
  { id: 'dashboard', path: ['tableau-de-bord'] },
]

export function SiteLayout({ active, children }: { active: string; children: ReactNode }) {
  const { t, lang } = useI18n()
  // Sur mobile, la navigation se replie derrière un bouton « Menu ».
  const [open, setOpen] = useState(false)
  return (
    <>
      <header className="site-header">
        <a className="brand" href={href()}>
          <img className="brand-mark" src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width="32" height="32" />
          {config.productName}
        </a>
        <div className="site-tools">
          <LangToggle />
          <ThemeToggle />
          <button type="button" className="icon-btn site-menu-btn" aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen((o) => !o)} aria-label={t('nav.menu')}>
            <Icon name={open ? 'x' : 'menu'} />
          </button>
        </div>
        <nav id="site-nav" className={`site-nav ${open ? 'is-open' : ''}`} aria-label={t('nav.menu')}>
          {NAV.map((n) => (
            <a key={n.id} href={href(...n.path)} aria-current={active === n.id ? 'page' : undefined} onClick={() => setOpen(false)}>
              {t(`nav.${n.id}`)}
            </a>
          ))}
        </nav>
      </header>
      {children}
      <footer className="site-footer">
        <p>
          {config.dataset.label[lang]}{' '}
          <a href={config.dataset.url} target="_blank" rel="noopener noreferrer">
            Données Québec
          </a>
        </p>
        <p>{t('footer.demo')}</p>
      </footer>
    </>
  )
}

export function ComingSoon({ active, step }: { active: string; step: number }) {
  const { t } = useI18n()
  return (
    <SiteLayout active={active}>
      <main className="page stack">
        <h1>{t(`nav.${active}`)}</h1>
        <p className="muted">{t('common.comingSoon', { n: step })}</p>
        <p className="spa-actions">
          <a className="btn btn-primary" href={href('demo')}>
            {t('demoIndex.title')}
          </a>
          {active === 'dashboard' && (
            <a className="btn" href={href('tableau-de-bord', 'spa')}>
              {t('nav.spa')}
            </a>
          )}
        </p>
      </main>
    </SiteLayout>
  )
}
