import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Hash, Share, Image as ImageIcon, Flame, BookCheck, Clock3, FileText } from 'lucide-react'
import BookCover from '../BookCover'
import DayDetailModal from './DayDetailModal'
import EditSessionsSheet from './EditSessionsSheet'
import { TopBar } from '../ui/primitives'
import { buildMonthGrid, calculateStreak, countedSessions, completedCount } from '../../utils/statsCalculator'
import { DAY_SHORT, MONTH_LONG, formatMinutes } from '../../utils/date'
import { shareOrCopy } from '../../utils/helpers'
import { useUI } from '../../context/UIContext'

function intensity(pages, max) {
  if (!max) return 0.35
  return 0.3 + 0.45 * Math.min(1, pages / max)
}

function DayCell({ cell, max, mode, coverFor, onClick }) {
  if (!cell) return <div />
  const { day, active, isToday, isFuture } = cell
  const base = 'relative flex aspect-[0.62] flex-col items-center overflow-hidden rounded-[14px] transition-transform active:scale-95'

  if (active) {
    const a = intensity(cell.pages, max)
    return (
      <button
        onClick={onClick}
        className={`${base} pt-1.5 ${isToday ? 'shadow-glow' : 'ring-1 ring-white/[0.08]'}`}
        style={{ background: `rgba(118, 152, 214, ${a})` }}
      >
        <span className="text-[15px] font-semibold leading-tight text-white">{day}</span>
        {mode === 'covers' ? (
          <div className="mt-1 w-[78%] flex-1 pb-[10%]">
            <BookCover book={coverFor(cell.books[0])} className="h-full w-full" rounded="rounded-[5px]" compact />
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center pb-2">
            <span className="text-[17px] font-bold leading-none tabular">{cell.pages}</span>
            <span className="mt-0.5 text-[11px] text-white/70">sf</span>
            {cell.minutes > 0 && <span className="mt-1 text-[10.5px] text-white/60">{cell.minutes} dk</span>}
          </div>
        )}
      </button>
    )
  }

  return (
    <div
      className={`${base} justify-center ${
        isFuture ? 'border border-white/[0.05] text-mute-3' : 'bg-card-2 text-white/85'
      } ${isToday ? 'shadow-glow' : ''}`}
    >
      <span className="text-[16px] tabular">{day}</span>
    </div>
  )
}

/**
 * Okuma takvimi. isOwn=false iken arkadaşın verileri salt-okunur gösterilir.
 */
export default function CalendarView({ sessions, books, isOwn, ownerName, showBack = true }) {
  const { toast } = useUI()
  const now = new Date()
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const [dir, setDir] = useState(0)
  const [mode, setMode] = useState('covers')
  const [selected, setSelected] = useState(null)
  const [editDate, setEditDate] = useState(null)

  const { cells, summary } = useMemo(() => buildMonthGrid(ym.y, ym.m, sessions), [ym, sessions])
  const streak = useMemo(() => calculateStreak(sessions), [sessions])
  const totals = useMemo(() => {
    const c = countedSessions(sessions)
    return {
      pages: c.reduce((s, x) => s + (x.pagesRead || 0), 0),
      minutes: c.reduce((s, x) => s + (x.durationMinutes || 0), 0),
    }
  }, [sessions])

  const bookMap = useMemo(() => new Map(books.map((b) => [b.id, b])), [books])
  const coverFor = (b) => {
    if (!b) return {}
    const live = b.bookId && bookMap.get(b.bookId)
    return live || { title: b.title, author: b.author, coverUrl: b.cover }
  }

  const shift = (delta) => {
    setDir(delta)
    setYm(({ y, m }) => {
      const d = new Date(y, m + delta, 1)
      return { y: d.getFullYear(), m: d.getMonth() }
    })
  }

  const share = async () => {
    const who = isOwn ? 'okudum' : `${ownerName} okudu`
    const res = await shareOrCopy({
      title: 'Okuma takvimi',
      text: `${MONTH_LONG[ym.m]} ${ym.y}: ${summary.days} gün, ${summary.pages} sayfa, ${formatMinutes(summary.minutes)} ${who} 📚`,
    })
    if (res === 'copied') toast('Özet panoya kopyalandı')
  }

  return (
    <div>
      <TopBar
        title="Okuma takvimi"
        back={showBack}
        className="pt-2"
        right={
          <>
            <button
              onClick={() => setMode((m) => (m === 'covers' ? 'numbers' : 'covers'))}
              className="press flex h-11 w-11 items-center justify-center"
              aria-label="Görünümü değiştir"
            >
              {mode === 'covers' ? <Hash size={26} /> : <ImageIcon size={24} />}
            </button>
            <button onClick={share} className="press -mr-2 flex h-11 w-11 items-center justify-center" aria-label="Paylaş">
              <Share size={24} />
            </button>
          </>
        }
      />

      <div className="mt-5 flex items-center justify-between px-2">
        <button onClick={() => shift(-1)} className="press flex h-11 w-11 items-center justify-center text-mute" aria-label="Önceki ay">
          <ChevronLeft size={26} />
        </button>
        <motion.div
          key={`${ym.y}-${ym.m}`}
          initial={dir ? { opacity: 0, x: dir * 16 } : false}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.18 }}
          className="font-serif text-[22px]"
        >
          {MONTH_LONG[ym.m]} {ym.y}
        </motion.div>
        <button onClick={() => shift(1)} className="press flex h-11 w-11 items-center justify-center text-mute" aria-label="Sonraki ay">
          <ChevronRight size={26} />
        </button>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-2 text-center text-[15px] text-mute">
        {DAY_SHORT.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <motion.div
        key={`${ym.y}-${ym.m}-grid`}
        initial={{ opacity: 0, x: dir * 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="mt-3 grid grid-cols-7 gap-2"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.25}
        onDragEnd={(_, info) => {
          if (info.offset.x < -60) shift(1)
          else if (info.offset.x > 60) shift(-1)
        }}
      >
        {cells.map((c, i) => (
          <DayCell
            key={c ? c.dateStr : `e${i}`}
            cell={c}
            max={summary.maxPages}
            mode={mode}
            coverFor={coverFor}
            onClick={() => setSelected(c)}
          />
        ))}
      </motion.div>

      <div className="card mt-6 grid grid-cols-3 py-5 text-center">
        <div>
          <div className="text-[23px] font-bold leading-none tabular">{summary.pages}</div>
          <div className="mt-1.5 text-[16px] text-mute">sayfa</div>
        </div>
        <div>
          <div className="text-[23px] font-bold leading-none tabular">{summary.minutes}</div>
          <div className="mt-1.5 text-[16px] text-mute">dakika</div>
        </div>
        <div>
          <div className="text-[23px] font-bold leading-none tabular">{summary.days}</div>
          <div className="mt-1.5 text-[16px] text-mute">gün</div>
        </div>
      </div>

      <div className="section-label mb-3 mt-8">Tüm zamanlar</div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Flame, label: 'En uzun seri', value: `${streak.longest} gün`, color: 'text-streak-soft' },
          { icon: BookCheck, label: 'Bitirilen kitap', value: completedCount(books), color: 'text-ok' },
          { icon: FileText, label: 'Toplam sayfa', value: totals.pages.toLocaleString('tr-TR'), color: 'text-accent' },
          { icon: Clock3, label: 'Toplam süre', value: formatMinutes(totals.minutes), color: 'text-accent-soft' },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <s.icon size={20} className={s.color} />
            <div className="mt-3 text-[18px] font-bold leading-none tabular">{s.value}</div>
            <div className="mt-1.5 text-[14px] text-mute">{s.label}</div>
          </div>
        ))}
      </div>

      <DayDetailModal
        day={selected}
        onClose={() => setSelected(null)}
        isOwn={isOwn}
        coverFor={coverFor}
        onEditSessions={() => {
          setEditDate(selected.dateStr)
          setSelected(null)
        }}
      />
      {isOwn && (
        <EditSessionsSheet open={Boolean(editDate)} dateStr={editDate} onClose={() => setEditDate(null)} coverFor={coverFor} />
      )}
    </div>
  )
}
