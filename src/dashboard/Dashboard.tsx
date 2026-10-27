// Tableau de bord de l'hôte (démo) : statistiques issues des vraies
// interactions faites dans les guides de démo (ce navigateur), ou d'un jeu
// d'exemple fictif clairement étiqueté.
import { useEffect, useMemo, useState } from 'react'
import { config } from '../config'
import { guides } from '../content'
import { useI18n } from '../i18n'
import { href } from '../router'
import { load, save } from '../storage'
import { readEvents } from '../analytics/track'
import { Icon } from '../components/Icon'
import { Segmented } from '../components/controls'
import { SiteLayout } from '../pages/SiteLayout'
import { BarList, ColumnChart } from './charts'
import { compute, monthReport, sampleEvents } from './stats'
import { OPTION_CATALOG } from '../apercu/draft'
import './dashboard.css'

type Source = 'mine' | 'example'
/** Minutes de messagerie évitées par question répondue (hypothèse affichée). */
const MINUTES_PER_QUESTION = 3

// Titre générique du catalogue d'abord (identique d'un hébergement à l'autre), sinon celui d'un guide.
const optionTitles = new Map([...guides.flatMap((g) => g.options.map((o) => [o.id, o.title] as const)), ...OPTION_CATALOG.map((o) => [o.id, o.title] as const)])

export default function Dashboard() {
  const { t, tx, lang } = useI18n()
  const [mine] = useState(readEvents)
  const [source, setSource] = useState<Source>(() => load<Source>('cg.dash.source', mine.length ? 'mine' : 'example'))
  const [guide, setGuide] = useState<string>('all')
  const [days, setDays] = useState<7 | 30>(30)

  useEffect(() => {
    document.title = `${t('nav.dashboard')} — ${config.productName}`
  }, [t])
  useEffect(() => {
    save('cg.dash.source', source)
  }, [source])

  const example = useMemo(() => sampleEvents(guides.map((g) => ({ slug: g.slug, booking: g.booking }))), [])
  const events = source === 'mine' ? mine : example
  const stats = useMemo(() => compute(events, { guide, days }), [events, guide, days])
  const month = useMemo(() => monthReport(events, guide), [events, guide])
  const locale = lang === 'fr' ? 'fr-CA' : 'en-CA'
  const dayFmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' })
  const monthName = new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date())
  const answeredPct = stats.questions ? Math.round((stats.answered / stats.questions) * 100) : 0
  const sectionTitle = (id: string) => t(`sections.${id}`)

  return (
    <SiteLayout active="dashboard">
      <main className="page dash" id="main">
        <header className="dash-head">
          <h1>{t('nav.dashboard')}</h1>
          <p className="muted">{t('dash.lead')}</p>
        </header>

        <div className="dash-filters" role="group" aria-label={t('dash.filters')}>
          <Segmented
            label={t('dash.source')}
            value={source}
            onChange={setSource}
            options={[
              { value: 'mine', label: t('dash.mine') },
              { value: 'example', label: t('dash.example') },
            ]}
          />
          <label className="dash-select">
            <span className="sr-only">{t('dash.guide')}</span>
            <select value={guide} onChange={(e) => setGuide(e.target.value)}>
              <option value="all">{t('dash.allGuides')}</option>
              {guides.map((g) => (
                <option key={g.slug} value={g.slug}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
          <Segmented
            label={t('dash.period')}
            value={String(days) as '7' | '30'}
            onChange={(v) => setDays(Number(v) as 7 | 30)}
            options={[
              { value: '7', label: t('dash.days', { n: 7 }) },
              { value: '30', label: t('dash.days', { n: 30 }) },
            ]}
          />
        </div>

        <p className={`dash-notice ${source === 'example' ? 'is-example' : ''}`} role="note">
          <Icon name={source === 'example' ? 'warning' : 'info'} size={18} />
          <span className="dash-notice-text">{source === 'example' ? t('dash.exampleNotice') : mine.length ? t('dash.mineNotice') : t('dash.mineEmpty')}</span>
          {source === 'mine' && !mine.length && (
            <a href={href('demo')} className="dash-notice-link">
              {t('demoIndex.title')} →
            </a>
          )}
        </p>

        <section className="card dash-hero" aria-labelledby="dash-hero-title">
          <p className="eyebrow" id="dash-hero-title">
            {t('dash.monthTitle', { month: monthName })}
          </p>
          <p className="dash-hero-line">
            <span className="dash-hero-number">{month.answered}</span>
            <span>{t('dash.monthAnswered', { n: month.answered })}</span>
          </p>
          <p className="muted small">
            {t('dash.monthSaved', { time: formatDuration(month.answered * MINUTES_PER_QUESTION), per: MINUTES_PER_QUESTION })} · {t('dash.monthOpens', { n: month.opens })} ·{' '}
            {t('dash.monthOptions', { n: month.options })}
          </p>
        </section>

        <ul className="dash-tiles">
          <Tile label={t('dash.tileOpens')} value={stats.opens} />
          <Tile label={t('dash.tileQuestions')} value={stats.questions} sub={stats.questions ? t('dash.answeredPct', { n: answeredPct }) : undefined} />
          <Tile label={t('dash.tileOptions')} value={stats.options.reduce((s, o) => s + o.n, 0)} />
          <Tile label={t('dash.tileCopies')} value={stats.copies} />
        </ul>

        <section className="card" aria-labelledby="dash-opens">
          <h2 id="dash-opens">{t('dash.opensPerDay')}</h2>
          <ColumnChart
            label={t('dash.opensPerDay')}
            data={stats.perDay.map((d) => {
              const label = dayFmt.format(new Date(`${d.date}T12:00`))
              return { key: d.date, label, value: d.n, tip: t('dash.tipOpens', { date: label, n: d.n }) }
            })}
            xLabels={(i) => (stats.perDay.length - 1 - i) % 7 === 0}
          />
        </section>

        <div className="dash-grid">
          <section className="card" aria-labelledby="dash-sections">
            <h2 id="dash-sections">{t('dash.sections')}</h2>
            <BarList
              label={t('dash.views')}
              empty={t('dash.none')}
              rows={stats.sections.slice(0, 8).map((s) => ({ key: s.id, label: sectionTitle(s.id), text: sectionTitle(s.id), value: s.n }))}
            />
          </section>
          <section className="card" aria-labelledby="dash-options">
            <h2 id="dash-options">{t('dash.options')}</h2>
            <BarList
              label={t('dash.requests')}
              empty={t('dash.none')}
              rows={stats.options.map((o) => {
                const title = tx(optionTitles.get(o.id)) || o.id
                const parts = [o.direct && t('dash.paid', { n: o.direct }), o.airbnb && t('dash.viaAirbnb', { n: o.airbnb })].filter(Boolean)
                return { key: o.id, label: title, text: title, value: o.n, sub: parts.join(' · ') }
              })}
            />
          </section>
        </div>

        <section className="card" aria-labelledby="dash-questions">
          <h2 id="dash-questions">{t('dash.questions')}</h2>
          {stats.topQuestions.length ? (
            <ul className="dash-questions">
              {stats.topQuestions.map((q) => (
                <li key={q.q}>
                  <span className="dash-q">« {q.q} »</span>
                  <span className="dash-q-n">× {q.n}</span>
                  <span className={`dash-status ${q.answered ? 'is-ok' : 'is-todo'}`}>
                    <Icon name={q.answered ? 'circle-check' : 'send'} size={16} />
                    {q.answered ? t('dash.answered') : t('dash.forwarded')}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">{t('dash.none')}</p>
          )}
          <p className="small muted">{t('dash.questionsHint')}</p>
        </section>

        <a className="card dash-link" href={href('tableau-de-bord', 'spa')}>
          <Icon name="waves" size={22} />
          <span>
            <strong>{t('nav.spa')}</strong>
            <span className="small muted"> — {t('spa.lead')}</span>
          </span>
          <Icon name="chevron-left" size={18} className="dash-link-arrow" />
        </a>
      </main>
    </SiteLayout>
  )
}

/** 228 min → « 3 h 48 ». */
function formatDuration(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`
}

function Tile({ label, value, sub }: { label: string; value: number; sub?: string }) {
  const { lang } = useI18n()
  return (
    <li className="card dash-tile">
      <span className="dash-tile-label">{label}</span>
      <span className="dash-tile-value">{new Intl.NumberFormat(lang === 'fr' ? 'fr-CA' : 'en-CA').format(value)}</span>
      {sub && <span className="small muted">{sub}</span>}
    </li>
  )
}
