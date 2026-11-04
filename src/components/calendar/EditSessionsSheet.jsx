import { useEffect, useState } from 'react'
import { Trash2, EyeOff } from 'lucide-react'
import BottomSheet from '../ui/BottomSheet'
import BookCover from '../BookCover'
import { useData } from '../../context/DataContext'
import { useUI } from '../../context/UIContext'
import { formatDayMonth, formatTime, toMillis } from '../../utils/date'

function NumField({ value, onChange, suffix }) {
  return (
    <label className="flex h-11 items-center gap-1.5 rounded-xl bg-ink-850 px-3 hairline">
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
        className="w-12 bg-transparent text-right text-[16px] font-semibold tabular outline-none"
      />
      <span className="text-[14px] text-mute">{suffix}</span>
    </label>
  )
}

/** Bir günün seanslarını düzenleme / silme */
export default function EditSessionsSheet({ open, onClose, dateStr, coverFor }) {
  const { sessions, updateSession, deleteSession } = useData()
  const { toast, confirm } = useUI()
  const daySessions = sessions
    .filter((s) => s.dateStr === dateStr)
    .sort((a, b) => toMillis(a.startTime) - toMillis(b.startTime))
  const [drafts, setDrafts] = useState({})

  useEffect(() => {
    if (open) {
      const d = {}
      for (const s of daySessions) d[s.id] = { pages: String(s.pagesRead || 0), minutes: String(s.durationMinutes || 0) }
      setDrafts(d)
    }
  }, [open, dateStr]) // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = daySessions.filter((s) => {
    const d = drafts[s.id]
    return d && (Number(d.pages) !== (s.pagesRead || 0) || Number(d.minutes) !== (s.durationMinutes || 0))
  })

  const saveAll = async () => {
    try {
      await Promise.all(
        dirty.map((s) => {
          const m = Number(drafts[s.id].minutes) || 0
          return updateSession(s.id, { pagesRead: Number(drafts[s.id].pages) || 0, durationMinutes: m, durationSeconds: m * 60 })
        }),
      )
      toast('Seanslar güncellendi')
      onClose()
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  const remove = async (s) => {
    const ok = await confirm({
      title: 'Seansı sil?',
      message: 'Bu seans takvimden ve istatistiklerden kaldırılır. Kitaptaki mevcut sayfan değişmez.',
      confirmText: 'Sil',
      destructive: true,
    })
    if (!ok) return
    await deleteSession(s.id)
    toast('Seans silindi', 'info')
  }

  return (
    <BottomSheet open={open} onClose={onClose} zIndex={75}>
      <div className="pb-4">
        <h2 className="font-serif text-[22px]">Seanslar · {dateStr ? formatDayMonth(dateStr) : ''}</h2>
        {daySessions.length === 0 ? (
          <p className="py-8 text-center text-[15px] text-mute">Bu günde seans kalmadı.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {daySessions.map((s) => (
              <div key={s.id} className="rounded-2xl bg-white/[0.03] p-3.5 hairline">
                <div className="flex items-center gap-3">
                  <BookCover
                    book={coverFor({ bookId: s.bookId, title: s.bookTitle, author: s.bookAuthor, cover: s.bookCover })}
                    className="aspect-[2/3] w-[42px] shrink-0"
                    rounded="rounded-md"
                    compact
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-serif text-[16px]">{s.bookTitle}</div>
                    <div className="flex items-center gap-1.5 text-[13.5px] text-mute">
                      {formatTime(s.startTime)}–{formatTime(s.endTime)}
                      {s.excludeFromStats && (
                        <span className="ml-1 flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-[12px]">
                          <EyeOff size={12} /> istatistik dışı
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => remove(s)} className="press flex h-10 w-10 items-center justify-center rounded-full text-[#FF7A7E]" aria-label="Sil">
                    <Trash2 size={19} />
                  </button>
                </div>
                {drafts[s.id] && (
                  <div className="mt-3 flex gap-2">
                    <NumField
                      value={drafts[s.id].pages}
                      suffix="sayfa"
                      onChange={(v) => setDrafts((d) => ({ ...d, [s.id]: { ...d[s.id], pages: v } }))}
                    />
                    <NumField
                      value={drafts[s.id].minutes}
                      suffix="dk"
                      onChange={(v) => setDrafts((d) => ({ ...d, [s.id]: { ...d[s.id], minutes: v } }))}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <button onClick={saveAll} disabled={!dirty.length} className="btn-primary mt-5 h-[44px] w-full text-[16px]">
          Değişiklikleri kaydet
        </button>
      </div>
    </BottomSheet>
  )
}
