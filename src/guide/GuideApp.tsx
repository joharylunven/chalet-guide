import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { config } from '../config'
import { getGuide } from '../content'
import { SECTIONS, type SectionId } from '../content/sections'
import type { Guide } from '../content/schema'
import { countries } from '../countries'
import { useI18n } from '../i18n'
import { fetchWeather } from '../live/sources'
import { useLive } from '../live/useLive'
import { href } from '../router'
import { load, save } from '../storage'
import { track } from '../analytics/track'
import { Icon } from '../components/Icon'
import { LangToggle, Segmented, ThemeToggle } from '../components/controls'
import { GuideContext, useGuide, type Booking, type GuideCtx, type Phase } from './context'
import { Home } from './Home'
import { Arrival, Departure, Emergency, House, Rules, Wifi } from './sections/basic'
import { Options } from './sections/Options'
import { Spa } from './sections/Spa'
import { NotFound } from '../pages/NotFound'
import './guide.css'

const Around = lazy(() => import('./sections/Around'))
const QrPage = lazy(() => import('./QrPage'))
const Assistant = lazy(() => import('./sections/Assistant'))

const SECTION_VIEWS: Record<Exclude<SectionId, 'around' | 'assistant'>, () => React.ReactElement> = {
  arrival: Arrival,
  wifi: Wifi,
  house: House,
  rules: Rules,
  departure: Departure,
  emergency: Emergency,
  options: Options,
  spa: Spa,
}

interface DemoSettings {
  phase: Phase
  booking?: Booking
}

interface GuideAppProps {
  /** Guide de démo à afficher (src/content/guides/). */
  slug?: string
  /** Ou un guide fourni directement (aperçu d'hôte non publié). */
  guide?: Guide
  view?: string
  /** Préfixe des liens internes : ['demo', slug] par défaut. */
  basePath?: string[]
}

export function GuideApp({ slug, guide: given, view, basePath }: GuideAppProps) {
  const guide = given ?? (slug ? getGuide(slug) : undefined)
  const preview = !!given
  const { t, lang } = useI18n()
  const settingsKey = `cg.demo.${guide?.slug ?? slug}`
  const [settings, setSettings] = useState<DemoSettings>(() => load(settingsKey, { phase: 'during' }))

  useEffect(() => {
    save(settingsKey, settings)
  }, [settingsKey, settings])
  // Statistiques : seulement pour les guides de démo, jamais pour un aperçu d'hôte.
  // Ni aperçu d'hôte, ni guide affiché dans un cadre (vitrine) : seules les vraies visites comptent.
  const embedded = window.self !== window.top
  const slugForStats = preview || embedded ? null : guide?.slug
  useEffect(() => {
    if (!slugForStats) return
    track({ type: 'open', guide: slugForStats })
    // Guide installé sur l'écran d'accueil : on rouvrira celui-ci (voir App).
    save('cg.lastGuide', slugForStats)
  }, [slugForStats])
  useEffect(() => {
    if (slugForStats && view && (SECTIONS as readonly string[]).includes(view)) track({ type: 'section', guide: slugForStats, section: view })
  }, [slugForStats, view])
  useEffect(() => {
    if (guide) document.title = `${guide.name} — ${config.productName}`
  }, [guide])

  const weather = useLive(guide ? `weather:${guide.location.lat},${guide.location.lon}` : null, 30, () => fetchWeather(guide!.location))

  const setPhase = useCallback((phase: Phase) => setSettings((s) => ({ ...s, phase })), [])
  const setBooking = useCallback((booking: Booking) => setSettings((s) => ({ ...s, booking })), [])

  const ctx = useMemo<GuideCtx | null>(() => {
    if (!guide) return null
    const country = countries[guide.country]
    const fmt = new Intl.NumberFormat(country.locale[lang], { style: 'currency', currency: country.currency, maximumFractionDigits: 0 })
    const base = basePath ?? ['demo', guide.slug]
    return {
      link: (...parts) => href(...base, ...parts),
      preview,
      guide,
      country,
      phase: settings.phase,
      setPhase,
      booking: settings.booking ?? guide.booking,
      setBooking,
      weather,
      money: (n) => fmt.format(n),
      sectionTitle: (id) => t(id === 'house' && guide.country === 'fr' ? 'sections.houseFr' : `sections.${id}`),
    }
  }, [guide, settings, setPhase, setBooking, weather, lang, t, basePath, preview])

  if (!guide || !ctx) return <NotFound />
  if (view === 'spa' && !guide.house.modules.some((m) => m.id === 'spa')) return <NotFound />

  let body: React.ReactElement
  if (!view) body = <Home />
  else if (view === 'qr') body = <QrPage />
  else if (view === 'around') body = <Around />
  else if (view === 'assistant') body = <Assistant />
  else if (view in SECTION_VIEWS) {
    const View = SECTION_VIEWS[view as keyof typeof SECTION_VIEWS]
    body = <View />
  } else return <NotFound />

  return (
    <GuideContext.Provider value={ctx}>
      <div className={`guide guide-${guide.country}`}>
        <a href="#main" className="skip-link">
          {t('common.home')}
        </a>
        <header className="guide-top">
          {view ? (
            <a className="icon-btn" href={ctx.link()} aria-label={t('common.home')}>
              <Icon name="chevron-left" />
            </a>
          ) : preview ? null : (
            <a className="icon-btn" href={href('demo')} aria-label={t('demoIndex.title')}>
              <Icon name="house" />
            </a>
          )}
          <span className="guide-top-name">{guide.name}</span>
          <div className="guide-top-actions">
            <LangToggle />
            <ThemeToggle />
          </div>
        </header>
        {preview ? <p className="preview-bar">{t('apercu.unpublished')}</p> : <DemoBar />}
        <main id="main" className="guide-main">
          <Suspense fallback={<p className="muted section-pad">…</p>}>{body}</Suspense>
        </main>
        <GuideFooter />
        <TabBar view={view} />
      </div>
    </GuideContext.Provider>
  )
}

/**
 * Barre d'onglets en bas d'écran, à portée de pouce : les besoins urgents
 * d'un voyageur (code, wifi, question, urgence) en un toucher, depuis partout.
 */
const TABS: { id: string; icon: string }[] = [
  { id: '', icon: 'house' },
  { id: 'arrival', icon: 'key' },
  { id: 'wifi', icon: 'wifi' },
  { id: 'assistant', icon: 'message-circle' },
  { id: 'emergency', icon: 'siren' },
]

function TabBar({ view }: { view?: string }) {
  const { t } = useI18n()
  const { link } = useGuide()
  return (
    <nav className="tabbar" aria-label={t('common.quickNav')}>
      {TABS.map((tab) => {
        const current = (view ?? '') === tab.id
        return (
          <a key={tab.id || 'home'} href={tab.id ? link(tab.id) : link()} className={`tabbar-item tab-${tab.id || 'home'}`} aria-current={current ? 'page' : undefined}>
            <Icon name={tab.icon} size={22} />
            <span>{tab.id ? t(`tabbar.${tab.id}`) : t('tabbar.home')}</span>
          </a>
        )
      })}
    </nav>
  )
}

function DemoBar() {
  const { t } = useI18n()
  const { phase, setPhase, booking, setBooking } = useGuide()
  const [open, setOpen] = useState(false)
  return (
    <section className="demo-bar" aria-label={t('demoBar.settings')}>
      <button type="button" className="demo-bar-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="badge badge-demo">{t('common.demo')}</span>
        <span className="demo-bar-title">{t('demoBar.short')}</span>
        <Icon name="settings" size={18} />
      </button>
      {open && (
        <div className="demo-bar-panel">
          <p className="small">{t('demoBar.fictional')}</p>
          <label className="demo-bar-row">
            <span>{t('demoBar.phase')}</span>
            <Segmented
              label={t('demoBar.phase')}
              value={phase}
              onChange={setPhase}
              options={(['before', 'during', 'departure'] as const).map((p) => ({ value: p, label: t(`phase.${p}`) }))}
            />
          </label>
          <label className="demo-bar-row">
            <span>{t('demoBar.booking')}</span>
            <Segmented
              label={t('demoBar.booking')}
              value={booking}
              onChange={setBooking}
              options={[
                { value: 'direct', label: t('demoBar.direct') },
                { value: 'airbnb', label: t('demoBar.airbnb') },
              ]}
            />
          </label>
        </div>
      )}
    </section>
  )
}

function GuideFooter() {
  const { t, tx } = useI18n()
  const { guide, country } = useGuide()
  return (
    <footer className="guide-footer">
      {guide.legalId && <p>{t('emergency.legal', { label: tx(country.legalId.label), id: guide.legalId })}</p>}
      <p>{tx(guide.hostLabel)}</p>
      <p>
        {t('footer.poweredBy', { name: config.productName })} · {t('footer.demo')}
      </p>
      <p>
        {t('footer.weather')} · {t('footer.osm')}
      </p>
    </footer>
  )
}
