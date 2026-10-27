import type { ReactNode } from 'react'
import type { ModuleDef, Text } from '../content/schema'
import { useI18n } from '../i18n'
import { Icon } from '../components/Icon'

/** Fiche d'un module de consignes (poêle, spa, fosse septique…). */
export function ModuleCard({ module: m, note, children }: { module: ModuleDef; note?: Text; children?: ReactNode }) {
  const { t, tx } = useI18n()
  return (
    <section id={`mod-${m.id}`} className="card module stack" aria-labelledby={`mod-${m.id}-title`}>
      <h3 id={`mod-${m.id}-title`} className="module-title">
        <span className="module-icon">
          <Icon name={m.icon} size={22} />
        </span>
        {tx(m.title)}
      </h3>
      <p>{tx(m.intro)}</p>
      {m.blocks.map((b, i) => (
        <div key={i} className={`block block-${b.tone}`}>
          <h4>{tx(b.title)}</h4>
          <ul>
            {b.items.map((it, j) => (
              <li key={j}>{tx(it)}</li>
            ))}
          </ul>
        </div>
      ))}
      {note && (
        <p className="host-note">
          <strong>
            {t('house.fromHost')}
            {t('common.colon')}{' '}
          </strong>
          {tx(note)}
        </p>
      )}
      {children}
    </section>
  )
}
