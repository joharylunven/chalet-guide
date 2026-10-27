import { lazy, Suspense, useEffect } from 'react'
import { href, useRoute } from './router'
import { load } from './storage'
import { GuideApp } from './guide/GuideApp'
import { DemoIndex } from './pages/DemoIndex'
import { NotFound } from './pages/NotFound'

// Écran exploitant : chargé seulement quand on l'ouvre.
const SpaTracking = lazy(() => import('./spa/SpaTracking'))
const Landing = lazy(() => import('./pages/Landing'))
const Dashboard = lazy(() => import('./dashboard/Dashboard'))
const Apercu = lazy(() => import('./apercu/Apercu'))
const DraftPreview = lazy(() => import('./apercu/DraftPreview'))

/** Les aperçus d'hôte et le tableau de bord ne doivent pas être indexés. */
function useRobots(noindex: boolean) {
  useEffect(() => {
    let meta = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    if (noindex) {
      if (!meta) {
        meta = document.createElement('meta')
        meta.name = 'robots'
        document.head.appendChild(meta)
      }
      meta.content = 'noindex, nofollow'
    } else meta?.remove()
  }, [noindex])
}

export function App() {
  const [root, a, b] = useRoute()
  useRobots(root === 'apercu' || root === 'tableau-de-bord')

  if (!root) {
    // Ouvert depuis l'icône installée (PWA) : retour direct au dernier guide consulté.
    const last = load<string | null>('cg.lastGuide', null)
    if (last && window.matchMedia('(display-mode: standalone)').matches) {
      window.location.replace(href('demo', last))
      return null
    }
    return (
      <Suspense fallback={null}>
        <Landing />
      </Suspense>
    )
  }
  if (root === 'demo') return a ? <GuideApp key={a} slug={a} view={b} /> : <DemoIndex />
  if (root === 'apercu')
    return (
      <Suspense fallback={null}>
        {a === 'telephone' ? <DraftPreview view={b} /> : <Apercu ficheId={a === 'fiche' ? b : undefined} />}
      </Suspense>
    )
  if (root === 'tableau-de-bord') return a === 'spa' ? (
      <Suspense fallback={null}>
        <SpaTracking slug={b} />
      </Suspense>
    ) : (
      <Suspense fallback={null}>
        <Dashboard />
      </Suspense>
    )
  return <NotFound />
}
