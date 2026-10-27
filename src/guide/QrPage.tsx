// QR code du guide, généré côté client, avec mise en page imprimable A5.
import { useI18n } from '../i18n'
import { href } from '../router'
import { Icon } from '../components/Icon'
import { QrCode, absoluteUrl } from '../components/QrCode'
import { useGuide } from './context'

export const guideUrl = (slug: string) => absoluteUrl(href('demo', slug))

export default function QrPage() {
  const { t, tx, lang } = useI18n()
  const { guide } = useGuide()
  const url = guideUrl(guide.slug)

  return (
    <article className="section-pad stack">
      <header className="section-head no-print">
        <span className="section-icon">
          <Icon name="qr-code" size={26} />
        </span>
        <h1>{t('qr.title')}</h1>
        <p className="section-lead">{t('qr.lead')}</p>
      </header>
      <div className="qr-sheet" lang={lang}>
        <p className="eyebrow">{tx(guide.kind)}</p>
        <h2 className="qr-name">{guide.name}</h2>
        <QrCode value={url} label={t('qr.scan')} />
        <p className="qr-scan">{t('qr.scan')}</p>
        <p className="small">{t('qr.wifiHint')}</p>
        <p className="qr-url small">{url}</p>
      </div>
      <button type="button" className="btn btn-primary no-print" onClick={() => window.print()}>
        <Icon name="printer" size={18} /> {t('qr.print')}
      </button>
    </article>
  )
}
