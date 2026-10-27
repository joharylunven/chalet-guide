// Carte « Derniers contrôles » : ce que voit le voyageur. Ne qualifie jamais
// l'eau de « conforme » : seuls les seuils fixés par l'exploitant sont évoqués.
import { useI18n } from '../i18n'
import { Icon } from '../components/Icon'
import { SPA_PARAMS } from './config'
import { latest, rangeStatus, type ParamValue, type SpaLog } from './store'
import './spa.css'

export function formatValue(v: ParamValue, unit: string, lang: 'fr' | 'en', yes: string, no: string): string {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'boolean') return v ? yes : no
  const n = new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-CA', { maximumFractionDigits: 1 }).format(v)
  return unit ? `${n} ${unit}` : n
}

export function SpaChecks({ log, locale }: { log: SpaLog; locale: string }) {
  const { t, tx, lang } = useI18n()
  const last = latest(log)
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeStyle: 'short' })
  // Les seuils d'exemple ne sont jamais présentés au voyageur comme des repères.
  const statusOf = (id: string) => (log.thresholdsAreExample || !last ? null : rangeStatus(last.values[id], log.thresholds[id]))
  const anyStatus = SPA_PARAMS.some((p) => statusOf(p.id) !== null)

  return (
    <section className="card spa-checks stack" aria-labelledby="spa-checks-title">
      <h2 id="spa-checks-title">
        <Icon name="droplet" /> {t('spa.checksTitle')}
      </h2>
      {!log.publish ? (
        <p className="muted">{t('spa.notPublished')}</p>
      ) : !last ? (
        <p className="muted">{t('spa.noChecks')}</p>
      ) : (
        <>
          <p className="spa-checks-date">
            {t('spa.checkedAt', { date: dateFmt.format(new Date(last.at)) })}
            {last.example && <span className="badge badge-demo">{t('spa.example')}</span>}
          </p>
          <dl className="spa-values">
            {SPA_PARAMS.map((p) => {
              const v = last.values[p.id]
              const status = statusOf(p.id)
              return (
                <div key={p.id} className={status ? `is-${status}` : undefined}>
                  <dt>{tx(p.label)}</dt>
                  <dd>
                    {formatValue(v, p.unit, lang, t('spa.yes'), t('spa.no'))}
                    {status && (
                      <span className="sr-only">
                        {' '}
                        — {status === 'ok' ? t('spa.within') : t('spa.out')}
                      </span>
                    )}
                  </dd>
                </div>
              )
            })}
          </dl>
          <p className="small muted">
            {t('spa.byHost')} {anyStatus && t('spa.limitsNote')}
          </p>
        </>
      )}
    </section>
  )
}
