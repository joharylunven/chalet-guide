// Styles de base en premier : les feuilles des pages les surchargent.
import './styles/app.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { I18nProvider } from './i18n'
import { load } from './storage'

// Thème appliqué avant le premier rendu pour éviter un flash.
function applyStoredTheme() {
  const theme = load<string>('cg.theme', 'auto')
  if (theme === 'light' || theme === 'dark') document.documentElement.setAttribute('data-theme', theme)
  else document.documentElement.removeAttribute('data-theme')
}
applyStoredTheme()
// Même thème dans l'éditeur et dans l'aperçu (iframe).
window.addEventListener('storage', (e) => {
  if (e.key === 'cg.theme') applyStoredTheme()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
)
