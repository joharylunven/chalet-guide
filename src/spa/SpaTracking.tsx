// Écran exploitant « Suivi du spa » (démo) : autocontrôles, historique,
// seuils de l'exploitant, rappels d'entretien, affichage voyageurs, export.
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { config } from '../config'
import { guides } from '../content'
import { countries } from '../countries'
import { useI18n } from '../i18n'
import { href } from '../router'
import { Icon } from '../components/Icon'
import { QrCode, absoluteUrl } from '../components/QrCode'
import { SiteLayout } from '../pages/SiteLayout'
import type { Text } from '../content/schema'
import { SPA_PARAMS, SPA_SUPPLIER, SPA_TASKS } from './config'
import { SpaChecks, formatValue } from './SpaChecks'
import { exampleLog, latest, nextDue, rangeStatus, toCsv, useSpaLog, type ParamValue, type SpaEntry, type SpaLog } from './store'

const spaGuides = guides.filter((g) => g.house.modules.some((m) => m.id === 'spa'))
const HISTORY_PREVIEW = 6

function nowLocal(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

const toNum = (s: string): number | null => {
  const n = Number(s.replace(',', '.'))
  return s.trim() === '' || Number.isNaN(n) ? null : n
}

/**
 * Champ numérique qui garde le texte saisi (« 7, » en cours de frappe) et
 * affiche la décimale de la langue ; la valeur stockée reste un nombre.
 */
function NumberField({ value, onChange, label }: { value: number | null; onChange: (v: number | null) => void; label: string }) {
  const { lang } = useI18n()
  const show = (v: number | null) => (v === null ? '' : lang === 'fr' ? String(v).replace('.', ',') : String(v))
  const [text, setText] = useState(() => show(value))
  const [focused, setFocused] = useState(false)
  useEffect(() => {
    if (!focused) setText(show(value))
    // show dépend de lang, déjà dans les dépendances
  }, [value, focused, lang])
  return (
    <input
      inputMode="decimal"
      aria-label={label}
      value={text}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(e) => {
        setText(e.target.value)
        onChange(toNum(e.target.value))
      }}
    />
  )
}

export default function SpaTracking({ slug }: { slug?: string }) {
  const { t, tx, lang } = useI18n()
  const guide = spaGuides.find((g) => g.slug === slug) ?? spaGuides[0]

  useEffect(() => {
    document.title = `${t('spa.title')} — ${config.productName}`
  }, [t])

  if (!guide) {
    return (
      <SiteLayout active="dashboard">
        <main className="page">
          <p>{t('spa.noSpa')}</p>
        </main>
      </SiteLayout>
    )
  }

  const country = countries[guide.country]
  return (
    <SiteLayout active="dashboard">
      <main className="page spa-page" id="main">
        <header className="spa-head no-print">
          <p className="badge badge-demo">{t('common.demo')}</p>
          <h1>{t('spa.title')}</h1>
          <p className="muted">{t('spa.lead')}</p>
          <label className="spa-select">
            <span>{t('spa.property')}</span>
            <select value={guide.slug} onChange={(e) => (window.location.hash = href('tableau-de-bord', 'spa', e.target.value))}>
              {spaGuides.map((g) => (
                <option key={g.slug} value={g.slug}>
                  {g.name} — {tx(countries[g.country].name)}
                </option>
              ))}
            </select>
          </label>
          <p className="spa-notice" role="note">
            <Icon name="info" size={18} />
            <span>{tx(country.spaNotice)}</span>
          </p>
          <p className="small muted">{t('spa.demoNotice')}</p>
        </header>
        <Tracker key={guide.slug} slug={guide.slug} name={guide.name} locale={country.locale[lang]} notice={country.spaNotice} />
      </main>
    </SiteLayout>
  )
}

type Tab = 'check' | 'history' | 'upkeep' | 'settings'
const TABS: { id: Tab; icon: string }[] = [
  { id: 'check', icon: 'droplet' },
  { id: 'history', icon: 'list-checks' },
  { id: 'upkeep', icon: 'clock' },
  { id: 'settings', icon: 'settings' },
]

function Tracker({ slug, name, locale, notice }: { slug: string; name: string; locale: string; notice: Text }) {
  const { t, tx, lang } = useI18n()
  const [log, update] = useSpaLog(slug)
  const [tab, setTab] = useState<Tab>('check')
  const overdue = SPA_TASKS.filter((task) => {
    const due = nextDue(log.tasks[task.id] ?? { everyDays: null, lastDone: null })
    return due !== null && due.getTime() < Date.now()
  }).length

  return (
    <>
      <Summary log={log} locale={locale} overdue={overdue} onGo={setTab} />
      <div className="spa-tabs no-print" role="tablist" aria-label={t('spa.title')}>
        {TABS.map((x) => (
          <button key={x.id} type="button" role="tab" id={`spa-tab-${x.id}`} aria-selected={tab === x.id} aria-controls={`spa-panel-${x.id}`} onClick={() => setTab(x.id)}>
            <Icon name={x.icon} size={18} />
            <span>{t(`spa.tabs.${x.id}`)}</span>
            {x.id === 'upkeep' && overdue > 0 && <span className="spa-tab-count">{overdue}</span>}
          </button>
        ))}
      </div>

      <div className="spa-panel no-print" role="tabpanel" id={`spa-panel-${tab}`} aria-labelledby={`spa-tab-${tab}`}>
        {tab === 'check' && (
          <NewCheck
            onSave={(e) => {
              update((l) => ({ ...l, entries: [...l.entries, e] }))
            }}
          />
        )}
        {tab === 'history' && <History log={log} locale={locale} onDelete={(id) => update((l) => ({ ...l, entries: l.entries.filter((e) => e.id !== id) }))} />}
        {tab === 'upkeep' && <Tasks log={log} update={update} locale={locale} />}
        {tab === 'settings' && (
          <div className="spa-grid">
            <div className="spa-col">
              <section className="card stack" aria-labelledby="spa-guests">
                <h2 id="spa-guests">{t('spa.guests')}</h2>
                <label className="switch">
                  <input type="checkbox" checked={log.publish} onChange={(e) => update((l) => ({ ...l, publish: e.target.checked }))} />
                  <span>{t('spa.publish')}</span>
                </label>
                <SpaChecks log={log} locale={locale} />
                <a className="btn" href={href('demo', slug, 'spa')}>
                  <Icon name="external-link" size={18} /> {t('spa.openGuest')}
                </a>
                <Poster slug={slug} name={name} />
              </section>
            </div>
            <div className="spa-col">
              <Thresholds log={log} update={update} />
              <section className="card stack" aria-labelledby="spa-export">
                <h2 id="spa-export">{t('spa.export')}</h2>
                <div className="spa-actions">
                  <button type="button" className="btn btn-forest" onClick={() => downloadCsv(log, slug, lang, t('spa.example'))}>
                    <Icon name="receipt" size={18} /> {t('spa.csv')}
                  </button>
                  <button type="button" className="btn" onClick={() => printSection('log')}>
                    <Icon name="printer" size={18} /> {t('spa.print')}
                  </button>
                </div>
              </section>
              <Supplies log={log} update={update} />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  if (window.confirm(t('spa.resetConfirm'))) update(() => exampleLog())
                }}
              >
                {t('spa.reset')}
              </button>
            </div>
          </div>
        )}
      </div>

      <PrintableLog log={log} name={name} locale={locale} notice={tx(notice)} />
      <section className="spa-print-poster" aria-hidden="true">
        <h1>{name}</h1>
        <QrCode value={absoluteUrl(href('demo', slug, 'spa'))} label={t('spa.posterScan')} className="spa-poster-qr" />
        <p>{t('spa.posterScan')}</p>
      </section>
    </>
  )
}

/** « État du jour » : ce que l'exploitant doit savoir en un coup d'œil. */
function Summary({ log, locale, overdue, onGo }: { log: SpaLog; locale: string; overdue: number; onGo: (t: Tab) => void }) {
  const { t } = useI18n()
  const last = latest(log)
  // « Du jour » = même date du calendrier, pas seulement moins de 24 h.
  const today = last ? new Date(last.at).toDateString() === new Date().toDateString() : false
  const outCount = last ? SPA_PARAMS.filter((p) => rangeStatus(last.values[p.id], log.thresholds[p.id]) === 'out').length : 0
  const when = last
    ? new Intl.DateTimeFormat(locale, today ? { timeStyle: 'short' } : { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(last.at))
    : null
  const items = [
    {
      tab: 'check' as Tab,
      tone: !last || !today ? 'todo' : outCount ? 'warn' : 'ok',
      icon: !last || !today ? 'info' : outCount ? 'warning' : 'circle-check',
      text: !last ? t('spa.sumNoCheck') : !today ? t('spa.sumOld', { date: when! }) : outCount ? t('spa.sumOut', { n: outCount }) : t('spa.sumOk', { date: when! }),
    },
    {
      tab: 'upkeep' as Tab,
      tone: overdue ? 'warn' : 'ok',
      icon: overdue ? 'warning' : 'circle-check',
      text: overdue ? t('spa.sumOverdue', { n: overdue }) : t('spa.sumUpkeepOk'),
    },
    {
      tab: 'settings' as Tab,
      tone: log.publish ? 'ok' : 'todo',
      icon: log.publish ? 'eye' : 'eye-off',
      text: log.publish ? t('spa.sumPublished') : t('spa.sumHidden'),
    },
  ]
  return (
    <ul className="spa-summary no-print" aria-label={t('spa.sumTitle')}>
      {items.map((it) => (
        <li key={it.tab}>
          <button type="button" className={`spa-sum is-${it.tone}`} onClick={() => onGo(it.tab)}>
            <Icon name={it.icon} size={18} />
            <span>{it.text}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

function NewCheck({ onSave }: { onSave: (e: SpaEntry) => void }) {
  const { t, tx } = useI18n()
  const [at, setAt] = useState(nowLocal)
  const [values, setValues] = useState<Record<string, string>>({})
  const [clarity, setClarity] = useState<'' | 'yes' | 'no'>('')
  const [bathers, setBathers] = useState('')
  const [actions, setActions] = useState('')
  const [saved, setSaved] = useState(false)

  function submit(e: FormEvent) {
    e.preventDefault()
    const vals: Record<string, ParamValue> = {}
    for (const p of SPA_PARAMS) vals[p.id] = p.kind === 'bool' ? (clarity === '' ? null : clarity === 'yes') : toNum(values[p.id] ?? '')
    onSave({ id: crypto.randomUUID(), at: new Date(at).toISOString(), values: vals, bathers: toNum(bathers), actions: actions.trim() })
    setValues({})
    setClarity('')
    setBathers('')
    setActions('')
    setAt(nowLocal())
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2500)
  }

  return (
    <form className="card stack no-print" onSubmit={submit} aria-labelledby="spa-new">
      <h2 id="spa-new">{t('spa.newCheck')}</h2>
      <label className="field">
        <span>{t('spa.date')}</span>
        <input type="datetime-local" required value={at} onChange={(e) => setAt(e.target.value)} />
      </label>
      <div className="field-grid field-grid-sm">
        {SPA_PARAMS.filter((p) => p.kind === 'number').map((p) => (
          <label key={p.id} className="field">
            <span>
              {tx(p.label)} {p.unit && <span className="muted">({p.unit})</span>}
            </span>
            <input inputMode="decimal" value={values[p.id] ?? ''} onChange={(e) => setValues((v) => ({ ...v, [p.id]: e.target.value }))} pattern="[0-9]+([.,][0-9]+)?" />
          </label>
        ))}
        <label className="field">
          <span>{t('spa.bathers')}</span>
          <input inputMode="numeric" pattern="[0-9]*" value={bathers} onChange={(e) => setBathers(e.target.value)} />
        </label>
      </div>
      {SPA_PARAMS.filter((p) => p.kind === 'bool').map((p) => (
        <fieldset key={p.id} className="field">
          <legend>{tx(p.label)}</legend>
          <div className="radio-row">
            {(['yes', 'no'] as const).map((v) => (
              <label key={v}>
                <input type="radio" name={p.id} checked={clarity === v} onChange={() => setClarity(v)} /> {t(`spa.${v}`)}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <label className="field">
        <span>{t('spa.actions')}</span>
        <textarea rows={2} value={actions} placeholder={t('spa.actionsHint')} onChange={(e) => setActions(e.target.value)} />
      </label>
      <button type="submit" className="btn btn-primary">
        <Icon name="check" size={18} /> {t('spa.save')}
      </button>
      <p className="small spa-saved" aria-live="polite">
        {saved ? t('spa.saved') : ''}
      </p>
    </form>
  )
}

function History({ log, locale, onDelete }: { log: SpaLog; locale: string; onDelete: (id: string) => void }) {
  const { t, tx, lang } = useI18n()
  const [all, setAll] = useState(false)
  const sorted = useMemo(() => [...log.entries].sort((a, b) => b.at.localeCompare(a.at)), [log.entries])
  const shown = all ? sorted : sorted.slice(0, HISTORY_PREVIEW)
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <section className="card stack no-print" aria-labelledby="spa-history">
      <h2 id="spa-history">{t('spa.history')}</h2>
      {sorted.length === 0 && <p className="muted">{t('spa.empty')}</p>}
      <ol className="spa-history">
        {shown.map((e) => (
          <li key={e.id}>
            <div className="spa-history-head">
              <div className="spa-history-date">
                <strong>{dateFmt.format(new Date(e.at))}</strong>
                {e.example && <span className="badge badge-demo">{t('spa.example')}</span>}
              </div>
              <button type="button" className="icon-btn icon-btn-sm" onClick={() => onDelete(e.id)} aria-label={t('spa.delete')} title={t('spa.delete')}>
                <Icon name="x" size={16} />
              </button>
            </div>
            <dl className="spa-values spa-values-compact">
              {SPA_PARAMS.map((p) => {
                const status = rangeStatus(e.values[p.id], log.thresholds[p.id])
                return (
                  <div key={p.id} className={status ? `is-${status}` : undefined}>
                    <dt>{tx(p.label)}</dt>
                    <dd>
                      {formatValue(e.values[p.id], p.unit, lang, t('spa.yes'), t('spa.no'))}
                      {status === 'out' && (
                        <>
                          {' '}
                          <Icon name="warning" size={14} />
                          <span className="sr-only">{t('spa.out')}</span>
                        </>
                      )}
                    </dd>
                  </div>
                )
              })}
              <div>
                <dt>{t('spa.bathers')}</dt>
                <dd>{e.bathers ?? '—'}</dd>
              </div>
            </dl>
            {e.actions && (
              <p className="small">
                <strong>
                  {t('spa.actions')}
                  {t('common.colon')}
                </strong>{' '}
                {e.actions}
              </p>
            )}
          </li>
        ))}
      </ol>
      {!all && sorted.length > HISTORY_PREVIEW && (
        <button type="button" className="btn btn-sm" onClick={() => setAll(true)}>
          {t('spa.more', { n: sorted.length })}
        </button>
      )}
    </section>
  )
}

type Update = (fn: (l: SpaLog) => SpaLog) => void

function Thresholds({ log, update }: { log: SpaLog; update: Update }) {
  const { t, tx } = useI18n()
  const numeric = SPA_PARAMS.filter((p) => p.kind === 'number')
  const set = (id: string, bound: 'min' | 'max', v: number | null) =>
    update((l) => ({ ...l, thresholdsAreExample: false, thresholds: { ...l.thresholds, [id]: { ...l.thresholds[id], [bound]: v } } }))

  return (
    <section className="card stack no-print" aria-labelledby="spa-thresholds">
      <h2 id="spa-thresholds">{t('spa.thresholds')}</h2>
      <p className="small muted">{t('spa.thresholdsLead')}</p>
      {log.thresholdsAreExample && (
        <p className="spa-example-warning" role="note">
          <Icon name="warning" size={16} /> {t('spa.exampleWarning')}
        </p>
      )}
      <table className="spa-table">
        <thead>
          <tr>
            <th scope="col" />
            <th scope="col">{t('spa.min')}</th>
            <th scope="col">{t('spa.max')}</th>
          </tr>
        </thead>
        <tbody>
          {numeric.map((p) => (
            <tr key={p.id}>
              <th scope="row">
                {tx(p.label)} {p.unit && <span className="muted">({p.unit})</span>}
              </th>
              {(['min', 'max'] as const).map((b) => (
                <td key={b}>
                  <NumberField
                    label={`${tx(p.label)} — ${t(`spa.${b}`)}`}
                    value={log.thresholds[p.id]?.[b] ?? null}
                    onChange={(v) => set(p.id, b, v)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="spa-actions">
        <button
          type="button"
          className="btn btn-sm"
          onClick={() =>
            update((l) => ({
              ...l,
              thresholdsAreExample: true,
              thresholds: Object.fromEntries(numeric.map((p) => [p.id, { min: p.example?.min ?? null, max: p.example?.max ?? null }])),
            }))
          }
        >
          {t('spa.useExample')}
        </button>
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          onClick={() => update((l) => ({ ...l, thresholdsAreExample: false, thresholds: Object.fromEntries(numeric.map((p) => [p.id, { min: null, max: null }])) }))}
        >
          {t('spa.clear')}
        </button>
      </div>
    </section>
  )
}

function Tasks({ log, update, locale }: { log: SpaLog; update: Update; locale: string }) {
  const { t, tx } = useI18n()
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' })
  const now = Date.now()

  return (
    <section className="card stack no-print" aria-labelledby="spa-tasks">
      <h2 id="spa-tasks">{t('spa.tasks')}</h2>
      <ul className="spa-tasks">
        {SPA_TASKS.map((task) => {
          const st = log.tasks[task.id] ?? { everyDays: null, lastDone: null }
          const due = nextDue(st)
          const state = !st.everyDays ? 'none' : !due ? 'none' : due.getTime() < now ? 'overdue' : due.getTime() - now < 7 * 86400000 ? 'soon' : 'ok'
          return (
            <li key={task.id} className={`spa-task is-${state}`}>
              <div className="spa-task-main">
                <strong>{tx(task.label)}</strong>
                <span className="small muted">
                  {t('spa.lastDone')}
                  {t('common.colon')} {st.lastDone ? dateFmt.format(new Date(st.lastDone)) : t('spa.never')}
                  {due && (
                    <>
                      {' · '}
                      {t('spa.next')}
                      {t('common.colon')} {dateFmt.format(due)}
                    </>
                  )}
                </span>
                <span className={`task-state task-${state}`}>
                  {state === 'overdue' ? t('spa.overdue') : state === 'soon' ? t('spa.dueSoon') : state === 'ok' ? t('spa.upToDate') : t('spa.notPlanned')}
                </span>
              </div>
              <div className="spa-task-controls">
                <label className="every">
                  <span>{t('spa.every')}</span>
                  <input
                    inputMode="numeric"
                    aria-label={`${tx(task.label)} — ${t('spa.every')} (${t('spa.days')})`}
                    value={st.everyDays ?? ''}
                    onChange={(e) => update((l) => ({ ...l, tasks: { ...l.tasks, [task.id]: { ...st, everyDays: toNum(e.target.value), example: false } } }))}
                  />
                  <span>{t('spa.days')}</span>
                </label>
                {st.example && <span className="small muted">({t('spa.exampleFreq')})</span>}
                <button type="button" className="btn btn-sm" onClick={() => update((l) => ({ ...l, tasks: { ...l.tasks, [task.id]: { ...st, lastDone: new Date().toISOString() } } }))}>
                  <Icon name="check" size={16} /> {t('spa.done')}
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function Poster({ slug, name }: { slug: string; name: string }) {
  const { t } = useI18n()
  const url = absoluteUrl(href('demo', slug, 'spa'))
  return (
    <div className="stack">
      <h3>{t('spa.posterTitle')}</h3>
      <p className="small muted">{t('spa.posterLead')}</p>
      <div className="spa-poster">
        <p className="eyebrow">{name}</p>
        <QrCode value={url} label={t('spa.posterScan')} className="spa-poster-qr" />
        <p className="spa-poster-text">{t('spa.posterScan')}</p>
      </div>
      <button type="button" className="btn btn-sm" onClick={() => printSection('poster')}>
        <Icon name="printer" size={16} /> {t('spa.printPoster')}
      </button>
    </div>
  )
}

function Supplies({ log, update }: { log: SpaLog; update: Update }) {
  const { t, tx } = useI18n()
  const url = log.supplierUrl || SPA_SUPPLIER.url
  const safe = /^https:\/\//i.test(url)
  return (
    <section className="card stack no-print" aria-labelledby="spa-supplies">
      <h2 id="spa-supplies">{t('spa.supplies')}</h2>
      <label className="field">
        <span>{t('spa.supplierUrl')}</span>
        <input type="url" placeholder="https://" value={log.supplierUrl} onChange={(e) => update((l) => ({ ...l, supplierUrl: e.target.value.trim() }))} />
      </label>
      <p className="small muted">{t('spa.supplierHint')}</p>
      {safe && (
        <a className="btn btn-forest" href={url} target="_blank" rel="noopener noreferrer">
          <Icon name="shopping-basket" size={18} /> {tx(SPA_SUPPLIER.label)}
        </a>
      )}
    </section>
  )
}

/** Version imprimable du carnet (visible seulement à l'impression). */
function PrintableLog({ log, name, locale, notice }: { log: SpaLog; name: string; locale: string; notice: string }) {
  const { t, lang, tx } = useI18n()
  const sorted = [...log.entries].sort((a, b) => a.at.localeCompare(b.at))
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' })
  return (
    <section className="spa-print" data-print="log" aria-hidden="true">
      <h1>{t('spa.printTitle', { name })}</h1>
      <p>{t('spa.printedOn', { date: new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date()) })}</p>
      <p>{notice}</p>
      <table>
        <thead>
          <tr>
            <th>{t('spa.date')}</th>
            {SPA_PARAMS.map((p) => (
              <th key={p.id}>
                {tx(p.label)}
                {p.unit && ` (${p.unit})`}
              </th>
            ))}
            <th>{t('spa.bathers')}</th>
            <th>{t('spa.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((e) => (
            <tr key={e.id}>
              <td>
                {dateFmt.format(new Date(e.at))}
                {e.example && ` (${t('spa.example')})`}
              </td>
              {SPA_PARAMS.map((p) => (
                <td key={p.id}>{formatValue(e.values[p.id], '', lang, t('spa.yes'), t('spa.no'))}</td>
              ))}
              <td>{e.bathers ?? ''}</td>
              <td>{e.actions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function printSection(which: 'log' | 'poster') {
  document.documentElement.dataset.print = which
  const done = () => {
    delete document.documentElement.dataset.print
    window.removeEventListener('afterprint', done)
  }
  window.addEventListener('afterprint', done)
  window.print()
}

function downloadCsv(log: SpaLog, slug: string, lang: 'fr' | 'en', exampleLabel: string) {
  const blob = new Blob([toCsv(log, lang, exampleLabel)], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `carnet-spa-${slug}-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(a.href)
}
