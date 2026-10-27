// Boutique d'options. Deux modes :
// - réservation directe : bouton « Payer » (paiement simulé dans la démo) ;
// - réservation Airbnb : bouton « Faire une demande ». Aucun paiement hors
//   plateforme : l'hôte facture ensuite via Airbnb.
import { useState } from 'react'
import type { OptionDef } from '../../content/schema'
import { useI18n } from '../../i18n'
import { track } from '../../analytics/track'
import { Icon } from '../../components/Icon'
import { Modal } from '../../components/controls'
import { useGuide, type Phase } from '../context'
import { SectionHeader } from './basic'

const COLD_THRESHOLD = 5

function isHighlighted(o: OptionDef, phase: Phase, temp: number | null): boolean {
  switch (o.highlight) {
    case 'cold':
      return temp !== null && temp <= COLD_THRESHOLD
    case 'before':
      return phase === 'before'
    case 'lastDay':
      return phase === 'departure'
    case 'always':
      return true
    default:
      return false
  }
}

export function Options() {
  const { t, tx } = useI18n()
  const { guide, booking, phase, weather, money } = useGuide()
  const [pending, setPending] = useState<OptionDef | null>(null)
  const [done, setDone] = useState<OptionDef | null>(null)
  const temp = weather?.status === 'ok' ? weather.data.temp : null
  const airbnb = booking === 'airbnb'

  const sorted = [...guide.options].sort((a, b) => Number(isHighlighted(b, phase, temp)) - Number(isHighlighted(a, phase, temp)))

  function choose(o: OptionDef) {
    if (airbnb) {
      track({ type: 'option', guide: guide.slug, option: o.id, mode: 'airbnb' })
      setDone(o)
    } else setPending(o)
  }

  function confirmPayment() {
    if (!pending) return
    track({ type: 'option', guide: guide.slug, option: pending.id, mode: 'direct' })
    setDone(pending)
    setPending(null)
  }

  return (
    <article className="section-pad stack">
      <SectionHeader id="options" icon="shopping-bag" lead={t('options.intro')} />
      <aside className={`card callout ${airbnb ? 'callout-lake' : 'callout-moss'}`}>
        <h2 className="callout-title">
          <Icon name={airbnb ? 'info' : 'circle-check'} /> {airbnb ? t('options.airbnbTitle') : t('options.directTitle')}
        </h2>
        <p>{airbnb ? t('options.airbnbExplain') : t('options.directExplain')}</p>
      </aside>
      <ul className="options">
        {sorted.map((o) => {
          const hl = isHighlighted(o, phase, temp)
          return (
            <li key={o.id} className={`card option ${hl ? 'is-highlight' : ''}`}>
              {hl && o.highlight && (
                <p className="option-why">
                  <Icon name="sparkles" size={14} /> {t(`options.why.${o.highlight}`, { t: temp ?? '' })}
                </p>
              )}
              <div className="option-main">
                <span className="option-icon">
                  <Icon name={o.icon} size={24} />
                </span>
                <div className="option-text">
                  <h2 className="option-title">{tx(o.title)}</h2>
                  <p className="small">{tx(o.description)}</p>
                  <p className="small muted">{t('options.leadTime', { t: tx(o.leadTime) })}</p>
                </div>
              </div>
              <div className="option-foot">
                <p className="option-price">
                  {money(o.price)} <span className="muted small">{t('options.per', { unit: tx(o.unit) })}</span>
                </p>
                <button type="button" className={`btn ${airbnb ? 'btn-forest' : 'btn-primary'}`} onClick={() => choose(o)}>
                  {airbnb ? t('options.request') : t('options.pay', { price: money(o.price) })}
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      <Modal open={!!pending} onClose={() => setPending(null)} title={t('options.payTitle')}>
        {pending && (
          <div className="stack">
            <p className="badge badge-demo">{t('common.demo')}</p>
            <p>
              <strong>{tx(pending.title)}</strong> — {money(pending.price)}
            </p>
            <p className="muted">{t('options.payBody')}</p>
            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setPending(null)}>
                {t('options.cancel')}
              </button>
              <button type="button" className="btn btn-primary" onClick={confirmPayment}>
                {t('options.payConfirm')}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!done} onClose={() => setDone(null)} title={airbnb ? t('options.requestTitle') : t('options.paidTitle')}>
        {done && (
          <div className="stack">
            <p>{t(airbnb ? 'options.requestBody' : 'options.paidBody', { option: tx(done.title) })}</p>
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={() => setDone(null)}>
                {t('options.ok')}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </article>
  )
}
