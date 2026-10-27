// Page spa du guide (cible du QR affiché près du spa) : consignes d'usage et
// derniers contrôles publiés par l'exploitant.
import { modules } from '../../content'
import { useI18n } from '../../i18n'
import { Icon } from '../../components/Icon'
import { SpaChecks } from '../../spa/SpaChecks'
import { useSpaLog } from '../../spa/store'
import { useGuide } from '../context'
import { ModuleCard } from '../ModuleCard'
import { SectionHeader } from './basic'

export function Spa() {
  const { t, lang } = useI18n()
  const { guide, country, link } = useGuide()
  const [log] = useSpaLog(guide.slug)
  const ref = guide.house.modules.find((m) => m.id === 'spa')
  const m = modules.spa

  return (
    <article className="section-pad stack">
      <SectionHeader id="spa" icon="waves" />
      <SpaChecks log={log} locale={country.locale[lang]} />
      {ref && m && <ModuleCard module={m} note={ref.note} />}
      <aside className="card callout callout-lake stack">
        <p>{t('spa.problem')}</p>
        <a className="btn btn-forest" href={link('assistant')}>
          <Icon name="message-circle" size={18} /> {t('spa.contactHost')}
        </a>
      </aside>
    </article>
  )
}
