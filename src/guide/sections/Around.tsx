// « Autour de nous » : liste et carte synchronisées. Leaflet est chargé dans
// ce module seulement (route chargée à la demande).
import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Guide } from '../../content/schema'
import { useI18n } from '../../i18n'
import { distanceKm } from '../../live/cache'
import { Icon } from '../../components/Icon'
import { useGuide } from '../context'
import { SectionHeader } from './basic'

type Category = Guide['around'][number]['category']

function pin(label: string, kind: 'home' | 'place', active = false) {
  return L.divIcon({
    className: '',
    html: `<span class="map-pin map-pin-${kind}${active ? ' is-active' : ''}" aria-hidden="true">${label}</span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 30],
  })
}

export default function Around() {
  const { t, tx } = useI18n()
  const { guide } = useGuide()
  const [cat, setCat] = useState<Category | 'all'>('all')
  const [active, setActive] = useState<string | null>(null)
  const [mapFailed, setMapFailed] = useState(!navigator.onLine)
  const mapEl = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markers = useRef(new Map<string, L.Marker>())

  const items = useMemo(
    () =>
      guide.around
        .map((r) => ({ ...r, km: Math.round(distanceKm(guide.location, r.location)) }))
        .filter((r) => cat === 'all' || r.category === cat)
        .sort((a, b) => a.km - b.km),
    [guide, cat],
  )
  const categories = Array.from(new Set(guide.around.map((r) => r.category)))

  useEffect(() => {
    if (!mapEl.current) return
    const map = L.map(mapEl.current, { scrollWheelZoom: false, attributionControl: true })
    const layer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)
    let errors = 0
    layer.on('tileerror', () => {
      if (++errors > 4 && !navigator.onLine) setMapFailed(true)
    })
    L.marker([guide.location.lat, guide.location.lon], { icon: pin('★', 'home'), title: t('around.you') }).addTo(map)
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
      markers.current.clear()
    }
  }, [guide, t])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    markers.current.forEach((m) => m.remove())
    markers.current.clear()
    items.forEach((r, i) => {
      const m = L.marker([r.location.lat, r.location.lon], { icon: pin(String(i + 1), 'place'), title: r.name })
        .addTo(map)
        .on('click', () => {
          setActive(r.id)
          document.getElementById(`reco-${r.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        })
      markers.current.set(r.id, m)
    })
    const pts = [guide.location, ...items.map((r) => r.location)].map((p) => [p.lat, p.lon] as [number, number])
    map.fitBounds(L.latLngBounds(pts), { padding: [28, 28], maxZoom: 13 })
  }, [items, guide])

  useEffect(() => {
    items.forEach((r, i) => markers.current.get(r.id)?.setIcon(pin(String(i + 1), 'place', r.id === active)))
  }, [items, active])

  function focus(id: string) {
    setActive(id)
    const m = markers.current.get(id)
    if (m && mapRef.current) mapRef.current.setView(m.getLatLng(), Math.max(mapRef.current.getZoom(), 12))
    mapEl.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  const seasonLabel = (s: string[]) => (s.length === 4 ? t('around.allYear') : s.map((x) => t(`around.seasons.${x}`)).join(', '))

  return (
    <article className="section-pad stack">
      <SectionHeader id="around" icon="map-pin" lead={t('around.intro', { place: guide.municipality })} />
      <div className="chips" role="group" aria-label={t('around.map')}>
        <button type="button" className="chip" aria-pressed={cat === 'all'} onClick={() => setCat('all')}>
          {t('around.all')}
        </button>
        {categories.map((c) => (
          <button key={c} type="button" className="chip" aria-pressed={cat === c} onClick={() => setCat(c)}>
            {t(`around.categories.${c}`)}
          </button>
        ))}
      </div>
      <div className="map-wrap card">
        <div ref={mapEl} className="map" role="region" aria-label={t('around.map')} />
        {mapFailed && (
          <p className="map-offline">
            <Icon name="cloud-off" size={18} /> {t('around.mapOffline')}
          </p>
        )}
      </div>
      <ol className="recos">
        {items.map((r, i) => (
          <li key={r.id} id={`reco-${r.id}`} className={`card reco ${active === r.id ? 'is-active' : ''}`}>
            <span className="reco-num" aria-hidden="true">
              {i + 1}
            </span>
            <div className="reco-body">
              <p className="eyebrow">{t(`around.categories.${r.category}`)}</p>
              <h2 className="reco-name">{r.name}</h2>
              <p className="small">{tx(r.text)}</p>
              <p className="small muted">
                {t('around.fromHere', { n: r.km })} · {seasonLabel(r.seasons)}
              </p>
              <button type="button" className="btn btn-sm" onClick={() => focus(r.id)}>
                <Icon name="map-pin" size={16} /> {t('around.showOnMap')}
              </button>
            </div>
          </li>
        ))}
      </ol>
      {guide.activities && guide.activities.length > 0 && (
        <section className="card stack">
          <h2>{t('around.activities')}</h2>
          <ul className="chips">
            {guide.activities.map((a, j) => (
              <li key={j} className="chip">
                {tx(a)}
              </li>
            ))}
          </ul>
          <p className="small muted">{t('around.activitiesSource')}</p>
        </section>
      )}
    </article>
  )
}
