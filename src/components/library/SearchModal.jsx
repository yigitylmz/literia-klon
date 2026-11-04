import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, X, Check, Globe2, ScanLine } from 'lucide-react'
import BookCover from '../BookCover'
import AddBookSheet from './AddBookSheet'
import { searchBooks } from '../../services/booksApi'
import { useData } from '../../context/DataContext'

const SHIMMER = 'animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-card via-card-3 to-card'

function Skeleton() {
  return (
    <div>
      <div className={`aspect-[2/3] w-full rounded-[12px] ${SHIMMER}`} />
      <div className={`mt-2 h-3.5 w-4/5 rounded ${SHIMMER}`} />
      <div className={`mt-1.5 h-3 w-1/2 rounded ${SHIMMER}`} />
    </div>
  )
}

/** Tam ekran dünya geneli kitap arama (Google Books) */
export default function SearchModal({ open, onClose }) {
  const { books } = useData()
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [status, setStatus] = useState('idle') // idle | loading | done | error
  const [selected, setSelected] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [retry, setRetry] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 250)
    else {
      setQ('')
      setResults([])
      setStatus('idle')
    }
  }, [open])

  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) {
      setResults([])
      setStatus('idle')
      return
    }
    setStatus('loading')
    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      try {
        const res = await searchBooks(term, { signal: ctrl.signal })
        setResults(res)
        setStatus('done')
      } catch (e) {
        if (e.name !== 'AbortError') {
          setErrorMsg(e.status === 429 ? e.message : 'Google Books şu an yanıt vermiyor.')
          setStatus('error')
        }
      }
    }, 420)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [q, retry])

  const inLibrary = (r) =>
    books.some(
      (b) =>
        (r.googleBooksId && b.googleBooksId === r.googleBooksId) ||
        (b.title?.toLocaleLowerCase('tr') === r.title?.toLocaleLowerCase('tr') && (b.author || '') === (r.author || '')),
    )

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[55] flex flex-col bg-ink/95 backdrop-blur-xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: 'spring', damping: 32, stiffness: 340 }}
        >
          <div className="mx-auto flex h-full w-full max-w-[560px] flex-col px-5 pt-safe">
            <div className="flex items-center gap-3 py-3">
              <div className="flex h-12 flex-1 items-center gap-2.5 rounded-2xl bg-card px-4 hairline focus-within:border-accent/50">
                <Search size={19} className="shrink-0 text-mute" />
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Kitap adı, yazar veya ISBN"
                  className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-mute-2"
                  enterKeyHint="search"
                  autoCorrect="off"
                  autoCapitalize="off"
                />
                {q && (
                  <button onClick={() => setQ('')} className="press text-mute" aria-label="Temizle">
                    <X size={18} />
                  </button>
                )}
              </div>
              <button onClick={onClose} className="press text-[16px] text-accent">
                Vazgeç
              </button>
            </div>

            <div className="no-scrollbar scroll-touch -mx-5 flex-1 overflow-y-auto px-5 pb-safe">
              {status === 'idle' && (
                <div className="flex flex-col items-center px-6 pt-20 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-card hairline">
                    <Globe2 size={28} className="text-accent" strokeWidth={1.6} />
                  </div>
                  <div className="mt-4 font-serif text-[18px]">Dünyadaki tüm kitaplar</div>
                  <p className="mt-2 max-w-[290px] text-[15px] leading-relaxed text-mute">
                    Türkçe ya da yabancı; kitap adı, yazar veya <ScanLine size={14} className="inline" /> ISBN yazarak ara.
                  </p>
                </div>
              )}
              {status === 'loading' && (
                <div className="grid grid-cols-3 gap-x-3 gap-y-5 pt-2">
                  {Array.from({ length: 9 }, (_, i) => (
                    <Skeleton key={i} />
                  ))}
                </div>
              )}
              {status === 'error' && (
                <div className="flex flex-col items-center pt-16 text-center">
                  <p className="text-[15px] text-mute">{errorMsg || 'Kitap servisine ulaşılamadı.'}</p>
                  <button onClick={() => setRetry((n) => n + 1)} className="btn-dark mt-4 h-10 px-5 text-[14px]">
                    Tekrar dene
                  </button>
                </div>
              )}
              {status === 'done' && results.length === 0 && (
                <p className="pt-16 text-center text-[15px] text-mute">“{q}” için sonuç bulunamadı.</p>
              )}
              {status === 'done' && results.length > 0 && (
                <div className="grid grid-cols-3 gap-x-3 gap-y-5 pb-8 pt-2">
                  {results.map((r, i) => {
                    const has = inLibrary(r)
                    return (
                      <motion.button
                        key={`${r.googleBooksId}-${i}`}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i, 12) * 0.02 }}
                        onClick={() => setSelected(r)}
                        className="press min-w-0 text-left"
                      >
                        <BookCover book={r} className="aspect-[2/3] w-full shadow-lg" rounded="rounded-[12px]" autoResolve={false}>
                          {has && (
                            <span className="absolute right-1.5 top-1.5 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-ok ring-2 ring-black/30">
                              <Check size={13} strokeWidth={3.2} className="text-[#0B2A18]" />
                            </span>
                          )}
                        </BookCover>
                        <div className="mt-2 line-clamp-2 text-[14px] font-medium leading-snug text-white/95">{r.title}</div>
                        <div className="mt-0.5 truncate text-[12.5px] text-mute">{r.author || 'Yazar bilinmiyor'}</div>
                      </motion.button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <AddBookSheet result={selected} open={Boolean(selected)} onClose={() => setSelected(null)} />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
