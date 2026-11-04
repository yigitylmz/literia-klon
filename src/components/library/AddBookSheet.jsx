import { useEffect, useState } from 'react'
import { ImagePlus } from 'lucide-react'
import BottomSheet from '../ui/BottomSheet'
import BookCover from '../BookCover'
import { Stars } from '../ui/primitives'
import { SHELVES } from './BookDetailSheet'
import CoverPickerSheet from './CoverPickerSheet'
import { useData } from '../../context/DataContext'
import { useUI } from '../../context/UIContext'

/** Arama sonucunu kitaplığa ekleme: raf + sayfa sayısı (+ mevcut sayfa / puan / kapak) */
export default function AddBookSheet({ result, open, onClose, onAdded }) {
  const { addBookFromSearch } = useData()
  const { toast } = useUI()
  const [status, setStatus] = useState('want_to_read')
  const [total, setTotal] = useState('')
  const [current, setCurrent] = useState('')
  const [rating, setRating] = useState(0)
  const [cover, setCover] = useState(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && result) {
      setStatus('want_to_read')
      setTotal(result.totalPages ? String(result.totalPages) : '')
      setCurrent('')
      setRating(0)
      setCover(null)
    }
  }, [open, result])

  if (!result) return <BottomSheet open={false} onClose={onClose} />
  const book = cover ? { ...result, ...cover } : result

  const add = async () => {
    const t = Number(total)
    if (!t || t < 1) return toast('Toplam sayfa sayısını gir', 'error')
    setSaving(true)
    try {
      const res = await addBookFromSearch(book, {
        status,
        totalPages: t,
        currentPage: Number(current) || 0,
        rating: rating || null,
      })
      if (res.duplicate) toast('Bu kitap zaten kitaplığında', 'info')
      else toast('Kitaplığa eklendi')
      onAdded?.(res)
      onClose()
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} zIndex={70}>
      <div className="pb-4">
        <div className="flex gap-4">
          <button onClick={() => setPickerOpen(true)} className="press relative shrink-0" aria-label="Kapak seç">
            <BookCover book={book} className="aspect-[2/3] w-[84px] shadow-glass" />
            <span className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-ink ring-[3px] ring-card-2">
              <ImagePlus size={14} />
            </span>
          </button>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 className="line-clamp-3 font-serif text-[18px] leading-[1.15]">{result.title}</h2>
            <div className="mt-1 truncate text-[14.5px] text-mute">{result.author || 'Yazar bilinmiyor'}</div>
            <div className="mt-1.5 text-[12.5px] text-mute-2">{[result.publisher, result.year].filter(Boolean).join(' · ')}</div>
            <button onClick={() => setPickerOpen(true)} className="press mt-2 text-[13.5px] font-medium text-accent">
              {book.coverUrl ? 'Kapağı değiştir' : 'Kapak seç'}
            </button>
          </div>
        </div>

        <div className="section-label mt-6">Hangi rafa?</div>
        <div className="mt-2.5 grid grid-cols-3 gap-2">
          {SHELVES.map((s) => {
            const Icon = s.icon
            const active = status === s.value
            return (
              <button
                key={s.value}
                onClick={() => setStatus(s.value)}
                className={`press flex flex-col items-center gap-1 rounded-2xl py-3 text-[13.5px] transition-colors ${
                  active ? 'bg-accent/15 text-accent ring-1 ring-accent/50' : 'bg-white/[0.04] text-white/80 hairline'
                }`}
              >
                <Icon size={19} />
                {s.label}
              </button>
            )
          })}
        </div>

        <div className="mt-4 space-y-2.5">
          <label className="flex items-center justify-between rounded-2xl bg-ink-850 px-4 py-3 hairline">
            <span className="text-[14.5px] text-white/85">
              Toplam sayfa <span className="text-[12.5px] text-mute">(kendi baskın)</span>
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={total}
              placeholder="0"
              onChange={(e) => setTotal(e.target.value.replace(/\D/g, '').slice(0, 5))}
              className="w-20 bg-transparent text-right text-[16px] font-semibold tabular outline-none placeholder:text-mute-2"
            />
          </label>
          {status === 'reading' && (
            <label className="flex items-center justify-between rounded-2xl bg-ink-850 px-4 py-3 hairline">
              <span className="text-[14.5px] text-white/85">
                Kaçıncı sayfadasın? <span className="text-[12.5px] text-mute">(isteğe bağlı)</span>
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={current}
                placeholder="0"
                onChange={(e) => setCurrent(e.target.value.replace(/\D/g, '').slice(0, 5))}
                className="w-20 bg-transparent text-right text-[16px] font-semibold tabular outline-none placeholder:text-mute-2"
              />
            </label>
          )}
          {status === 'completed' && (
            <div className="flex items-center justify-between rounded-2xl bg-ink-850 px-4 py-1.5 hairline">
              <span className="text-[14.5px] text-white/85">Puanın</span>
              <Stars value={rating} onChange={setRating} size={22} gap="gap-0" />
            </div>
          )}
        </div>

        <button onClick={add} disabled={saving} className="btn-primary mt-5 h-[46px] w-full text-[15px]">
          Kitaplığa ekle
        </button>
      </div>

      <CoverPickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title={result.title}
        author={result.author}
        current={book.coverUrl}
        onPick={setCover}
      />
    </BottomSheet>
  )
}
