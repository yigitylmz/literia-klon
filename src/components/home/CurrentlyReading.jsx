import { useRef, useState } from 'react'
import { Play, Hourglass, SquarePen, Search } from 'lucide-react'
import BookCover from '../BookCover'
import { ProgressBar } from '../ui/primitives'
import { bookPercent } from '../../utils/statsCalculator'

function ReadingCard({ book, timer, onStart, onEdit, onOpenTimer, onOpen }) {
  const pct = bookPercent(book)
  const isThisActive = timer?.book?.id === book.id
  const otherActive = timer && !isThisActive

  return (
    <div className="card w-full shrink-0 snap-center p-4">
      <button type="button" onClick={onOpen} className="flex w-full gap-3.5 text-left">
        <BookCover book={book} className="aspect-[2/3] w-[76px] shrink-0 shadow-lg" rounded="rounded-[10px]" />
        <div className="min-w-0 flex-1 py-0.5">
          <div className="line-clamp-2 font-serif text-[20px] leading-[1.15]">{book.title}</div>
          <div className="mt-1.5 truncate text-[16px] text-mute">{book.author}</div>
          <div className="mt-4 flex items-baseline justify-between text-[16px] text-mute">
            <span>
              Sayfa <span className="font-semibold text-white">{book.currentPage || 0}</span>/{book.totalPages}
            </span>
            <span className="tabular">%{pct}</span>
          </div>
          <ProgressBar value={pct} className="mt-2.5" />
        </div>
      </button>

      <div className="mt-5 flex gap-3">
        {isThisActive ? (
          <button type="button" onClick={onOpenTimer} className="btn-dark h-[46px] flex-1 text-[16px] text-white/70">
            <Hourglass size={19} className="animate-pulseDot" />
            Okuma sürüyor
          </button>
        ) : (
          <button
            type="button"
            onClick={onStart}
            disabled={Boolean(otherActive)}
            className="btn-primary h-[46px] flex-1 text-[17px]"
          >
            <Play size={20} className="fill-current" />
            Okumaya başla
          </button>
        )}
        <button
          type="button"
          onClick={onEdit}
          className="press flex h-[46px] w-[52px] shrink-0 items-center justify-center rounded-[16px] bg-card-3/60 text-white hairline"
          aria-label="İlerleme gir"
        >
          <SquarePen size={24} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  )
}

export default function CurrentlyReading({ books, timer, onStart, onEdit, onOpenTimer, onOpenBook, onSearch }) {
  const ref = useRef(null)
  const [page, setPage] = useState(0)

  if (!books.length) {
    return (
      <div className="card flex flex-col items-center px-6 py-8 text-center">
        <div className="font-serif text-[18px]">Şu an okuduğun bir kitap yok</div>
        <p className="mt-2 text-[15px] text-mute">Kitaplığından bir kitaba başla ya da yeni bir kitap ara.</p>
        <button onClick={onSearch} className="btn-primary mt-5 h-12 px-6 text-[16px]">
          <Search size={18} /> Kitap ara
        </button>
      </div>
    )
  }

  const step = () => (ref.current?.firstElementChild?.offsetWidth || 1) + 12
  const onScroll = () => {
    const el = ref.current
    if (!el) return
    setPage(Math.round(el.scrollLeft / step()))
  }

  return (
    <div>
      <div
        ref={ref}
        onScroll={onScroll}
        className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-5"
        style={{ scrollPaddingInline: 20 }}
      >
        {books.map((b) => (
          <div key={b.id} className="w-full shrink-0 snap-center">
            <ReadingCard
              book={b}
              timer={timer}
              onStart={() => onStart(b)}
              onEdit={() => onEdit(b)}
              onOpenTimer={onOpenTimer}
              onOpen={() => onOpenBook(b)}
            />
          </div>
        ))}
      </div>
      {books.length > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {books.map((b, i) => (
            <button
              key={b.id}
              aria-label={`${i + 1}. kitap`}
              onClick={() => ref.current?.scrollTo({ left: i * step(), behavior: 'smooth' })}
              className={`h-[9px] rounded-full transition-all duration-300 ${i === page ? 'w-7 bg-accent' : 'w-[9px] bg-white/20'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
