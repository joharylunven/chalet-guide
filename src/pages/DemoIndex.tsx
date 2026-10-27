import { useEffect } from 'react'
import { config } from '../config'
import { guides } from '../content'
import { countries } from '../countries'
import { useI18n } from '../i18n'
import { href } from '../router'
import { Illustration } from '../components/Illustration'
import { Icon } from '../components/Icon'
import { SiteLayout } from './SiteLayout'

export function DemoIndex() {
  const { t, tx } = useI18n()
  useEffect(() => {
    document.title = `${t('demoIndex.title')} — ${config.productName}`
  }, [t])
  return (
    <SiteLayout active="demo">
      <main className="page" id="main">
        <h1>{t('demoIndex.title')}</h1>
        <p className="muted demo-lead">{t('demoIndex.lead')}</p>
        <ul className="demo-grid" role="list">
          {guides.map((g) => (
            <li key={g.slug} className="card demo-card">
              <Illustration kind={g.illustration} />
              <div className="demo-card-body">
                <p className="eyebrow">
                  {tx(countries[g.country].name)} · {tx(g.region)}
                </p>
                <h2>{g.name}</h2>
                <p className="small muted">{tx(g.kind)}</p>
                <div className="demo-card-actions">
                  <a className="btn btn-primary" href={href('demo', g.slug)}>
                    {t('demoIndex.open')}
                  </a>
                  <a className="btn" href={href('demo', g.slug, 'qr')}>
                    <Icon name="qr-code" size={18} /> {t('demoIndex.qr')}
                  </a>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </SiteLayout>
  )
}
