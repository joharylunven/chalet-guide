import { useState } from 'react'
import type { SectionId } from '../content/schema'
import { useI18n } from '../i18n'
import { track } from '../analytics/track'
import { Icon } from '../components/Icon'
import { Illustration } from '../components/Illustration'
import { CopyButton } from '../components/controls'
import { useGuide } from './context'
import { LivePanel } from './LivePanel'

const TILES: { id: SectionId; icon: string }[] = [
  { id: 'arrival', icon: 'key' },
  { id: 'wifi', icon: 'wifi' },
  { id: 'house', icon: 'house' },
  { id: 'rules', icon: 'list-checks' },
  { id: 'departure', icon: 'door-open' },
  { id: 'emergency', icon: 'siren' },
  { id: 'around', icon: 'map-pin' },
  { id: 'options', icon: 'shopping-bag' },
  { id: 'assistant', icon: 'message-circle' },
  { id: 'spa', icon: 'waves' },
]

export function Home() {
  const { t, tx } = useI18n()
  const { guide, sectionTitle, link } = useGuide()
  return (
    <>
      <div className="hero">
        <Illustration kind={guide.illustration} className="hero-illus" />
        <div className="hero-text">
          <p className="eyebrow hero-eyebrow">
            {tx(guide.kind)} · {guide.municipality}, {tx(guide.region)}
          </p>
          <h1>{guide.name}</h1>
          {guide.tagline && <p className="hero-tagline">{tx(guide.tagline)}</p>}
        </div>
      </div>
      <div className="section-pad home-stack">
        <BoardingPass />
        <nav aria-label={t('common.home')}>
          <ul className="tiles">
            {TILES.filter((tile) => tile.id !== 'spa' || guide.house.modules.some((m) => m.id === 'spa')).map((tile) => (
              <li key={tile.id}>
                <a className={`tile tile-${tile.id}`} href={link(tile.id)}>
                  <span className="tile-icon">
                    <Icon name={tile.icon} size={24} />
                  </span>
                  <span className="tile-title">{sectionTitle(tile.id)}</span>
                  <span className="tile-sub">{t(tile.id === 'emergency' && guide.country === 'fr' ? 'tiles.emergencyFr' : `tiles.${tile.id}`)}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <LivePanel />
        <a className="qr-link" href={link('qr')}>
          <Icon name="qr-code" size={18} /> {t('qr.title')}
        </a>
      </div>
    </>
  )
}

/** Carte « boarding pass » : son contenu suit le moment du séjour. */
function BoardingPass() {
  const { t } = useI18n()
  const { guide, phase, link } = useGuide()
  const [showCode, setShowCode] = useState(false)

  return (
    <section className={`pass pass-${phase}`} aria-labelledby="pass-title">
      <div className="pass-head">
        <div>
          <p className="eyebrow pass-eyebrow">{t(`phase.${phase}`)}</p>
          <h2 id="pass-title">{t(`boarding.${phase}`)}</h2>
          <p className="pass-hint">{phase === 'departure' ? t('boarding.departureHint', { time: guide.stay.checkOut }) : t(`boarding.${phase}Hint`)}</p>
        </div>
      </div>
      <dl className="pass-times">
        <div>
          <dt>{t('boarding.checkIn')}</dt>
          <dd>{t('boarding.from', { time: guide.stay.checkIn })}</dd>
        </div>
        <div className="pass-perf" aria-hidden="true" />
        <div>
          <dt>{t('boarding.checkOut')}</dt>
          <dd>{t('boarding.until', { time: guide.stay.checkOut })}</dd>
        </div>
      </dl>

      {phase === 'before' && (
        <div className="pass-actions">
          <a className="btn btn-primary" href={link('arrival')}>
            <Icon name="navigation" size={18} /> {t('boarding.seeRoute')}
          </a>
        </div>
      )}

      {phase === 'during' && (
        <div className="pass-quick">
          <div className="pass-field">
            <span className="pass-label">{t('boarding.doorCode')}</span>
            <span className="pass-value mono" aria-live="polite">
              {showCode ? guide.arrival.doorCode : '••••'}
            </span>
            <button type="button" className="btn btn-sm" onClick={() => setShowCode((s) => !s)} aria-pressed={showCode}>
              <Icon name={showCode ? 'eye-off' : 'eye'} size={16} /> {showCode ? t('boarding.hideCode') : t('boarding.showCode')}
            </button>
          </div>
          <div className="pass-field">
            <span className="pass-label">{t('boarding.wifi')}</span>
            <span className="pass-value">{guide.wifi.ssid}</span>
            <CopyButton
              className="btn btn-sm btn-primary"
              value={guide.wifi.password}
              label={t('common.copy')}
              onCopied={() => track({ type: 'copy', guide: guide.slug, what: 'wifi' })}
            />
          </div>
        </div>
      )}

      {phase === 'departure' && (
        <div className="pass-actions">
          <a className="btn btn-primary" href={link('departure')}>
            <Icon name="list-checks" size={18} /> {t('boarding.seeChecklist')}
          </a>
        </div>
      )}
    </section>
  )
}
