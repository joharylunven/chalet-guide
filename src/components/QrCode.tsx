// QR code SVG généré côté client. La bibliothèque est chargée à la demande.
import { useEffect, useState } from 'react'

export function QrCode({ value, label, className = 'qr-code' }: { value: string; label: string; className?: string }) {
  const [svg, setSvg] = useState('')
  useEffect(() => {
    let alive = true
    import('qrcode')
      .then((QR) => QR.toString(value, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#1c2822', light: '#ffffff' } }))
      .then((s) => {
        if (alive) setSvg(s)
      })
    return () => {
      alive = false
    }
  }, [value])
  return <div className={className} role="img" aria-label={label} dangerouslySetInnerHTML={{ __html: svg }} />
}

/** URL absolue d'une route du site (fonctionne avec n'importe quelle base). */
export function absoluteUrl(hash: string): string {
  const { origin, pathname } = window.location
  return `${origin}${pathname}${hash}`
}
