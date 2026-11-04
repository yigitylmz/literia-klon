import { useEffect, useState } from 'react'
import { Heart, Trash2, Play, SquarePen, BookOpen, Bookmark, CheckCircle2, Star, ImagePlus } from 'lucide-react'
import CoverPickerSheet from './CoverPickerSheet'
import BottomSheet from '../ui/BottomSheet'
import BookCover from '../BookCover'
import { ProgressBar, Stars } from '../ui/primitives'
import { useData } from '../../context/DataContext'
import { useAuth } from '../../context/AuthContext'
import { useUI } from '../../context/UIContext'
import { useTimer } from '../../context/TimerContext'
import { bookPercent } from '../../utils/statsCalculator'
import { formatDayMonthYear, toMillis } from '../../utils/date'
import { favSnapshot } from '../../utils/helpers'

export const SHELVES = [
  { value: 'reading', label: 'Okuyorum', icon: BookOpen },
  { value: 'want_to_read', label: 'Okuyacağım', icon: Bookmark },
  { value: 'completed', label: 'Okudum', icon: CheckCircle2 },
]

export default function BookDetailSheet({ book, open, onClose, readOnly = false, onProgress }) {
  const data = useData()
  const { profile } = useAuth()
  const { toast, confirm, openRating } = useUI()
  const timer = useTimer()
  const live = (!readOnly && book && data.bookById(book.id)) || book
  const [pages, setPages] = useState('')
  const [coverOpen, setCoverOpen] = useState(false)

  useEffect(() => {
    if (open && live) setPages(String(live.totalPages || ''))
  }, [open, live?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!live) return <BottomSheet open={false} onClose={onClose} />

  const favorites = profile?.favorites || []
  const isFav = favorites.some((f) => f.bookId === live.id)
  const pct = bookPercent(live)

  const setShelf = async (status) => {
    if (status === live.status) return
    const now = new Date().toISOString()
    if (status === 'completed') {
      await data.updateBook(live.id, { status, completedAt: now, currentPage: live.totalPages })
      toast('Okuduklarına eklendi')
      onClose()
      setTimeout(() => openRating(live), 350)
      return
    }
    await data.updateBook(live.id, {
      status,
      completedAt: null,
      startedAt: status === 'reading' ? live.startedAt || now : live.startedAt || null,
      currentPage: live.status === 'completed' ? 0 : live.currentPage,
    })
    toast(status === 'reading' ? 'Okuduklarına taşındı' : 'Okuyacaklarına taşındı')
  }

  const toggleFav = async () => {
    if (isFav) {
      await data.setFavorites(favorites.filter((f) => f.bookId !== live.id))
      toast('Favorilerden çıkarıldı', 'info')
    } else {
      if (favorites.length >= 4) return toast('En fazla 4 favori seçebilirsin', 'error')
      await data.setFavorites([...favorites, favSnapshot(live)])
      toast('Favorilere eklendi')
    }
  }

  const savePages = async () => {
    const n = Math.round(Number(pages))
    if (!n || n < 1) return setPages(String(live.totalPages))
    if (n !== live.totalPages) {
      await data.updateBook(live.id, { totalPages: n, currentPage: Math.min(live.currentPage || 0, n) })
      toast('Sayfa sayısı güncellendi')
    }
  }

  const remove = async () => {
    const ok = await confirm({
      title: 'Kitabı sil?',
      message: `"${live.title}" kitaplığından kaldırılacak. Okuma geçmişin takvimde kalmaya devam eder.`,
      confirmText: 'Sil',
      destructive: true,
    })
    if (!ok) return
    if (timer.timer?.book?.id === live.id) timer.discard()
    await data.deleteBook(live.id)
    onClose()
    toast('Kitap silindi', 'info')
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="pb-4">
        <div className="flex gap-4">
          {readOnly ? (
            <BookCover book={live} className="aspect-[2/3] w-[100px] shrink-0 shadow-glass" />
          ) : (
            <button onClick={() => setCoverOpen(true)} className="press relative shrink-0" aria-label="Kapağı değiştir">
              <BookCover book={live} className="aspect-[2/3] w-[100px] shadow-glass" />
              <span className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-ink ring-[3px] ring-card-2">
                <ImagePlus size={14} />
              </span>
            </button>
          )}
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 className="font-serif text-[19px] leading-[1.15] text-balance">{live.title}</h2>
            <div className="mt-1 text-[14.5px] text-mute">{live.author}</div>
            {live.status === 'completed' && live.rating ? <Stars value={live.rating} size={18} className="mt-3" /> : null}
            {live.status === 'completed' && live.completedAt && (
              <div className="mt-2 text-[14px] text-mute">
                Bitirildi · {formatDayMonthYear(new Date(toMillis(live.completedAt)))}
              </div>
            )}
            {!readOnly && (
              <button
                onClick={toggleFav}
                className={`press mt-4 flex items-center gap-2 rounded-full px-3.5 py-2 text-[14.5px] hairline ${
                  isFav ? 'bg-[#E5484D]/15 text-[#FF8A8E]' : 'bg-white/[0.05] text-white/85'
                }`}
              >
                <Heart size={16} className={isFav ? 'fill-current' : ''} />
                {isFav ? 'Favorilerde' : 'Favorilere ekle'}
              </button>
            )}
          </div>
        </div>

        {live.status === 'reading' && (
          <div className="mt-6">
            <div className="flex justify-between text-[15.5px] text-mute">
              <span>
                Sayfa <span className="font-semibold text-white">{live.currentPage || 0}</span>/{live.totalPages}
              </span>
              <span>%{pct}</span>
            </div>
            <ProgressBar value={pct} className="mt-2" />
          </div>
        )}

        {!readOnly && (
          <>
            <div className="section-label mt-7">Raf</div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {SHELVES.map((s) => {
                const active = live.status === s.value
                const Icon = s.icon
                return (
                  <button
                    key={s.value}
                    onClick={() => setShelf(s.value)}
                    className={`press flex flex-col items-center gap-1.5 rounded-2xl py-3 text-[14px] transition-colors ${
                      active ? 'bg-accent/15 text-accent ring-1 ring-accent/50' : 'bg-white/[0.04] text-white/80 hairline'
                    }`}
                  >
                    <Icon size={20} />
                    {s.label}
                  </button>
                )
              })}
            </div>

            {live.status === 'reading' && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    onClose()
                    if (timer.timer) return timer.expand()
                    timer.start(live)
                  }}
                  className="btn-primary h-12 text-[16px]"
                >
                  <Play size={18} className="fill-current" />
                  {timer.timer?.book?.id === live.id ? 'Sayaca dön' : 'Okumaya başla'}
                </button>
                <button
                  onClick={() => {
                    onClose()
                    setTimeout(() => onProgress?.(live), 250)
                  }}
                  className="btn-dark h-12 text-[16px]"
                >
                  <SquarePen size={18} /> İlerleme gir
                </button>
              </div>
            )}

            {live.status === 'completed' && (
              <button
                onClick={() => {
                  onClose()
                  setTimeout(() => openRating(live), 250)
                }}
                className="btn-dark mt-4 h-12 w-full text-[16px]"
              >
                <Star size={18} /> {live.rating ? 'İncelemeni düzenle' : 'Puanla ve incele'}
              </button>
            )}

            <div className="mt-6 flex items-center justify-between rounded-2xl bg-ink-850 px-4 py-3 hairline">
              <span className="text-[15.5px] text-white/85">Toplam sayfa</span>
              <input
                type="text"
                inputMode="numeric"
                value={pages}
                onChange={(e) => setPages(e.target.value.replace(/\D/g, '').slice(0, 5))}
                onBlur={savePages}
                className="w-24 bg-transparent text-right text-[16px] font-semibold tabular outline-none"
              />
            </div>
          </>
        )}

        {live.reviewText ? (
          <div className="mt-6 rounded-2xl bg-white/[0.03] p-4 hairline">
            <div className="section-label">İnceleme</div>
            <p className="mt-2 whitespace-pre-line font-serif text-[16px] leading-relaxed text-white/90">{live.reviewText}</p>
          </div>
        ) : null}

        {!readOnly && (
          <button onClick={remove} className="press mx-auto mt-6 flex items-center gap-2 px-4 py-2 text-[15px] text-[#FF7A7E]">
            <Trash2 size={17} /> Kitaplıktan kaldır
          </button>
        )}
      </div>
      {!readOnly && (
        <CoverPickerSheet
          open={coverOpen}
          onClose={() => setCoverOpen(false)}
          title={live.title}
          author={live.author}
          current={live.coverUrl}
          onPick={async (c) => {
            await data.setCover(live.id, c)
            toast('Kapak güncellendi')
          }}
        />
      )}
    </BottomSheet>
  )
}
