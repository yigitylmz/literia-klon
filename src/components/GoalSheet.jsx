import { useEffect, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import BottomSheet from './ui/BottomSheet'
import BookCover from './BookCover'
import { ProgressBar } from './ui/primitives'
import { completedInYear, yearlyGoalProgress } from '../utils/statsCalculator'
import { formatDayMonth, toMillis } from '../utils/date'

/** Yıllık hedef detayı: bu yıl bitirilenler + (kendi profilimizde) hedef düzenleme */
export default function GoalSheet({ open, onClose, books, goal, editable, onSaveGoal }) {
  const [value, setValue] = useState(goal)
  useEffect(() => {
    if (open) setValue(goal)
  }, [open, goal])

  const progress = yearlyGoalProgress(books, value)
  const done = completedInYear(books).sort((a, b) => toMillis(b.completedAt) - toMillis(a.completedAt))

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="pb-4">
        <h2 className="font-serif text-[23px]">{progress.year} okuma hedefi</h2>
        <div className="mt-4 flex items-end justify-between">
          <div className="font-serif text-[30px] leading-none tabular">
            {progress.done}
            <span className="text-mute"> / {progress.goal}</span>
          </div>
          <div className="text-[15px] text-mute">%{progress.percent}</div>
        </div>
        <ProgressBar value={progress.percent} className="mt-4" height="h-[10px]" />

        {editable && (
          <div className="mt-6 flex items-center justify-between rounded-3xl bg-ink-850 p-3 hairline">
            <button
              onClick={() => setValue((v) => Math.max(1, v - 1))}
              className="press flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.08]"
              aria-label="Azalt"
            >
              <Minus size={22} />
            </button>
            <div className="text-center">
              <div className="text-[20px] font-semibold tabular">{value}</div>
              <div className="text-[13px] text-mute">kitap / yıl</div>
            </div>
            <button
              onClick={() => setValue((v) => Math.min(365, v + 1))}
              className="press flex h-12 w-12 items-center justify-center rounded-full bg-accent text-ink"
              aria-label="Artır"
            >
              <Plus size={22} />
            </button>
          </div>
        )}
        {editable && value !== goal && (
          <button
            onClick={() => {
              onSaveGoal(value)
              onClose()
            }}
            className="btn-primary mt-3 h-12 w-full text-[16px]"
          >
            Hedefi kaydet
          </button>
        )}

        <div className="section-label mt-8">Bu yıl bitirilenler</div>
        {done.length === 0 ? (
          <p className="mt-3 text-[15px] text-mute">Bu yıl henüz bitirilen kitap yok.</p>
        ) : (
          <div className="mt-3 grid grid-cols-4 gap-3">
            {done.map((b) => (
              <div key={b.id}>
                <BookCover book={b} className="aspect-[2/3] w-full" compact />
                <div className="mt-1 text-center text-[12px] text-mute">{formatDayMonth(new Date(toMillis(b.completedAt)))}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </BottomSheet>
  )
}
