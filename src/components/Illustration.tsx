// Illustrations originales (SVG) des hébergements de démo : aucune photo.
import type { Guide } from '../content/schema'

type Kind = Guide['illustration']

function Pine({ x, y, s = 1, c }: { x: number; y: number; s?: number; c: string }) {
  return <path d={`M${x} ${y - 46 * s} l${14 * s} ${22 * s} h${-6 * s} l${12 * s} ${18 * s} h${-8 * s} l${10 * s} ${14 * s} h${-44 * s} l${10 * s} ${-14 * s} h${-8 * s} l${12 * s} ${-18 * s} h${-6 * s}z`} fill={c} />
}

function Winter() {
  return (
    <>
      <defs>
        <linearGradient id="w-sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#1b2f45" />
          <stop offset="1" stopColor="#5d7f99" />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill="url(#w-sky)" />
      <circle cx="318" cy="46" r="16" fill="#f4ecd6" />
      {[[40, 30], [90, 18], [150, 40], [210, 22], [260, 52], [360, 28], [120, 70], [380, 80]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="1.3" fill="#f4ecd6" opacity="0.8" />
      ))}
      <path d="M0 120 L70 78 L130 112 L200 70 L270 108 L330 82 L400 116 V200 H0Z" fill="#30495e" />
      <path d="M0 140 Q100 128 200 138 T400 134 V200 H0Z" fill="#dfe8ee" />
      <path d="M0 162 Q120 152 240 160 T400 156 V200 H0Z" fill="#b9cddb" />
      {[18, 46, 300, 334, 372].map((x, i) => <Pine key={x} x={x} y={150 + (i % 2) * 6} s={0.9 + (i % 3) * 0.12} c="#1d3a30" />)}
      <g transform="translate(150 104)">
        <path d="M-6 30 L40 0 L86 30Z" fill="#f2f5f7" />
        <rect x="2" y="28" width="76" height="34" fill="#7a4a2b" />
        {[34, 40, 46, 52, 58].map((y) => <rect key={y} x="2" y={y} width="76" height="1.5" fill="#5e371f" />)}
        <rect x="14" y="38" width="14" height="12" fill="#f6c76b" />
        <rect x="52" y="38" width="14" height="12" fill="#f6c76b" />
        <rect x="34" y="42" width="12" height="20" fill="#3d2414" />
        <rect x="62" y="6" width="8" height="18" fill="#5e371f" />
      </g>
      <ellipse cx="270" cy="170" rx="26" ry="7" fill="#7fa6bd" opacity="0.7" />
      <path d="M252 166 q18 -16 36 0" fill="none" stroke="#f2f5f7" strokeWidth="2" opacity="0.8" />
    </>
  )
}

function River() {
  return (
    <>
      <rect width="400" height="200" fill="#cfe1e6" />
      <circle cx="80" cy="56" r="20" fill="#f7e3b5" />
      <path d="M0 96 Q60 60 120 84 T240 70 T400 88 V130 H0Z" fill="#5f7f8e" />
      <path d="M0 110 Q80 86 160 104 T320 96 T400 104 V140 H0Z" fill="#3f6475" />
      <rect y="124" width="400" height="40" fill="#7fa9bb" />
      {[30, 110, 190, 270, 350].map((x) => <path key={x} d={`M${x} 140 h28`} stroke="#d9ecf2" strokeWidth="2" strokeLinecap="round" />)}
      <path d="M0 158 Q100 150 200 160 T400 156 V200 H0Z" fill="#a9906a" />
      <path d="M0 176 Q120 168 240 178 T400 174 V200 H0Z" fill="#7a6a49" />
      <g transform="translate(226 128)">
        <path d="M-4 22 L30 0 L64 22Z" fill="#7d2f22" />
        <rect x="2" y="20" width="56" height="26" fill="#d9cfbf" />
        <rect x="10" y="27" width="10" height="9" fill="#2f4b58" />
        <rect x="40" y="27" width="10" height="9" fill="#2f4b58" />
        <rect x="25" y="30" width="10" height="16" fill="#5a3b2a" />
      </g>
      <path d="M318 132 q8 -5 16 0" fill="none" stroke="#f4f6f7" strokeWidth="2.5" strokeLinecap="round" />
    </>
  )
}

function Maple() {
  const tree = (x: number, y: number, c: string, s = 1) => (
    <g key={`${x}`} transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-2" y="0" width="4" height="22" fill="#4a3424" />
      <circle cx="0" cy="-6" r="16" fill={c} />
      <circle cx="-10" cy="2" r="10" fill={c} />
      <circle cx="10" cy="2" r="10" fill={c} />
    </g>
  )
  return (
    <>
      <rect width="400" height="200" fill="#f1dcc0" />
      <circle cx="320" cy="50" r="22" fill="#f6b46b" opacity="0.85" />
      <path d="M0 110 Q90 70 180 100 T400 92 V200 H0Z" fill="#c9a26b" />
      <path d="M0 134 Q120 104 240 128 T400 120 V200 H0Z" fill="#8f9b5a" />
      <path d="M0 160 Q140 140 280 156 T400 150 V200 H0Z" fill="#5f7a43" />
      {tree(40, 128, '#c2462b')}
      {tree(78, 120, '#e07b2c', 0.9)}
      {tree(330, 124, '#d4572a', 1.05)}
      {tree(366, 130, '#e9a23b', 0.85)}
      <g transform="translate(160 112)">
        <rect x="0" y="18" width="70" height="36" fill="#a2382a" />
        <path d="M-4 20 L35 -2 L74 20Z" fill="#3b3b3b" />
        <rect x="26" y="32" width="18" height="22" fill="#f2e6cf" />
        <path d="M26 32 l18 22 M44 32 l-18 22" stroke="#a2382a" strokeWidth="2" />
        <rect x="76" y="26" width="34" height="28" fill="#efe4cf" />
        <path d="M72 28 L93 12 L114 28Z" fill="#5b4a3a" />
        <rect x="84" y="34" width="8" height="8" fill="#5a6f7a" />
      </g>
      <ellipse cx="280" cy="176" rx="34" ry="8" fill="#7fa6b0" />
    </>
  )
}

function Provence() {
  return (
    <>
      <rect width="400" height="200" fill="#f4dfb8" />
      <circle cx="310" cy="54" r="24" fill="#f7c66a" />
      <path d="M0 104 Q100 70 200 96 T400 88 V200 H0Z" fill="#b9a585" />
      <path d="M0 126 Q120 106 240 122 T400 118 V200 H0Z" fill="#9aa06a" />
      <rect y="140" width="400" height="60" fill="#8a76b3" />
      {[148, 160, 172, 184, 196].map((y, i) => <path key={y} d={`M0 ${y} Q200 ${y - 6 - i} 400 ${y}`} stroke="#6b5a99" strokeWidth="5" fill="none" />)}
      <g transform="translate(168 96)">
        <rect x="0" y="16" width="86" height="38" fill="#e7d3ad" />
        <path d="M-6 18 L43 0 L92 18Z" fill="#c26a3d" />
        {[12, 36, 60].map((x) => (
          <g key={x}>
            <rect x={x} y="26" width="12" height="14" fill="#3d5d6b" />
            <rect x={x - 3} y="26" width="3" height="14" fill="#6f8f6a" />
            <rect x={x + 12} y="26" width="3" height="14" fill="#6f8f6a" />
          </g>
        ))}
      </g>
      {[[52, 120], [100, 128], [320, 122]].map(([x, y]) => (
        <g key={x} transform={`translate(${x} ${y})`}>
          <path d="M0 26 q-2 -12 2 -22" stroke="#5b4a3a" strokeWidth="4" fill="none" />
          <ellipse cx="2" cy="-4" rx="22" ry="13" fill="#7d8c5c" />
          <ellipse cx="-8" cy="2" rx="12" ry="8" fill="#8f9e6c" />
        </g>
      ))}
      <path d="M372 134 l6 -60 l6 60z" fill="#3e5a3a" />
    </>
  )
}

function Normandy() {
  return (
    <>
      <rect width="400" height="200" fill="#d9e4e2" />
      <path d="M0 70 q40 -18 80 0 q30 -14 60 0" fill="#f2f5f4" opacity="0.9" />
      <path d="M240 52 q30 -14 60 0 q30 -12 56 2" fill="#f2f5f4" opacity="0.9" />
      <path d="M0 118 Q100 92 200 112 T400 104 V200 H0Z" fill="#8fb27a" />
      <path d="M0 146 Q120 128 240 142 T400 136 V200 H0Z" fill="#6c9a5c" />
      <g transform="translate(140 92)">
        <path d="M-10 30 L60 -6 L130 30Z" fill="#4d4038" />
        <rect x="0" y="28" width="120" height="44" fill="#f4ecdc" />
        {[0, 24, 48, 72, 96, 118].map((x) => <rect key={x} x={x} y="28" width="4" height="44" fill="#5b3a2a" />)}
        <path d="M4 50 L24 30 M28 50 L48 30 M76 50 L96 30" stroke="#5b3a2a" strokeWidth="3" />
        <rect x="0" y="48" width="120" height="4" fill="#5b3a2a" />
        <rect x="52" y="54" width="16" height="18" fill="#7b2e3a" />
        <rect x="30" y="56" width="12" height="10" fill="#f6c76b" />
        <rect x="80" y="56" width="12" height="10" fill="#f6c76b" />
      </g>
      {[[44, 140], [92, 150], [312, 146], [356, 138]].map(([x, y]) => (
        <g key={x} transform={`translate(${x} ${y})`}>
          <rect x="-2" y="0" width="4" height="18" fill="#5b4a3a" />
          <circle cx="0" cy="-6" r="14" fill="#4f7d45" />
          {[[-6, -8], [5, -2], [2, -12], [-3, 0]].map(([a, b]) => <circle key={`${a}${b}`} cx={a} cy={b} r="2.2" fill="#c9372c" />)}
        </g>
      ))}
    </>
  )
}

const scenes: Record<Kind, () => React.ReactElement> = { winter: Winter, river: River, maple: Maple, provence: Provence, normandy: Normandy }

export function Illustration({ kind, className }: { kind: Kind; className?: string }) {
  const Scene = scenes[kind]
  return (
    <svg className={`illus ${className ?? ''}`} viewBox="0 0 400 200" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <Scene />
    </svg>
  )
}
