// Générateur d'aperçu (#/apercu) : outil de prospection. Recherche dans le
// registre public assaini, pré-remplissage, édition par section, aperçu mobile
// en direct (iframe), complétude, export / import JSON. Rien n'est publié.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { config } from '../config'
import { modules } from '../content'
import { useI18n } from '../i18n'
import { href } from '../router'
import { Icon } from '../components/Icon'
import { Segmented } from '../components/controls'
import { SiteLayout } from '../pages/SiteLayout'
import { loadIndex, loadRecord, search, type IndexData, type SearchHit } from './dataset'
import {
  OPTION_CATALOG, QC_MODULES, TEMPLATES, checks, completion, exportJson, fromRecord, importJson, untranslated, useDraft,
  type Bi, type Draft, type Section,
} from './draft'
import './apercu.css'

type Lang = 'fr' | 'en'

export default function Apercu({ ficheId }: { ficheId?: string }) {
  const { t } = useI18n()
  const [draft, setDraft] = useDraft()
  const [searching, setSearching] = useState(!draft)

  useEffect(() => {
    document.title = `${t('apercu.title')} — ${config.productName}`
  }, [t])

  // Lien direct #/apercu/fiche/<id> (depuis la liste de prospection locale).
  useEffect(() => {
    if (!ficheId) return
    let alive = true
    loadIndex()
      .then((idx) => loadRecord(idx, ficheId))
      .then((rec) => {
        if (!alive || !rec) return
        if (!draft || draft.source?.id === rec.id || window.confirm(t('apercu.replaceConfirm'))) {
          if (draft?.source?.id !== rec.id) setDraft(fromRecord(rec))
          setSearching(false)
        }
        window.location.replace(href('apercu'))
      })
      .catch(() => undefined)
    return () => {
      alive = false
    }
    // Une seule fois par identifiant de fiche.
  }, [ficheId])

  return (
    <SiteLayout active="preview">
      <p className="apercu-banner" role="note">
        <Icon name="eye" size={18} /> {t('apercu.unpublished')}
      </p>
      <main className="page apercu-page" id="main">
        {searching || !draft ? (
          <SearchPanel
            hasDraft={!!draft}
            onCancel={() => setSearching(false)}
            onPick={(d) => {
              setDraft(d)
              setSearching(false)
            }}
            currentId={draft?.source?.id}
          />
        ) : (
          <Workspace draft={draft} setDraft={setDraft} onNewSearch={() => setSearching(true)} />
        )}
      </main>
    </SiteLayout>
  )
}

// --- Recherche ------------------------------------------------------------------
function SearchPanel({ onPick, onCancel, hasDraft, currentId }: { onPick: (d: Draft) => void; onCancel: () => void; hasDraft: boolean; currentId?: string }) {
  const { t } = useI18n()
  const [index, setIndex] = useState<IndexData | null>(null)
  const [error, setError] = useState(false)
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    loadIndex().then(setIndex, () => setError(true))
  }, [])

  const hits: SearchHit[] = useMemo(() => (index && q.trim().length >= 2 ? search(index, q) : []), [index, q])

  async function pick(hit: SearchHit) {
    if (!index) return
    if (hasDraft && hit.id !== currentId && !window.confirm(t('apercu.replaceConfirm'))) return
    setBusy(hit.id)
    try {
      const rec = await loadRecord(index, hit.id)
      if (rec) onPick(fromRecord(rec))
    } catch {
      setError(true)
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="apercu-search stack" aria-labelledby="apercu-title">
      <h1 id="apercu-title">{t('apercu.title')}</h1>
      <p className="muted apercu-lead">{t('apercu.lead')}</p>
      <label className="field apercu-search-field">
        <span>{t('apercu.searchLabel')}</span>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('apercu.searchPlaceholder')} autoFocus autoComplete="off" />
      </label>
      {hasDraft && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
          <Icon name="chevron-left" size={16} /> {t('common.back')}
        </button>
      )}
      {error && <p className="apercu-error">{t('apercu.loadError')}</p>}
      {!index && !error && <p className="muted">{t('apercu.searching')}</p>}
      {index && q.trim().length >= 2 && (
        <>
          <p className="small muted" aria-live="polite">
            {hits.length ? t('apercu.results', { n: hits.length }) : t('apercu.noResult')}
          </p>
          <ul className="apercu-hits">
            {hits.map((h) => (
              <li key={h.id}>
                <button type="button" className="apercu-hit" onClick={() => void pick(h)} disabled={busy !== null}>
                  <span className="apercu-hit-name">{h.nom}</span>
                  <span className="small muted">
                    {h.municipalite} · {h.region} · CITQ {h.citq || '—'}
                  </span>
                  <span className="apercu-hit-cta small">{busy === h.id ? t('apercu.loadingRecord') : t('apercu.choose')} →</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

// --- Espace de travail : éditeur + aperçu ------------------------------------------
function Workspace({ draft, setDraft, onNewSearch }: { draft: Draft; setDraft: (d: Draft | null) => void; onNewSearch: () => void }) {
  const { t, lang: uiLang } = useI18n()
  const [tab, setTab] = useState<'edit' | 'preview'>('edit')
  const [inputLang, setInputLang] = useState<Lang>('fr')
  const [importError, setImportError] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const pct = completion(draft)
  const missing = checks(draft).filter((c) => !c.done)
  const todoTranslations = untranslated(draft).length
  const patch = (p: Partial<Draft>) => setDraft({ ...draft, ...p })
  // La traduction n'a pas de section propre : on passe en saisie anglaise.
  const go = (e: React.MouseEvent, section: Section) => {
    if (section === 'translation') setInputLang('en')
    jumpTo(e, section === 'translation' ? 'identity' : section, setTab)
  }
  const dateFmt = new Intl.DateTimeFormat(uiLang === 'fr' ? 'fr-CA' : 'en-CA', { dateStyle: 'long' })

  function doExport() {
    const blob = new Blob([exportJson(draft)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `apercu-${(draft.source?.citq || 'livret').replace(/\W+/g, '')}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(a.href)
  }

  async function doImport(file: File) {
    try {
      setDraft(importJson(await file.text()))
      setImportError(false)
    } catch {
      setImportError(true)
    }
  }

  return (
    <div className="apercu-workspace">
      <header className="apercu-head">
        <div className="apercu-head-text">
          <h1>{draft.name || '—'}</h1>
          {draft.source && (
            <p className="small muted">
              {t('apercu.sourceLine', { citq: draft.source.citq || '—', region: draft.source.region })}
              {draft.source.updated && ` · ${t('apercu.sourceUpdated', { date: dateFmt.format(new Date(`${draft.source.updated}T12:00`)) })}`}
            </p>
          )}
        </div>
        <div className="apercu-head-actions">
          <button type="button" className="btn btn-sm" onClick={onNewSearch}>
            <Icon name="map-pin" size={16} /> {t('apercu.newSearch')}
          </button>
          <button type="button" className="btn btn-sm" onClick={doExport}>
            <Icon name="receipt" size={16} /> {t('apercu.export')}
          </button>
          <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()}>
            <Icon name="copy" size={16} /> {t('apercu.import')}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void doImport(f)
              e.target.value = ''
            }}
          />
        </div>
        {importError && <p className="apercu-error">{t('apercu.importError')}</p>}
      </header>

      <section className="card apercu-progress" aria-labelledby="apercu-pct">
        <div className="apercu-progress-top">
          <h2 id="apercu-pct">{t('apercu.completion', { n: pct })}</h2>
          <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-labelledby="apercu-pct">
            <span style={{ width: `${pct}%` }} />
          </div>
        </div>
        {missing.length ? (
          <>
            <div className="apercu-next">
              <p>
                <span className="muted">{t('apercu.nextStep')}</span> <strong>{t(`apercu.checks.${missing[0].id}`)}</strong>
              </p>
              <a className="btn btn-primary" href={`#sec-${missing[0].section}`} onClick={(e) => go(e, missing[0].section)}>
                {t('apercu.complete')} →
              </a>
            </div>
            {missing.length > 1 && (
              <details className="apercu-missing">
                <summary className="small">{t('apercu.seeAllMissing', { n: missing.length })}</summary>
                <ul className="chips">
                  {missing.map((c) => (
                    <li key={c.id}>
                      <a className="chip" href={`#sec-${c.section}`} onClick={(e) => go(e, c.section)}>
                        {t(`apercu.checks.${c.id}`)}
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </>
        ) : (
          <p>{t('apercu.allDone')}</p>
        )}
      </section>

      <div className="apercu-tabs" role="tablist" aria-label={t('apercu.title')}>
        {(['edit', 'preview'] as const).map((v) => (
          <button key={v} type="button" role="tab" aria-selected={tab === v} className="btn btn-sm" onClick={() => setTab(v)}>
            {t(v === 'edit' ? 'apercu.editTab' : 'apercu.previewTab')}
          </button>
        ))}
      </div>

      <div className={`apercu-grid show-${tab}`}>
        <div className="apercu-editor">
          <div className="apercu-lang">
            <span className="small">{t('apercu.inputLang')}</span>
            <Segmented
              label={t('apercu.inputLang')}
              value={inputLang}
              onChange={setInputLang}
              options={[
                { value: 'fr', label: 'Français' },
                { value: 'en', label: 'English' },
              ]}
            />
            {todoTranslations > 0 && <span className="badge badge-demo">{t('apercu.untranslated', { n: todoTranslations })}</span>}
          </div>
          <Editor draft={draft} patch={patch} lang={inputLang} />
        </div>
        <div className="apercu-preview">
          <Phone />
        </div>
      </div>
    </div>
  )
}

function jumpTo(e: React.MouseEvent, section: Section, setTab: (t: 'edit') => void) {
  e.preventDefault()
  setTab('edit')
  requestAnimationFrame(() => {
    const el = document.getElementById(`sec-${section}`) as HTMLDetailsElement | null
    if (!el) return
    el.open = true
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // Place le curseur dans le premier champ encore vide de la section.
    const empty = [...el.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input:not([type=checkbox]), textarea')].find((f) => !f.value)
    empty?.focus({ preventScroll: true })
  })
}

function Phone() {
  const { t } = useI18n()
  return (
    <div className="phone">
      <iframe title={t('apercu.phoneTitle')} src={`${window.location.pathname}${href('apercu', 'telephone')}`} />
    </div>
  )
}

// --- Éditeur par section ---------------------------------------------------------
function Editor({ draft, patch, lang }: { draft: Draft; patch: (p: Partial<Draft>) => void; lang: Lang }) {
  const { t, tx } = useI18n()
  const all = checks(draft)
  const sectionDone = (id: Section) => {
    const list = all.filter((c) => c.section === id)
    return { done: list.filter((c) => c.done).length, total: list.length }
  }
  const biProps = (k: keyof Draft) => ({ value: draft[k] as Bi, lang, onChange: (v: Bi) => patch({ [k]: v } as Partial<Draft>) })

  return (
    <div className="apercu-sections">
      <EditorSection id="identity" open done={sectionDone('identity')}>
        <TextField label={t('apercu.fields.name')} value={draft.name} onChange={(name) => patch({ name })} />
        <BiField label={t('apercu.fields.kind')} {...biProps('kind')} prefilled={!!draft.source} />
        <BiField label={t('apercu.fields.tagline')} {...biProps('tagline')} />
        <div className="field-grid">
          <TextField label={t('apercu.fields.municipality')} value={draft.municipality} onChange={(municipality) => patch({ municipality })} prefilled={!!draft.source} />
          <TextField label={t('apercu.fields.legalId')} value={draft.legalId} onChange={(legalId) => patch({ legalId })} prefilled={!!draft.source} />
          <TextField label={t('apercu.fields.capacity')} value={draft.capacity?.toString() ?? ''} inputMode="numeric" onChange={(v) => patch({ capacity: v.trim() ? Number(v) || null : null })} prefilled={!!draft.source} />
          <label className="field">
            <span>{t('apercu.fields.illustration')}</span>
            <select value={draft.illustration} onChange={(e) => patch({ illustration: e.target.value as Draft['illustration'] })}>
              {(['winter', 'river', 'maple'] as const).map((k) => (
                <option key={k} value={k}>
                  {t(`apercu.illustrations.${k}`)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <fieldset className="field">
          <legend>{t('apercu.fields.booking')}</legend>
          <Segmented
            label={t('apercu.fields.booking')}
            value={draft.booking}
            onChange={(booking) => patch({ booking })}
            options={[
              { value: 'airbnb', label: t('demoBar.airbnb') },
              { value: 'direct', label: t('demoBar.direct') },
            ]}
          />
          <span className="small muted">{t('apercu.bookingHint')}</span>
        </fieldset>
      </EditorSection>

      <EditorSection id="arrival" done={sectionDone('arrival')}>
        <div className="field-grid">
          <TextField label={t('apercu.fields.checkIn')} type="time" value={draft.checkIn} onChange={(checkIn) => patch({ checkIn })} />
          <TextField label={t('apercu.fields.checkOut')} type="time" value={draft.checkOut} onChange={(checkOut) => patch({ checkOut })} />
          <TextField label={t('apercu.fields.doorCode')} value={draft.doorCode} onChange={(doorCode) => patch({ doorCode })} hint={t('apercu.codeHint')} />
        </div>
        <BiField label={t('apercu.fields.directions')} {...biProps('directions')} multiline />
        <BiField label={t('apercu.fields.arrivalSteps')} {...biProps('arrivalSteps')} list template={TEMPLATES.arrivalSteps} />
        <BiField label={t('apercu.fields.parking')} {...biProps('parking')} prefilled={!!draft.source && draft.parking.fr !== ''} />
        <BiField label={t('apercu.fields.winterAccess')} {...biProps('winterAccess')} multiline />
        <BiField label={t('apercu.fields.bring')} {...biProps('bring')} list />
      </EditorSection>

      <EditorSection id="wifi" done={sectionDone('wifi')}>
        <div className="field-grid">
          <TextField label={t('apercu.fields.wifiSsid')} value={draft.wifiSsid} onChange={(wifiSsid) => patch({ wifiSsid })} />
          <TextField label={t('apercu.fields.wifiPassword')} value={draft.wifiPassword} onChange={(wifiPassword) => patch({ wifiPassword })} />
        </div>
      </EditorSection>

      <EditorSection id="house" done={sectionDone('house')}>
        <BiField label={t('apercu.fields.houseIntro')} {...biProps('houseIntro')} multiline />
        <BiField label={t('apercu.fields.amenities')} {...biProps('amenities')} list prefilled={!!draft.source && draft.amenities.fr !== ''} />
        <fieldset className="field">
          <legend>{t('apercu.fields.modules')}</legend>
          {draft.source && <span className="small muted">{t('apercu.suggested')}</span>}
          <ul className="apercu-checks">
            {QC_MODULES.map((id) => (
              <li key={id}>
                <label>
                  <input
                    type="checkbox"
                    checked={draft.modules.includes(id)}
                    onChange={(e) => patch({ modules: e.target.checked ? [...draft.modules, id] : draft.modules.filter((m) => m !== id) })}
                  />
                  <Icon name={modules[id].icon} size={18} /> {tx(modules[id].title)}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
        <BiField label={t('apercu.fields.activities')} {...biProps('activities')} list prefilled={!!draft.source && draft.activities.fr !== ''} />
      </EditorSection>

      <EditorSection id="rules" done={sectionDone('rules')}>
        <BiField label={t('apercu.fields.rules')} {...biProps('rules')} list template={TEMPLATES.rules} prefilled={!!draft.source} />
      </EditorSection>

      <EditorSection id="departure" done={sectionDone('departure')}>
        <BiField label={t('apercu.fields.checklist')} {...biProps('checklist')} list template={TEMPLATES.checklist} />
      </EditorSection>

      <EditorSection id="emergency" done={sectionDone('emergency')}>
        <div className="field-grid">
          <TextField label={t('apercu.fields.hospitalName')} value={draft.hospital.name} onChange={(name) => patch({ hospital: { ...draft.hospital, name } })} hint={t('apercu.hospitalHint')} />
          <TextField label={t('apercu.fields.hospitalCity')} value={draft.hospital.city} onChange={(city) => patch({ hospital: { ...draft.hospital, city } })} />
        </div>
      </EditorSection>

      <EditorSection id="options" done={sectionDone('options')}>
        <ul className="apercu-options">
          {OPTION_CATALOG.map((o) => {
            const st = draft.options[o.id] ?? { on: false, price: o.defaultPrice }
            return (
              <li key={o.id}>
                <label className="apercu-option-check">
                  <input type="checkbox" checked={st.on} onChange={(e) => patch({ options: { ...draft.options, [o.id]: { ...st, on: e.target.checked } } })} />
                  <Icon name={o.icon} size={18} /> {tx(o.title)}
                </label>
                <label className="apercu-price">
                  <span className="sr-only">
                    {tx(o.title)} — {t('apercu.fields.price')}
                  </span>
                  <input
                    inputMode="numeric"
                    value={st.price}
                    onChange={(e) => patch({ options: { ...draft.options, [o.id]: { ...st, price: Number(e.target.value.replace(/\D/g, '')) || 0 } } })}
                  />
                  <span>$</span>
                </label>
              </li>
            )
          })}
        </ul>
      </EditorSection>
    </div>
  )
}

/** Section repliable de l'éditeur (composant stable : les champs gardent le focus). */
function EditorSection({ id, children, open, done: { done, total } }: { id: Section; children: ReactNode; open?: boolean; done: { done: number; total: number } }) {
  const { t } = useI18n()
  const complete = done === total
  return (
    <details id={`sec-${id}`} className="card apercu-sec" open={open}>
      <summary>
        <Icon name={complete ? 'circle-check' : 'info'} size={18} className={complete ? 'sec-ok' : 'sec-todo'} />
        {t(`apercu.sections.${id}`)}
        <span className={`sec-count ${complete ? 'is-done' : ''}`} aria-label={t('apercu.sectionCount', { done, total })}>
          {done}/{total}
        </span>
      </summary>
      <div className="stack">{children}</div>
    </details>
  )
}

function TextField({ label, value, onChange, type = 'text', inputMode, hint, prefilled }: { label: string; value: string; onChange: (v: string) => void; type?: string; inputMode?: 'numeric' | 'text'; hint?: string; prefilled?: boolean }) {
  const { t } = useI18n()
  return (
    <label className="field">
      <span>
        {label} {prefilled && <span className="badge badge-prefilled">{t('apercu.prefilled')}</span>}
      </span>
      <input type={type} inputMode={inputMode} value={value} onChange={(e) => onChange(e.target.value)} />
      {hint && <span className="small muted field-hint">{hint}</span>}
    </label>
  )
}

function BiField({ label, value, onChange, lang, multiline, list, template, prefilled }: { label: string; value: Bi; onChange: (v: Bi) => void; lang: Lang; multiline?: boolean; list?: boolean; template?: Bi; prefilled?: boolean }) {
  const { t } = useI18n()
  const v = value[lang]
  const other = value[lang === 'fr' ? 'en' : 'fr']
  const set = (s: string) => onChange({ ...value, [lang]: s })
  return (
    <div className="field">
      <label className="field">
        <span>
          {label} <span className="field-lang">{lang.toUpperCase()}</span> {prefilled && <span className="badge badge-prefilled">{t('apercu.prefilled')}</span>}
        </span>
        {multiline || list ? (
          <textarea rows={list ? 4 : 3} value={v} onChange={(e) => set(e.target.value)} placeholder={lang === 'en' ? other : undefined} />
        ) : (
          <input value={v} onChange={(e) => set(e.target.value)} placeholder={lang === 'en' ? other : undefined} />
        )}
      </label>
      {list && <span className="small muted field-hint">{t('apercu.oneLine')}</span>}
      {template && !value.fr.trim() && (
        <button type="button" className="btn btn-sm btn-ghost field-template" onClick={() => onChange(template)}>
          <Icon name="sparkles" size={16} /> {t('apercu.insertTemplate')}
        </button>
      )}
    </div>
  )
}
