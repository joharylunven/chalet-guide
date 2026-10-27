// Vitrine (#/) : proposition de valeur, bénéfices, démo en direct, étapes,
// tarifs indicatifs et contact simulé. Le sélecteur Québec / France adapte
// les exemples, les tarifs et la devise.
import { useEffect, useState, type FormEvent } from 'react'
import { config } from '../config'
import { guides } from '../content'
import { countries, type CountryCode } from '../countries'
import { useI18n } from '../i18n'
import { href } from '../router'
import { load, save } from '../storage'
import { Icon } from '../components/Icon'
import { Illustration } from '../components/Illustration'
import { Segmented } from '../components/controls'
import { SiteLayout } from './SiteLayout'
import './landing.css'

/** Marché par défaut : fuseau horaire européen → France, sinon Québec. */
function initialCountry(): CountryCode {
  const stored = load<CountryCode | null>('cg.market', null)
  if (stored === 'qc' || stored === 'fr') return stored
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone.startsWith('Europe/') ? 'fr' : 'qc'
  } catch {
    return 'qc'
  }
}

const HERO_GUIDE: Record<CountryCode, string> = { qc: 'refuge-lac-brule', fr: 'mas-des-oliviers' }

export default function Landing() {
  const { t, lang } = useI18n()
  const [market, setMarket] = useState<CountryCode>(initialCountry)
  useEffect(() => {
    save('cg.market', market)
  }, [market])
  useEffect(() => {
    document.title = `${config.productName} — ${t('landing.title')}`
  }, [t])

  const qc = market === 'qc'
  const country = countries[market]
  const demoGuides = guides.filter((g) => g.country === market)
  const money = new Intl.NumberFormat(country.locale[lang], { style: 'currency', currency: country.currency, maximumFractionDigits: 0 })

  return (
    <SiteLayout active="home">
      <main id="main" className="landing">
        <section className="l-hero">
          <div className="l-hero-text">
            <Segmented
              label={t('landing.country')}
              value={market}
              onChange={setMarket}
              options={[
                { value: 'qc', label: t('landing.qc') },
                { value: 'fr', label: t('landing.fr') },
              ]}
            />
            <p className="eyebrow">{t(qc ? 'landing.eyebrowQc' : 'landing.eyebrowFr')}</p>
            <h1>{t('landing.title')}</h1>
            <p className="l-lead">{t(qc ? 'landing.leadQc' : 'landing.leadFr')}</p>
            <div className="l-ctas">
              <a className="btn btn-primary" href={href('demo', HERO_GUIDE[market])}>
                {t('landing.ctaDemo')} →
              </a>
              {qc ? (
                <a className="btn" href={href('apercu')}>
                  {t('landing.ctaPreview')}
                </a>
              ) : (
                <a className="btn" href="#contact" onClick={scrollTo('contact')}>
                  {t('landing.ctaContact')}
                </a>
              )}
            </div>
          </div>
          <div className="l-hero-phone">
            <div className="phone">
              {/* Vrai guide de démo, pas une capture : ce que verra le voyageur. */}
              <iframe key={market} title={t('landing.phoneLabel')} src={`${window.location.pathname}${href('demo', HERO_GUIDE[market])}`} loading="lazy" />
            </div>
          </div>
        </section>

        <section className="l-section" aria-labelledby="l-benefits">
          <h2 id="l-benefits">{t('landing.benefitsTitle')}</h2>
          <ul className="l-cards l-cards-3">
            {[
              { icon: 'message-circle', k: 'b1' },
              { icon: 'qr-code', k: 'b2' },
              { icon: 'shopping-bag', k: 'b3' },
            ].map((b) => (
              <li key={b.k} className="card l-card">
                <span className="l-icon">
                  <Icon name={b.icon} size={24} />
                </span>
                <h3>{t(`landing.${b.k}Title`)}</h3>
                <p className="muted">{t(`landing.${b.k}Text`)}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="l-section" aria-labelledby="l-unique">
          <h2 id="l-unique">{t('landing.uniqueTitle')}</h2>
          <ul className="l-features">
            {[
              { icon: qc ? 'flame' : 'waves', title: qc ? 'uQcModules' : 'uFrModules', text: qc ? 'uQcModulesText' : 'uFrModulesText' },
              { icon: 'cloud-off', title: 'uOffline', text: 'uOfflineText' },
              { icon: 'globe', title: 'uBilingual', text: 'uBilingualText' },
              { icon: 'circle-check', title: 'uAirbnb', text: 'uAirbnbText' },
              { icon: 'thermometer', title: 'uLive', text: qc ? 'uLiveTextQc' : 'uLiveTextFr' },
              { icon: 'list-checks', title: 'uStats', text: 'uStatsText' },
            ].map((f) => (
              <li key={f.title}>
                <Icon name={f.icon} size={22} />
                <div>
                  <h3>{t(`landing.${f.title}`)}</h3>
                  <p className="muted small">{t(`landing.${f.text}`)}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="l-section l-spa card" aria-labelledby="l-spa">
          <div className="l-spa-text">
            <span className="l-icon">
              <Icon name="waves" size={24} />
            </span>
            <h2 id="l-spa">{t('landing.spaTitle')}</h2>
            <p>{t('landing.spaText')}</p>
            <p className="small muted">{country.spaNotice[lang]}</p>
            <a className="btn btn-forest" href={href('tableau-de-bord', 'spa')}>
              {t('landing.spaCta')} →
            </a>
          </div>
        </section>

        <section className="l-section" aria-labelledby="l-how">
          <h2 id="l-how">{t('landing.howTitle')}</h2>
          <ol className="l-steps">
            {[
              { k: 's1', text: qc ? 's1TextQc' : 's1TextFr' },
              { k: 's2', text: 's2Text' },
              { k: 's3', text: 's3Text' },
            ].map((s, i) => (
              <li key={s.k}>
                <span className="l-step-num" aria-hidden="true">
                  {i + 1}
                </span>
                <h3>{t(`landing.${s.k}Title`)}</h3>
                <p className="muted">{t(`landing.${s.text}`)}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="l-section" aria-labelledby="l-demos">
          <h2 id="l-demos">{t('landing.demosTitle')}</h2>
          <p className="muted">{t('landing.demosLead')}</p>
          <ul className="l-cards l-cards-3 l-demos">
            {demoGuides.map((g) => (
              <li key={g.slug}>
                <a className="card l-demo" href={href('demo', g.slug)}>
                  <Illustration kind={g.illustration} />
                  <span className="l-demo-body">
                    <span className="eyebrow">{g.region[lang]}</span>
                    <strong>{g.name}</strong>
                    <span className="small muted">{g.kind[lang]}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="l-section" aria-labelledby="l-pricing">
          <h2 id="l-pricing">{t('landing.pricingTitle')}</h2>
          <ul className="l-cards l-cards-3 l-pricing">
            {config.pricing[country.currency].map((p) => (
              <Plan key={p.id} id={p.id} price={p.price === null ? null : money.format(p.price)} units={p.units} />
            ))}
          </ul>
          <p className="small muted">{t('landing.pricingNote')}</p>
        </section>

        <Contact />
      </main>
    </SiteLayout>
  )
}

function scrollTo(id: string) {
  return (e: React.MouseEvent) => {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function Plan({ id, price, units }: { id: string; price: string | null; units: number | null }) {
  const { t, tList } = useI18n()
  const popular = id === 'pro'
  return (
    <li className={`card l-plan ${popular ? 'is-popular' : ''}`}>
      {popular && <span className="badge l-popular">{t('landing.popular')}</span>}
      <h3>{t(`landing.plans.${id}`)}</h3>
      <p className="l-price">
        {price ? (
          <>
            <strong>{price}</strong> <span className="muted">{t('landing.perMonth')}</span>
          </>
        ) : (
          <strong>{t('landing.onQuote')}</strong>
        )}
      </p>
      <p className="small muted">{units === 1 ? t('landing.units1') : units ? t('landing.unitsN', { n: units }) : t('landing.unitsMany')}</p>
      <ul className="ticks">
        {tList(`landing.planFeatures.${id}`).map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
    </li>
  )
}

/** Contact simulé : rien n'est envoyé ni enregistré ; lien mailto si configuré. */
function Contact() {
  const { t } = useI18n()
  const [sent, setSent] = useState(false)
  const [message, setMessage] = useState('')
  const email = config.contactEmail

  function submit(e: FormEvent) {
    e.preventDefault()
    setSent(true)
  }

  // Le mailto ne reprend que le message saisi, jamais le nom ni le courriel.
  const mailto = email ? `mailto:${email}?subject=${encodeURIComponent(t('landing.mailSubject'))}${message ? `&body=${encodeURIComponent(message)}` : ''}` : ''

  return (
    <section id="contact" className="l-section l-contact card" aria-labelledby="l-contact">
      <h2 id="l-contact">{t('landing.contactTitle')}</h2>
      <p className="muted">{t('landing.contactLead')}</p>
      {sent ? (
        <div className="stack" role="status">
          <h3>{t('landing.sentTitle')}</h3>
          <p>{t('landing.sentText')}</p>
          {email ? (
            <a className="btn btn-primary" href={mailto}>
              <Icon name="send" size={18} /> {t('landing.mailto')}
            </a>
          ) : (
            <p className="small muted">{t('landing.sentNoEmail')}</p>
          )}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSent(false)}>
            {t('landing.back')}
          </button>
        </div>
      ) : (
        <form className="stack" onSubmit={submit}>
          <div className="field-grid">
            <label className="field">
              <span>{t('landing.fName')}</span>
              <input name="name" autoComplete="name" required />
            </label>
            <label className="field">
              <span>{t('landing.fEmail')}</span>
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label className="field">
              <span>{t('landing.fUnits')}</span>
              <input name="units" inputMode="numeric" pattern="[0-9]*" />
            </label>
          </div>
          <label className="field">
            <span>{t('landing.fMessage')}</span>
            <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
          </label>
          <button type="submit" className="btn btn-primary l-submit">
            {t('landing.fSubmit')}
          </button>
          <p className="small muted">{t('landing.formDemo')}</p>
        </form>
      )}
    </section>
  )
}
