// Aperçu mobile du brouillon (#/apercu/telephone/...), affiché dans l'iframe
// du générateur. Se met à jour à chaque modification de l'éditeur.
import { useMemo } from 'react'
import { useI18n } from '../i18n'
import { GuideApp } from '../guide/GuideApp'
import { draftToGuide, useDraft } from './draft'

const BASE = ['apercu', 'telephone']

export default function DraftPreview({ view }: { view?: string }) {
  const { t } = useI18n()
  const [draft] = useDraft()
  const guide = useMemo(() => (draft ? draftToGuide(draft) : null), [draft])
  if (!guide) return <p className="page muted">{t('apercu.noDraftPreview')}</p>
  return <GuideApp guide={guide} view={view} basePath={BASE} />
}
