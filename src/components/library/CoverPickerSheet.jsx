import { useEffect, useRef, useState } from 'react'
import { Camera, Check, ImageOff } from 'lucide-react'
import BottomSheet from '../ui/BottomSheet'
import BookCover from '../BookCover'
import { findCoverCandidates } from '../../services/booksApi'
import { compressCover } from '../../utils/helpers'
import { useUI } from '../../context/UIContext'

/**
 * Kapak seçici: aynı kitabın Google Books'taki kapaklı baskıları + kendi fotoğrafını yükleme.
 * onPick({ coverUrl, coverThumb })
 */
export default function CoverPickerSheet({ open, onClose, title, author, current, onPick, zIndex = 78 }) {
  const { toast } = useUI()
  const fileRef = useRef(null)
  const [items, setItems] = useState(null)

  useEffect(() => {
    if (!open || !title) return
    setItems(null)
    const ctrl = new AbortController()
    findCoverCandidates(title, author, { signal: ctrl.signal })
      .then(setItems)
      .catch((e) => e.name !== 'AbortError' && setItems([]))
    return () => ctrl.abort()
  }, [open, title, author])

  const pick = (c) => {
    onPick({ coverUrl: c.coverUrl, coverThumb: c.coverThumb || '' })
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} zIndex={zIndex}>
      <div className="pb-4">
        <h2 className="font-serif text-[20px]">Kapak seç</h2>
        <p className="mt-1 text-[14px] text-mute">Aynı kitabın diğer baskılarından seç ya da kendi fotoğrafını yükle.</p>

        <button
          onClick={() => fileRef.current?.click()}
          className="press mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-accent/[0.12] text-[15px] font-medium text-accent ring-1 ring-accent/30"
        >
          <Camera size={18} /> Fotoğraf yükle
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (!f) return
            try {
              const url = await compressCover(f)
              pick({ coverUrl: url, coverThumb: '' })
            } catch (err) {
              toast(err.message, 'error')
            }
          }}
        />

        <div className="section-label mb-3 mt-6">Baskılar</div>
        {items === null ? (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="aspect-[2/3] animate-shimmer rounded-xl bg-[length:200%_100%] bg-gradient-to-r from-card via-card-3 to-card" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <ImageOff size={26} className="text-mute" />
            <p className="mt-2 max-w-[260px] text-[14px] text-mute">
              Google Books’ta bu kitabın kapaklı bir baskısı yok. Kapağın fotoğrafını çekip yükleyebilirsin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {items.map((c) => {
              const selected = current && (current === c.coverUrl || current === c.coverThumb)
              return (
                <button key={c.coverUrl} onClick={() => pick(c)} className="press text-left">
                  <BookCover
                    book={{ coverUrl: c.coverUrl, coverThumb: c.coverThumb, title }}
                    className={`aspect-[2/3] w-full ${selected ? 'ring-2 ring-accent' : ''}`}
                    compact
                    autoResolve={false}
                  >
                    {selected && (
                      <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-ink">
                        <Check size={14} strokeWidth={3} />
                      </span>
                    )}
                  </BookCover>
                  {c.label && <div className="mt-1 truncate text-[11.5px] text-mute">{c.label}</div>}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </BottomSheet>
  )
}
