// Bandeau « infos vivantes » : météo, alertes, routes, danger d'incendie.
// Chaque source se dégrade proprement : dernière valeur en cache avec son
// horodatage, ou « indisponible ». Aucune alerte n'est inventée.
import { useI18n } from '../i18n'
import type { LiveState } from '../live/cache'
import { fetchAlerts, fetchFireDanger, fetchRoadEvents, ROAD_RADIUS_KM } from '../live/sources'
import { useLive } from '../live/useLive'
import { Icon } from '../components/Icon'
import { useGuide } from './context'

function useAgo() {
  const { t } = useI18n()
  return (iso: string) => {
    const min = Math.round((Date.now() - Date.parse(iso)) / 60000)
    if (min < 2) return t('common.justNow')
    if (min < 60) return t('common.minutesAgo', { n: min })
    if (min < 48 * 60) return t('common.hoursAgo', { n: Math.round(min / 60) })
    return t('common.daysAgo', { n: Math.round(min / 1440) })
  }
}

function Freshness({ state }: { state: LiveState<unknown> }) {
  const { t } = useI18n()
  const ago = useAgo()
  if (state.status !== 'ok') return null
  return (
    <p className={`live-fresh ${state.stale ? 'is-stale' : ''}`}>
      {state.stale && <Icon name="cloud-off" size={14} />}
      {t('common.updated', { when: ago(state.fetchedAt) })}
    </p>
  )
}

export function LivePanel() {
  const { t, tx, lang } = useI18n()
  const { guide, country, weather } = useGuide()
  const p = guide.location
  const k = `${p.lat},${p.lon}`
  const alerts = useLive(country.live.alerts ? `alerts:${k}` : null, 30, () => fetchAlerts(p))
  const roads = useLive(country.live.roads ? `roads:${k}` : null, 30, () => fetchRoadEvents(p))
  const fire = useLive(country.live.fire ? `fire:${k}` : null, 180, () => fetchFireDanger(p))
  const dayFmt = new Intl.DateTimeFormat(country.locale[lang], { weekday: 'short' })

  return (
    <section className="live" aria-labelledby="live-title">
      <h2 id="live-title" className="sr-only">
        {t(guide.country === 'qc' ? 'live.weather' : 'live.weatherFr')}
      </h2>

      <div className="live-weather card">
        {weather?.status === 'ok' ? (
          <>
            <div className="lw-now">
              <span className="lw-temp">{weather.data.temp}°</span>
              <div>
                <p className="lw-desc">{t(`weatherCodes.${weather.data.code}`)}</p>
                <p className="muted small">
                  {t('live.feels', { t: weather.data.feels })} · {t('live.wind', { v: weather.data.wind })}
                </p>
              </div>
            </div>
            <ol className="lw-days">
              {weather.data.days.slice(1, 4).map((d) => (
                <li key={d.date}>
                  <span className="muted small">{dayFmt.format(new Date(`${d.date}T12:00`))}</span>
                  <span className="lw-day-t">
                    {d.max}° <span className="muted">{d.min}°</span>
                  </span>
                </li>
              ))}
            </ol>
            <Freshness state={weather} />
          </>
        ) : weather?.status === 'error' ? (
          <p className="muted">{t('live.unavailable')}</p>
        ) : (
          <p className="muted">…</p>
        )}
      </div>

      {country.live.alerts && alerts && (
        <LiveRow icon="warning" title={t('live.alerts')} state={alerts}>
          {alerts.status === 'ok' &&
            (alerts.data.length ? (
              <ul className="live-list">
                {alerts.data.map((a) => (
                  <li key={a.id} className={`alert alert-${a.type}`}>
                    {a.name[lang]}
                  </li>
                ))}
              </ul>
            ) : (
              <p>{t('live.noAlerts')}</p>
            ))}
        </LiveRow>
      )}

      {country.live.roads && roads && (
        <LiveRow icon="construction" title={t('live.roads')} state={roads}>
          {roads.status === 'ok' &&
            (roads.data.length ? (
              <>
                <p>{t('live.roadsAt', { n: roads.data.length, km: ROAD_RADIUS_KM })}</p>
                <ul className="live-list small">
                  {roads.data.slice(0, 3).map((r) => (
                    <li key={r.id}>
                      {r.text} <span className="muted">({t('common.km', { n: r.km })})</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p>{t('live.noRoads', { km: ROAD_RADIUS_KM })}</p>
            ))}
        </LiveRow>
      )}

      {country.live.fire && fire && (
        <LiveRow icon="flame" title={`${t('live.fire')} — ${t('live.fireFederal')}`} state={fire}>
          {fire.status === 'ok' && (
            <>
              <p>
                <span className={`fire-level fire-${fire.data}`}>{t(`live.fireLevels.${fire.data}`)}</span>
              </p>
              <p className="muted small">{t('live.fireNote')}</p>
            </>
          )}
        </LiveRow>
      )}

      {guide.country === 'fr' && <p className="muted small">{t('live.frNote')}</p>}

      <div className="live-links">
        <span className="small muted">{t('live.official')}{t('common.colon')}</span>
        {country.live.links.map((l) => (
          <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" className="small">
            {tx(l.label)}
          </a>
        ))}
      </div>
    </section>
  )
}

function LiveRow({ icon, title, state, children }: { icon: string; title: string; state: LiveState<unknown>; children: React.ReactNode }) {
  const { t } = useI18n()
  return (
    <div className="live-row card">
      <h3 className="live-row-title">
        <Icon name={icon} size={18} /> {title}
      </h3>
      {state.status === 'loading' && <p className="muted">…</p>}
      {state.status === 'error' && <p className="muted">{t('live.unavailable')}</p>}
      {children}
      <Freshness state={state} />
    </div>
  )
}
