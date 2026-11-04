import { useEffect, useMemo, useRef, useState } from 'react'
import { resolveCover } from '../services/booksApi'

const PALETTES = [
  ['#2B3A55', '#1A2336', '#E8D9B5'],
  ['#4A2C3A', '#2A1822', '#F1C8C8'],
  ['#233F3A', '#13241F', '#CFE6D6'],
  ['#3D3352', '#221C30', '#DCCFF2'],
  ['#4D3B22', '#2A2012', '#F2DDB0'],
  ['#203448', '#121F2C', '#BFD6EE'],
]

function hash(str = '') {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

/** Kapak yoksa şık tipografik kapak */
export function TypographicCover({ title = '', author = '', compact = false }) {
  const [a, b, fg] = PALETTES[hash(title) % PALETTES.length]
  return (
    <div
      className="relative flex h-full w-full flex-col justify-between overflow-hidden p-[9%]"
      style={{ background: `linear-gradient(160deg, ${a}, ${b})`, color: fg }}
    >
      <div className="absolute inset-y-0 left-[6%] w-px bg-white/10" />
      <div className="h-[2px] w-1/3 rounded-full" style={{ background: fg, opacity: 0.5 }} />
      <div
        className={`font-serif leading-[1.1] ${compact ? 'text-[10px]' : 'text-[clamp(11px,4.2cqw,20px)]'} line-clamp-4`}
        style={{ fontWeight: 500 }}
      >
        {title}
      </div>
      {!compact && (
        <div className="truncate text-[clamp(8px,2.6cqw,12px)] uppercase tracking-[0.12em] opacity-70">{author}</div>
      )}
    </div>
  )
}

/**
 * Kitap kapağı: yüksek çözünürlük → küçük görsel → tipografik kapak sırasıyla dener.
 */
export default function BookCover({
  book,
  className = '',
  rounded = 'rounded-xl',
  compact = false,
  autoResolve = true,
  children,
}) {
  const title = book?.title || book?.bookTitle || ''
  const author = book?.author || book?.bookAuthor || ''
  const [resolved, setResolved] = useState(null)
  const candidates = useMemo(
    () => [...new Set([book?.coverUrl, book?.coverThumb, book?.bookCover, resolved?.coverUrl, resolved?.coverThumb].filter(Boolean))],
    [book?.coverUrl, book?.coverThumb, book?.bookCover, resolved],
  )
  const [idx, setIdx] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const keyRef = useRef(candidates.join('|'))
  useEffect(() => {
    const key = candidates.join('|')
    if (key === keyRef.current) return // ilk render'da sıfırlama yok (önbellekteki görsel zaten yüklenmiş olabilir)
    keyRef.current = key
    setIdx(0)
    setLoaded(false)
  }, [candidates])

  // Kapak yoksa (veya tüm adaylar başarısızsa) önbellekli kuyruktan bul
  const exhausted = idx >= candidates.length
  useEffect(() => {
    if (!autoResolve || !title || resolved || !exhausted) return
    let alive = true
    resolveCover(title, author).then((hit) => alive && hit && setResolved(hit))
    return () => {
      alive = false
    }
  }, [autoResolve, title, author, resolved, exhausted])

  const src = candidates[idx]

  return (
    <div
      className={`relative overflow-hidden bg-card-3 ${rounded} ${className}`}
      style={{ containerType: 'inline-size' }}
    >
      {(!src || !loaded) && (
        <div className="absolute inset-0">
          <TypographicCover title={title} author={author} compact={compact} />
        </div>
      )}
      {src && (
        <img
          key={src}
          ref={(el) => {
            if (el && el.complete && el.naturalWidth > 2 && !loaded) setLoaded(true)
          }}
          src={src}
          alt={title}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={(e) => {
            // Google bazen 1x1 boş görsel döndürür
            if (e.currentTarget.naturalWidth <= 2) setIdx((i) => i + 1)
            else setLoaded(true)
          }}
          onError={() => {
            setLoaded(false)
            setIdx((i) => i + 1)
          }}
        />
      )}
      <div className={`pointer-events-none absolute inset-0 ${rounded} ring-1 ring-inset ring-white/[0.06]`} />
      {children}
    </div>
  )
}
