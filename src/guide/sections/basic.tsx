import { useEffect, useState, type ReactNode } from 'react'
import { modules } from '../../content'
import type { SectionId } from '../../content/schema'
import type { EmergencyNumber } from '../../countries'
import { useI18n } from '../../i18n'
import { load, save } from '../../storage'
import { track } from '../../analytics/track'
import { Icon } from '../../components/Icon'
import { CopyButton } from '../../components/controls'
import { useGuide } from '../context'
import { ModuleCard } from '../ModuleCard'

export function SectionHeader({ id, icon, lead }: { id: SectionId; icon: string; lead?: ReactNode }) {
  const { sectionTitle } = useGuide()
  return (
    <header className="section-head">
      <span className="section-icon">
        <Icon name={icon} size={26} />
      </span>
      <h1>{sectionTitle(id)}</h1>
      {lead && <p className="section-lead">{lead}</p>}
    </header>
  )
}

const mapsUrl = (lat: number, lon: number) => `https://www.openstreetmap.org/directions?to=${lat}%2C${lon}`

export function Arrival() {
  const { t, tx } = useI18n()
  const { guide } = useGuide()
  return (
    <article className="section-pad stack">
      <SectionHeader id="arrival" icon="key" />
      <div className="card code-card">
        <p className="eyebrow">{t('boarding.doorCode')}</p>
        <p className="big-code mono">{guide.arrival.doorCode}</p>
        <p className="muted small">{t('boarding.from', { time: guide.stay.checkIn })}</p>
      </div>
      <section className="card stack">
        <h2>{t('arrival.steps')}</h2>
        <ol className="steps">
          {guide.arrival.steps.map((s, i) => (
            <li key={i}>{tx(s)}</li>
          ))}
        </ol>
        <p>
          <strong>{t('arrival.parking')}{t('common.colon')} </strong>
          {tx(guide.arrival.parking)}
        </p>
      </section>
      <section className="card stack">
        <h2>{t('arrival.directions')}</h2>
        <p>{tx(guide.before.directions)}</p>
        <a className="btn btn-forest" href={mapsUrl(guide.location.lat, guide.location.lon)} target="_blank" rel="noopener noreferrer">
          <Icon name="navigation" size={18} /> {t('arrival.openMap')}
        </a>
      </section>
      {guide.before.winterAccess && (
        <section className="card callout callout-lake stack">
          <h2>
            <Icon name="snowflake" /> {t('arrival.winter')}
          </h2>
          <p>{tx(guide.before.winterAccess)}</p>
        </section>
      )}
      <section className="card stack">
        <h2>{t('arrival.bring')}</h2>
        <ul className="ticks">
          {guide.before.bring.map((b, i) => (
            <li key={i}>{tx(b)}</li>
          ))}
        </ul>
      </section>
    </article>
  )
}

export function Wifi() {
  const { t, tx } = useI18n()
  const { guide } = useGuide()
  return (
    <article className="section-pad stack">
      <SectionHeader id="wifi" icon="wifi" />
      <div className="card wifi-card stack">
        <div>
          <p className="eyebrow">{t('wifi.network')}</p>
          <p className="wifi-value">{guide.wifi.ssid}</p>
        </div>
        <div>
          <p className="eyebrow">{t('wifi.password')}</p>
          <p className="wifi-value mono">{guide.wifi.password}</p>
        </div>
        <CopyButton value={guide.wifi.password} label={t('wifi.copyPassword')} onCopied={() => track({ type: 'copy', guide: guide.slug, what: 'wifi' })} />
      </div>
      {guide.wifi.note && <p className="card">{tx(guide.wifi.note)}</p>}
      <p className="muted small">{t('wifi.tip')}</p>
    </article>
  )
}

export function House() {
  const { t, tx } = useI18n()
  const { guide, link } = useGuide()
  return (
    <article className="section-pad stack">
      <SectionHeader id="house" icon="house" lead={tx(guide.house.intro)} />
      <section className="card stack">
        <h2>{t('house.amenities')}</h2>
        <ul className="amenities">
          {guide.house.amenities.map((a, i) => (
            <li key={i}>
              <Icon name={a.icon} size={20} />
              <span>{tx(a.label)}</span>
            </li>
          ))}
        </ul>
      </section>
      <h2 className="section-sub">{t('house.modules')}</h2>
      <nav className="chips" aria-label={t('house.modules')}>
        {guide.house.modules.map((ref) => {
          const m = modules[ref.id]
          return m ? (
            <a key={m.id} className="chip" href={`#mod-${m.id}`} onClick={(e) => scrollToModule(e, m.id)}>
              <Icon name={m.icon} size={16} /> {tx(m.title)}
            </a>
          ) : null
        })}
      </nav>
      {guide.house.modules.map((ref) => {
        const m = modules[ref.id]
        if (!m) return null
        return (
          <ModuleCard key={m.id} module={m} note={ref.note}>
            {m.id === 'spa' && (
              <a className="btn btn-forest" href={link('spa')}>
                <Icon name="droplet" size={18} /> {t('spa.checksTitle')}
              </a>
            )}
          </ModuleCard>
        )
      })}
    </article>
  )
}

// Les liens d'ancre ne peuvent pas utiliser le hash (déjà pris par le routeur).
function scrollToModule(e: React.MouseEvent, id: string) {
  e.preventDefault()
  document.getElementById(`mod-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function Rules() {
  const { t, tx } = useI18n()
  const { guide } = useGuide()
  return (
    <article className="section-pad stack">
      <SectionHeader id="rules" icon="list-checks" />
      <ul className="rules card">
        {guide.rules.map((r, i) => (
          <li key={i}>
            <span className="rule-icon">
              <Icon name={r.icon} size={22} />
            </span>
            <span>{tx(r.text)}</span>
          </li>
        ))}
      </ul>
      <p className="muted small">{t('boarding.guests', { n: guide.capacity })}</p>
    </article>
  )
}

export function Departure() {
  const { t, tx } = useI18n()
  const { guide } = useGuide()
  const key = `cg.checklist.${guide.slug}`
  const [done, setDone] = useState<number[]>(() => load(key, []))
  useEffect(() => {
    save(key, done)
  }, [key, done])
  const total = guide.departure.checklist.length
  const toggle = (i: number) => setDone((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]))
  return (
    <article className="section-pad stack">
      <SectionHeader id="departure" icon="door-open" lead={t('departure.checkOut', { time: guide.stay.checkOut })} />
      <div className="card stack">
        <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done.length} aria-label={t('departure.progress', { done: done.length, total })}>
          <span style={{ width: `${(done.length / total) * 100}%` }} />
        </div>
        <p className="small muted" aria-live="polite">
          {done.length === total ? t('departure.allDone') : t('departure.progress', { done: done.length, total })}
        </p>
        <ul className="checklist">
          {guide.departure.checklist.map((item, i) => (
            <li key={i}>
              <label>
                <input type="checkbox" checked={done.includes(i)} onChange={() => toggle(i)} />
                <span>{tx(item)}</span>
              </label>
            </li>
          ))}
        </ul>
        {done.length > 0 && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDone([])}>
            {t('departure.reset')}
          </button>
        )}
      </div>
      {guide.departure.note && <p className="card">{tx(guide.departure.note)}</p>}
    </article>
  )
}

function CallCard({ n, primary }: { n: EmergencyNumber; primary?: boolean }) {
  const { t, tx } = useI18n()
  const isSms = n.dial.startsWith('sms:')
  return (
    <li className={`call ${primary ? 'call-primary' : ''}`}>
      <div>
        <p className="call-label">{tx(n.label)}</p>
        <p className="small call-desc">{tx(n.description)}</p>
      </div>
      <a className={`btn ${primary ? 'btn-danger' : 'btn-forest'}`} href={isSms ? n.dial : `tel:${n.dial}`}>
        <Icon name={isSms ? 'message-circle' : 'phone'} size={18} />
        {isSms ? t('emergency.text', { n: n.number }) : t('emergency.call', { n: n.number })}
      </a>
    </li>
  )
}

export function Emergency() {
  const { t, tx } = useI18n()
  const { guide, country } = useGuide()
  const poison = guide.emergency.poisonCentre ? country.poisonCentres?.[guide.emergency.poisonCentre] : country.poisonCentre
  const h = guide.emergency.hospital
  return (
    <article className="section-pad stack">
      <SectionHeader id="emergency" icon="siren" lead={t('emergency.lead')} />
      <ul className="calls">
        {country.emergency.map((n) => (
          <CallCard key={n.id} n={n} primary={n.primary} />
        ))}
      </ul>
      {h && (
        <section className="card stack">
          <h2>
            <Icon name="hospital" /> {t('emergency.hospital')}
          </h2>
          <p>
            <strong>{h.name}</strong>
            {h.city && `, ${h.city}`}
            {h.distanceKm !== undefined && ` — ${t('emergency.about', { n: h.distanceKm })}`}
          </p>
          <a
            className="btn btn-forest"
            href={h.location ? mapsUrl(h.location.lat, h.location.lon) : `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${h.name} ${h.city}`)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="navigation" size={18} /> {t('common.directions')}
          </a>
        </section>
      )}
      <section className="card stack">
        <h2>{t('emergency.poison')}</h2>
        {poison ? (
          <ul className="calls">
            <CallCard n={poison} />
          </ul>
        ) : (
          country.poisonDirectory && (
            <p>
              {t('emergency.poisonList')}{' '}
              <a href={country.poisonDirectory.url} target="_blank" rel="noopener noreferrer">
                {tx(country.poisonDirectory.label)}
              </a>
            </p>
          )
        )}
      </section>
      {guide.emergency.notes.length > 0 && (
        <section className="card stack">
          <h2>{t('emergency.notes')}</h2>
          <ul className="ticks">
            {guide.emergency.notes.map((n, i) => (
              <li key={i}>{tx(n)}</li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}
