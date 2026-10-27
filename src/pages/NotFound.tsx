import { useI18n } from '../i18n'
import { href } from '../router'

export function NotFound() {
  const { t } = useI18n()
  return (
    <main className="page stack">
      <h1>404</h1>
      <p>
        <a href={href('demo')}>{t('demoIndex.title')}</a>
      </p>
    </main>
  )
}
