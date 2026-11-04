import { useEffect, useState } from 'react'
import BottomSheet from './ui/BottomSheet'
import BookCover from './BookCover'
import { Stars } from './ui/primitives'
import { useData } from '../context/DataContext'
import { useUI } from '../context/UIContext'

const LABELS = ['', 'Beğenmedim', 'İdare eder', 'İyiydi', 'Çok iyi', 'Muhteşem']

/** Kitap bitirince açılan 1–5 yıldız puanlama + inceleme paneli */
export default function RatingSheet({ book, onClose }) {
  const { rateBook, bookById } = useData()
  const { toast } = useUI()
  const live = book ? bookById(book.id) || book : null
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (book) {
      setRating(live?.rating || 0)
      setText(live?.reviewText || '')
    }
  }, [book?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    setSaving(true)
    try {
      await rateBook(live.id, rating, text.trim())
      toast(rating ? 'İncelemen kaydedildi' : 'Kaydedildi')
      onClose()
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet open={Boolean(book)} onClose={onClose} zIndex={80}>
      {live && (
        <div className="pb-4">
          <div className="flex flex-col items-center pt-2 text-center">
            <BookCover book={live} className="aspect-[2/3] w-[110px] shadow-glass" />
            <div className="mt-4 text-[13px] font-medium uppercase tracking-[0.16em] text-accent">
              {live.status === 'completed' ? 'Kitabı bitirdin' : 'Değerlendir'}
            </div>
            <h2 className="mt-1 font-serif text-[20px] leading-tight text-balance">{live.title}</h2>
            <div className="mt-1 text-[15px] text-mute">{live.author}</div>
            <Stars value={rating} onChange={setRating} size={34} gap="gap-0.5" className="mt-5" />
            <div className="mt-1 h-5 text-[14px] text-mute">{LABELS[rating]}</div>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="Kitap hakkında ne düşündün? (isteğe bağlı)"
            className="field mt-4 resize-none leading-relaxed"
          />
          <button onClick={save} disabled={saving} className="btn-primary mt-5 h-14 w-full text-[16px]">
            Kaydet
          </button>
          <button onClick={onClose} className="press mt-2 h-12 w-full text-[16px] text-mute">
            Şimdi değil
          </button>
        </div>
      )}
    </BottomSheet>
  )
}
