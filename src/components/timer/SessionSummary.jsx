import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Pencil, Sparkles } from 'lucide-react'
import BookCover from '../BookCover'
import { DurationPickerSheet } from '../DurationPicker'
import { formatDayMonthYear, formatTime, formatMinutes } from '../../utils/date'

export default function SessionSummary({ summary, onDone, onEditMinutes }) {
  const [picker, setPicker] = useState(false)
  const { book, startedAt, endedAt, minutes, pagesRead } = summary

  return (
    <motion.div
      className="fixed inset-0 z-[75] flex flex-col bg-gradient-to-b from-[#141A26] to-ink px-5 pt-safe"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
    >
      <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col pb-safe">
        <div className="mt-6 flex items-start justify-between">
          <div>
            <div className="text-[13px] font-semibold uppercase tracking-[0.2em] text-accent-soft">Seans özeti</div>
            <div className="mt-1.5 text-[16px] text-white/80">
              {formatDayMonthYear(startedAt)} · {formatTime(startedAt)}–{formatTime(endedAt)}
            </div>
          </div>
          <button onClick={onDone} className="press -mr-2 flex h-11 w-11 items-center justify-center rounded-full" aria-label="Kapat">
            <X size={26} />
          </button>
        </div>

        <div className="card mt-6 flex gap-4 p-4">
          <BookCover book={book} className="aspect-[2/3] w-[84px] shrink-0" />
          <div className="min-w-0 flex-1 py-1">
            <div className="truncate font-serif text-[18px]">{book.title}</div>
            <div className="truncate text-[15px] text-mute">{book.author}</div>
            <div className="mt-3 flex items-end gap-6">
              <button onClick={() => setPicker(true)} className="press text-left">
                <div className="text-[20px] font-bold leading-none tabular">{formatMinutes(minutes)}</div>
                <div className="mt-1 flex items-center gap-1 text-[14px] text-mute">
                  okuma <Pencil size={13} />
                </div>
              </button>
              {pagesRead > 0 && (
                <div>
                  <div className="text-[20px] font-bold leading-none tabular">{pagesRead}</div>
                  <div className="mt-1 text-[14px] text-mute">sayfa</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {pagesRead === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-3 flex items-start gap-3 rounded-2xl bg-card/70 p-4 hairline"
          >
            <Sparkles size={20} className="mt-0.5 shrink-0 text-accent" />
            <p className="text-[15px] leading-snug text-white/85">Süreyi kaydettik; sayfayı sonra da girebilirsin.</p>
          </motion.div>
        )}

        <div className="flex-1" />
        <button onClick={onDone} className="btn-primary mb-2 h-[46px] w-full text-[16px]">
          Tamam
        </button>
      </div>

      <DurationPickerSheet
        open={picker}
        minutes={minutes}
        onClose={() => setPicker(false)}
        onSave={onEditMinutes}
        title="Süreyi düzenle"
      />
    </motion.div>
  )
}
