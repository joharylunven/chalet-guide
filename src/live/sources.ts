// Adaptateurs des sources publiques (sans clé, CORS ouvert, vérifiées le
// 26 octobre 2026 — voir docs/benchmark.md).
import { distanceKm, getJson } from './cache'

type Point = { lat: number; lon: number }

// --- Open-Meteo (CC-BY 4.0) -------------------------------------------------
export interface Weather {
  temp: number
  feels: number
  wind: number
  code: number
  days: { date: string; code: number; max: number; min: number }[]
}

export async function fetchWeather(p: Point): Promise<Weather> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}` +
    '&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m' +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=4'
  const d = await getJson<{
    current: { temperature_2m: number; apparent_temperature: number; weather_code: number; wind_speed_10m: number }
    daily: { time: string[]; weather_code: number[]; temperature_2m_max: number[]; temperature_2m_min: number[] }
  }>(url)
  return {
    temp: Math.round(d.current.temperature_2m),
    feels: Math.round(d.current.apparent_temperature),
    wind: Math.round(d.current.wind_speed_10m),
    code: d.current.weather_code,
    days: d.daily.time.map((date, i) => ({
      date,
      code: d.daily.weather_code[i],
      max: Math.round(d.daily.temperature_2m_max[i]),
      min: Math.round(d.daily.temperature_2m_min[i]),
    })),
  }
}

// --- Environnement Canada, GeoMet-OGC-API (Licence du gouvernement ouvert) ---
export interface Alert {
  id: string
  type: string
  name: { fr: string; en: string }
  expires: string
}

export async function fetchAlerts(p: Point): Promise<Alert[]> {
  const d = 0.05
  const url = `https://api.weather.gc.ca/collections/weather-alerts/items?f=json&limit=20&bbox=${p.lon - d},${p.lat - d},${p.lon + d},${p.lat + d}`
  const res = await getJson<{ features: { id: string; properties: Record<string, string> }[] }>(url)
  const seen = new Set<string>()
  return res.features
    .map((f) => ({
      id: String(f.id),
      type: f.properties.alert_type,
      name: { fr: f.properties.alert_short_name_fr ?? f.properties.alert_name_fr, en: f.properties.alert_short_name_en ?? f.properties.alert_name_en },
      expires: f.properties.expiration_datetime,
    }))
    .filter((a) => !seen.has(a.name.fr) && seen.add(a.name.fr))
}

// --- MTMD / Québec 511 : avertissements routiers (CC-BY 4.0) ------------------
export interface RoadEvent {
  id: number
  text: string
  km: number
}

export const ROAD_RADIUS_KM = 40

export async function fetchRoadEvents(p: Point): Promise<RoadEvent[]> {
  const url =
    'https://ws.mapserver.transports.gouv.qc.ca/swtq?service=wfs&version=2.0.0&request=getfeature' +
    '&typename=ms:evenements&srsname=EPSG:4326&outputformat=geojson'
  const res = await getJson<{
    features: { properties: { identifiant: number; localisation: string }; geometry: { type: string; coordinates: number[] | number[][] } }[]
  }>(url, 15000)
  return res.features
    .map((f) => {
      const coords = (f.geometry.type === 'Point' ? [f.geometry.coordinates] : f.geometry.coordinates) as number[][]
      const km = Math.min(...coords.map(([lon, lat]) => distanceKm(p, { lat, lon })))
      // Le texte source contient du HTML (<br/>) : on n'en garde que le texte.
      const text = f.properties.localisation.split(/<br\s*\/?>/i)[0].replace(/<[^>]+>/g, '').trim()
      return { id: f.properties.identifiant, text, km: Math.round(km) }
    })
    .filter((e) => e.km <= ROAD_RADIUS_KM)
    .sort((a, b) => a.km - b.km)
}

// --- Ressources naturelles Canada, CWFIS : indice de danger d'incendie --------
/** 0 = hors saison / non disponible, 1 à 5 = bas à extrême. */
export async function fetchFireDanger(p: Point): Promise<number> {
  const d = 0.05
  const url =
    'https://cwfis.cfs.nrcan.gc.ca/geoserver/public/wms?service=WMS&version=1.1.1&request=GetFeatureInfo' +
    '&layers=public:fdr_current&query_layers=public:fdr_current&info_format=application/json&srs=EPSG:4326' +
    `&bbox=${p.lon - d},${p.lat - d},${p.lon + d},${p.lat + d}&width=3&height=3&x=1&y=1`
  const res = await getJson<{ features: { properties: { FDR?: number; GRAY_INDEX?: number } }[] }>(url)
  const v = Number(res.features[0]?.properties.FDR ?? res.features[0]?.properties.GRAY_INDEX ?? 0)
  return Number.isFinite(v) && v >= 0 && v <= 5 ? v : 0
}
