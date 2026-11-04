import { X, SlidersHorizontal } from 'lucide-react'
import CenterModal from '../ui/CenterModal'
import BookCover from '../BookCover'
import { parseDateStr, MONTH_SHORT, DAY_SHORT, weekdayIndex } from '../../utils/date'

export default function DayDetailModal({ day, onClose, isOwn, onEditSessions, coverFor }) {
  const d = day ? parseDateStr(day.dateStr) : null
  return (
    <CenterModal open={Boolean(day)} onClose={onClose}>
      {day && (
        <div className="p-6 pb-5">
          <div className="flex items-start justify-between">
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-[26px] font-medium leading-none">
                {d.getDate()} {MONTH_SHORT[d.getMonth()]}
              </span>
              <span className="text-[17px] text-mute">{DAY_SHORT[weekdayIndex(d)]}</span>
            </div>
            <button onClick={onClose} className="press -mr-2 -mt-1 flex h-11 w-11 items-center justify-center rounded-full" aria-label="Kapat">
              <X size={28} />
            </button>
          </div>

          <div className="mt-6 flex gap-10">
            <div>
              <div className="text-[23px] font-bold leading-none tabular">{day.pages}</div>
              <div className="mt-1 text-[16px] text-mute">sayfa</div>
            </div>
            <div>
              <div className="text-[23px] font-bold leading-none tabular">{day.minutes}</div>
              <div className="mt-1 text-[16px] text-mute">dakika</div>
            </div>
          </div>

          <div className="section-label mt-7">Okunanlar</div>
          <div className="no-scrollbar -mx-6 mt-3 flex gap-3 overflow-x-auto px-6">
            {day.books.map((b) => (
              <div key={b.bookId || b.title} className="w-[112px] shrink-0">
                <BookCover book={coverFor(b)} className="aspect-[2/3] w-full" rounded="rounded-[14px]" />
                <div className="mt-1.5 truncate text-[13px] text-white/85">{b.title}</div>
                <div className="text-[12.5px] text-mute">
                  {b.pages > 0 ? `${b.pages} sf` : ''}
                  {b.pages > 0 && b.minutes > 0 ? ' · ' : ''}
                  {b.minutes > 0 ? `${b.minutes} dk` : ''}
                </div>
              </div>
            ))}
          </div>

          {isOwn && (
            <button
              onClick={onEditSessions}
              className="press mt-6 flex items-center gap-3 px-2 py-2 text-[16px] text-accent"
            >
              <SlidersHorizontal size={22} />
              Seansları düzenle
            </button>
          )}
        </div>
      )}
    </CenterModal>
  )
}
