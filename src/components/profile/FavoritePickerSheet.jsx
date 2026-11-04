import { X, Check } from 'lucide-react'
import BottomSheet from '../ui/BottomSheet'
import BookCover from '../BookCover'
import { useData } from '../../context/DataContext'
import { useUI } from '../../context/UIContext'
import { favSnapshot } from '../../utils/helpers'

/** Profil vitrini için en fazla 4 favori kitap seçimi */
export default function FavoritePickerSheet({ open, onClose, favorites = [] }) {
  const { books, setFavorites } = useData()
  const { toast } = useUI()
  const ids = favorites.map((f) => f.bookId)
  const resolve = (f) => books.find((b) => b.id === f.bookId) || f

  const toggle = async (b) => {
    if (ids.includes(b.id)) return setFavorites(favorites.filter((f) => f.bookId !== b.id))
    if (favorites.length >= 4) return toast('En fazla 4 favori seçebilirsin', 'error')
    await setFavorites([...favorites, favSnapshot(b)])
  }

  const candidates = [...books].sort((a, b) => (a.status === 'completed' ? -1 : 1) - (b.status === 'completed' ? -1 : 1))

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="pb-4">
        <h2 className="font-serif text-[22px]">Favoriler</h2>
        <p className="mt-1 text-[15px] text-mute">Profilinde sergilenecek 4 kitabı seç.</p>

        <div className="mt-5 grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }, (_, i) => favorites[i]).map((f, i) =>
            f ? (
              <div key={f.bookId} className="relative">
                <BookCover book={resolve(f)} className="aspect-[2/3] w-full" compact />
                <button
                  onClick={() => setFavorites(favorites.filter((x) => x.bookId !== f.bookId))}
                  className="press absolute -right-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-card-4 ring-2 ring-card-2"
                  aria-label="Kaldır"
                >
                  <X size={15} />
                </button>
              </div>
            ) : (
              <div key={`empty${i}`} className="aspect-[2/3] rounded-xl border border-dashed border-white/15 bg-card" />
            ),
          )}
        </div>

        <div className="section-label mt-7">Kitaplığından seç</div>
        {candidates.length === 0 ? (
          <p className="mt-3 text-[15px] text-mute">Önce kitaplığına kitap eklemelisin.</p>
        ) : (
          <div className="mt-3 grid grid-cols-4 gap-3">
            {candidates.map((b) => {
              const on = ids.includes(b.id)
              return (
                <button key={b.id} onClick={() => toggle(b)} className="press relative text-left">
                  <BookCover book={b} className={`aspect-[2/3] w-full ${on ? 'ring-2 ring-accent' : ''}`} compact>
                    {on && (
                      <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-ink">
                        <Check size={14} strokeWidth={3} />
                      </span>
                    )}
                  </BookCover>
                  <div className="mt-1 truncate text-[12.5px] text-white/80">{b.title}</div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </BottomSheet>
  )
}
