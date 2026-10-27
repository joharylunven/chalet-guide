// Graphiques maison (sans bibliothèque) : une série, une teinte. Barres fines à
// extrémité arrondie, grille discrète, info-bulle au survol, vue tableau.
import { useState, type ReactNode } from 'react'
import { useI18n } from '../i18n'

/** Graduation « propre » : 0, pas régulier, maximum arrondi. */
function niceMax(max: number): { top: number; ticks: number[] } {
  if (max <= 4) return { top: 4, ticks: [0, 2, 4] }
  const step = Math.pow(10, Math.floor(Math.log10(max)))
  const unit = [1, 2, 5, 10].map((m) => m * step).find((u) => max / u <= 4)!
  const top = Math.ceil(max / unit) * unit
  const ticks = []
  for (let v = 0; v <= top; v += unit) ticks.push(v)
  return { top, ticks }
}

export interface Point {
  key: string
  label: string
  value: number
  tip: string
}

export function ColumnChart({ data, label, xLabels }: { data: Point[]; label: string; xLabels: (i: number) => boolean }) {
  const [hover, setHover] = useState<number | null>(null)
  const { top, ticks } = niceMax(Math.max(1, ...data.map((d) => d.value)))
  const h = hover !== null ? data[hover] : null

  return (
    <figure className="chart">
      <div className="chart-plot" role="img" aria-label={label} onPointerLeave={() => setHover(null)}>
        <div className="chart-y" aria-hidden="true">
          {[...ticks].reverse().map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
        <div className="chart-area">
          {ticks.map((t) => (
            <span key={t} className="chart-grid" style={{ bottom: `${(t / top) * 100}%` }} aria-hidden="true" />
          ))}
          <div className="chart-cols" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}>
            {data.map((d, i) => (
              <div key={d.key} className={`chart-col ${hover === i ? 'is-hover' : ''}`} onPointerEnter={() => setHover(i)}>
                <span className="chart-bar" style={{ height: `${(d.value / top) * 100}%` }} />
              </div>
            ))}
          </div>
          {h && hover !== null && (
            <div className="chart-tip" style={{ left: `${((hover + 0.5) / data.length) * 100}%` }} aria-hidden="true">
              {h.tip}
            </div>
          )}
        </div>
      </div>
      <div className="chart-x" aria-hidden="true" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}>
        {data.map((d, i) => (
          <span key={d.key}>{xLabels(i) ? d.label : ''}</span>
        ))}
      </div>
      <DataTable head={[label]} rows={data.map((d) => [d.label, d.value])} />
    </figure>
  )
}

export interface Row {
  key: string
  label: ReactNode
  text: string
  value: number
  sub?: string
}

export function BarList({ rows, label, empty }: { rows: Row[]; label: string; empty: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  if (!rows.length) return <p className="muted">{empty}</p>
  return (
    <figure className="chart">
      <ul className="barlist" aria-label={label}>
        {rows.map((r) => (
          <li key={r.key} title={`${r.text} : ${r.value}${r.sub ? ` (${r.sub})` : ''}`}>
            <span className="barlist-label">{r.label}</span>
            <span className="barlist-track">
              <span className="barlist-bar" style={{ width: `${(r.value / max) * 100}%` }} />
              <span className="barlist-value">{r.value}</span>
            </span>
            {r.sub && <span className="barlist-sub small muted">{r.sub}</span>}
          </li>
        ))}
      </ul>
      <DataTable head={[label]} rows={rows.map((r) => [r.text, r.value])} />
    </figure>
  )
}

/** Vue tableau des données : accessible au clavier et aux lecteurs d'écran. */
function DataTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  const { t } = useI18n()
  return (
    <details className="chart-table">
      <summary className="small">{t('dash.showTable')}</summary>
      <table>
        <thead>
          <tr>
            <th scope="col" />
            {head.map((h) => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([k, ...vals]) => (
            <tr key={String(k)}>
              <th scope="row">{k}</th>
              {vals.map((v, i) => (
                <td key={i}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  )
}
