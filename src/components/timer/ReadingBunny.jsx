/**
 * Gece, pencerede hilal; yatakta sarı kitap okuyan pembe tavşan ve yanında uyuyan yeşil peluş.
 * Animasyonlar: yıldız parıltısı, tavşanın nefes alması, sayfa çevirme, peluşun "Zzz"leri.
 */
const O = '#0B0E14' // kontur

function Sparkle({ x, y, s = 1, delay = 0 }) {
  return (
    <path
      d={`M${x} ${y - 4 * s} L${x + 1.1 * s} ${y - 1.1 * s} L${x + 4 * s} ${y} L${x + 1.1 * s} ${y + 1.1 * s} L${x} ${y + 4 * s} L${x - 1.1 * s} ${y + 1.1 * s} L${x - 4 * s} ${y} L${x - 1.1 * s} ${y - 1.1 * s} Z`}
      fill="#F8E7A6"
      className="animate-twinkle"
      style={{ animationDelay: `${delay}s`, transformOrigin: `${x}px ${y}px`, transformBox: 'view-box' }}
    />
  )
}

export default function ReadingBunny({ paused = false, className = '' }) {
  const play = paused ? { animationPlayState: 'paused' } : undefined
  return (
    <svg viewBox="0 0 240 180" className={className} aria-hidden="true">
      <defs>
        <clipPath id="win-clip">
          <path d="M44 92 V42 A28 28 0 0 1 100 42 V92 Z" />
        </clipPath>
      </defs>

      {/* Pencere */}
      <path d="M38 96 V42 A34 34 0 0 1 106 42 V96 Z" fill="#EDE6D6" stroke={O} strokeWidth="3" strokeLinejoin="round" />
      <g clipPath="url(#win-clip)">
        <rect x="40" y="6" width="64" height="92" fill="#16223D" />
        <circle cx="86" cy="32" r="10" fill="#F6D76B" />
        <circle cx="91" cy="28" r="9" fill="#16223D" />
        <g style={play}>
          <Sparkle x={56} y={30} s={1} delay={0} />
          <Sparkle x={62} y={72} s={0.8} delay={0.9} />
          <Sparkle x={90} y={74} s={0.9} delay={1.7} />
          <Sparkle x={74} y={20} s={0.6} delay={0.5} />
        </g>
      </g>
      <path d="M44 92 V42 A28 28 0 0 1 100 42 V92 Z" fill="none" stroke={O} strokeWidth="2.5" />
      <line x1="72" y1="14" x2="72" y2="92" stroke="#EDE6D6" strokeWidth="5" />
      <line x1="44" y1="54" x2="100" y2="54" stroke="#EDE6D6" strokeWidth="5" />
      <line x1="72" y1="14" x2="72" y2="92" stroke={O} strokeWidth="1" opacity="0.5" />
      <rect x="34" y="94" width="76" height="7" rx="2" fill="#EDE6D6" stroke={O} strokeWidth="2.5" />

      {/* Yatak başlığı */}
      <rect x="168" y="66" width="30" height="88" rx="12" fill="#E7E1D4" stroke={O} strokeWidth="3" />
      <rect x="174" y="74" width="18" height="34" rx="7" fill="#D8D1C1" />

      {/* Yastık */}
      <ellipse cx="160" cy="106" rx="20" ry="12" fill="#FFFFFF" stroke={O} strokeWidth="2.5" />

      {/* Tavşan (nefes alır) */}
      <g className="animate-breathe" style={{ ...play, transformOrigin: '150px 132px', transformBox: 'view-box' }}>
        <ellipse cx="142" cy="44" rx="6" ry="18" transform="rotate(-12 142 44)" fill="#F2A7C3" stroke={O} strokeWidth="2.5" />
        <ellipse cx="142" cy="46" rx="2.6" ry="12" transform="rotate(-12 142 46)" fill="#F9D3E1" />
        <ellipse cx="158" cy="44" rx="6" ry="18" transform="rotate(16 158 44)" fill="#F2A7C3" stroke={O} strokeWidth="2.5" />
        <ellipse cx="158" cy="46" rx="2.6" ry="12" transform="rotate(16 158 46)" fill="#F9D3E1" />
        <ellipse cx="148" cy="112" rx="19" ry="22" fill="#F2A7C3" stroke={O} strokeWidth="2.5" />
        <circle cx="150" cy="78" r="17" fill="#F2A7C3" stroke={O} strokeWidth="2.5" />
        <path d="M139 80 q3 3 6 0" fill="none" stroke={O} strokeWidth="2" strokeLinecap="round" />
        <circle cx="140" cy="86" r="3" fill="#F57FA6" opacity="0.7" />
        <circle cx="160" cy="86" r="3" fill="#F57FA6" opacity="0.45" />
        <path d="M148 84 l2 2 l2 -2" fill="none" stroke={O} strokeWidth="1.6" strokeLinecap="round" />
      </g>

      {/* Şilte & battaniye */}
      <rect x="52" y="122" width="146" height="24" rx="6" fill="#F3EFE6" stroke={O} strokeWidth="3" />
      <path
        d="M54 130 C74 114 100 122 118 117 C140 111 166 121 196 117 L196 144 Q196 148 192 148 L58 148 Q54 148 54 144 Z"
        fill="#5B8DEF"
        stroke={O}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M70 138 q10 -4 20 0 M120 134 q10 -4 20 0 M160 136 q10 -4 20 0" fill="none" stroke="#86ABF4" strokeWidth="2.5" strokeLinecap="round" />

      {/* Kitap */}
      <g>
        <polygon points="112,98 130,104 130,120 112,114" fill="#F6C445" stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
        <polygon points="130,104 148,96 148,112 130,120" fill="#F8D26A" stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
        <polygon
          points="130,104 146,97.5 146,111 130,118"
          fill="#FFF3C9"
          stroke={O}
          strokeWidth="1.6"
          strokeLinejoin="round"
          className="satir-pageturn"
          style={{ ...play, transformOrigin: '130px 111px', transformBox: 'view-box' }}
        />
        <circle cx="114" cy="112" r="5" fill="#F2A7C3" stroke={O} strokeWidth="2.2" />
        <circle cx="146" cy="108" r="5" fill="#F2A7C3" stroke={O} strokeWidth="2.2" />
      </g>

      {/* Uyuyan yeşil peluş */}
      <g>
        <ellipse cx="84" cy="117" rx="18" ry="12" fill="#7BC47F" stroke={O} strokeWidth="2.5" />
        <circle cx="70" cy="108" r="10" fill="#7BC47F" stroke={O} strokeWidth="2.5" />
        <path d="M65 108 q2.5 2 5 0 M72 107 q2.5 2 5 0" fill="none" stroke={O} strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="88" cy="112" r="2.6" fill="#5FA765" />
        <circle cx="95" cy="118" r="2" fill="#5FA765" />
        <circle cx="80" cy="121" r="2.2" fill="#5FA765" />
      </g>
      <g fill="#C9D7F5" fontFamily="Newsreader, serif" fontWeight="600" style={play}>
        <text x="60" y="94" fontSize="10" className="animate-floatz" style={{ ...play, transformBox: 'view-box' }}>z</text>
        <text x="52" y="86" fontSize="8" className="animate-floatz" style={{ ...play, animationDelay: '1.4s', transformBox: 'view-box' }}>z</text>
      </g>

      {/* Yatak ayakları */}
      <rect x="54" y="146" width="144" height="12" rx="3" fill="#8A5A3B" stroke={O} strokeWidth="3" />
      <rect x="60" y="157" width="8" height="12" rx="2" fill="#6E452C" stroke={O} strokeWidth="2.5" />
      <rect x="184" y="157" width="8" height="12" rx="2" fill="#6E452C" stroke={O} strokeWidth="2.5" />
    </svg>
  )
}
