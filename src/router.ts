// Routage par hash (#/demo/...) : compatible GitHub Pages sans configuration serveur.
import { useEffect, useState } from 'react'

function current(): string[] {
  const raw = window.location.hash.replace(/^#\/?/, '').split('?')[0]
  return raw.split('/').filter(Boolean).map(decodeURIComponent)
}

export function useRoute(): string[] {
  const [parts, setParts] = useState(current)
  useEffect(() => {
    const onChange = () => {
      setParts(current())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return parts
}

export const href = (...parts: string[]) => '#/' + parts.map(encodeURIComponent).join('/')
