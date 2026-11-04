import { useEffect, useRef, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import BottomSheet from './ui/BottomSheet'
import { formatMinutes } from '../utils/date'

const ITEM = 44

function WheelColumn({ values, value, onChange, suffix }) {
  const ref = useRef(null)
  const timer = useRef(null)
  const [scrollIdx, setScrollIdx] = useState(Math.max(0, values.indexOf(value)))

  useEffect(() => {
    const i = Math.max(0, values.indexOf(value))
    if (ref.current) ref.current.scrollTop = i * ITEM
    setScrollIdx(i)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const onScroll = () => {
    const i = Math.round(ref.current.scrollTop / ITEM)
    setScrollIdx(i)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const idx = Math.min(values.length - 1, Math.max(0, i))
      onChange(values[idx])
    }, 90)
  }

  return (
    <div className="relative flex-1">
      <div
        ref={ref}
        onScroll={onScroll}
        className="no-scrollbar h-[220px] snap-y snap-mandatory overflow-y-scroll"
        style={{ paddingTop: 88, paddingBottom: 88, maskImage: 'linear-gradient(transparent, #000 30%, #000 70%, transparent)' }}
      >
        {values.map((v, i) => {
          const d = Math.abs(i - scrollIdx)
          return (
            <div
              key={v}
              className="flex h-[44px] snap-center items-center justify-center tabular transition-all"
              style={{ opacity: d === 0 ? 1 : d === 1 ? 0.45 : 0.2, fontSize: d === 0 ? 24 : 20 }}
              onClick={() => {
                ref.current.scrollTo({ top: i * ITEM, behavior: 'smooth' })
              }}
            >
              {v}
              <span className="ml-1.5 text-[14px] text-mute">{d === 0 ? suffix : ''}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** iOS benzeri saat/dakika tekerleği */
export function DurationPickerSheet({ open, minutes = 0, onClose, onSave, title = 'Okuma süresi' }) {
  const [h, setH] = useState(Math.floor(minutes / 60))
  const [m, setM] = useState(minutes % 60)
  useEffect(() => {
    if (open) {
      setH(Math.floor(minutes / 60))
      setM(minutes % 60)
    }
  }, [open, minutes])

  const hours = Array.from({ length: 13 }, (_, i) => i)
  const mins = Array.from({ length: 60 }, (_, i) => i)

  return (
    <BottomSheet open={open} onClose={onClose} zIndex={85}>
      {open && (
        <div className="pb-3">
          <h3 className="text-center font-serif text-[20px]">{title}</h3>
          <div className="relative mt-4 flex gap-2 rounded-3xl bg-ink-850 px-4 hairline">
            <div className="pointer-events-none absolute inset-x-3 top-1/2 h-[44px] -translate-y-1/2 rounded-2xl bg-white/[0.06]" />
            <WheelColumn values={hours} value={h} onChange={setH} suffix="sa" />
            <WheelColumn values={mins} value={m} onChange={setM} suffix="dk" />
          </div>
          <button
            className="btn-primary mt-5 h-14 w-full text-[16px]"
            onClick={() => {
              onSave(h * 60 + m)
              onClose()
            }}
          >
            Tamam
          </button>
        </div>
      )}
    </BottomSheet>
  )
}

const QUICK = [
  { label: '15 dk', value: 15 },
  { label: '30 dk', value: 30 },
  { label: '45 dk', value: 45 },
  { label: '1 sa', value: 60 },
]

/** İlerleme panelindeki "Okuma süresi (isteğe bağlı)" alanı */
export function DurationField({ minutes, onChange }) {
  const [picker, setPicker] = useState(false)
  return (
    <div>
      <div className="flex items-center gap-3 rounded-[26px] bg-card-3/70 p-3 hairline">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, minutes - 5))}
          disabled={minutes === 0}
          className="press flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full bg-white/[0.1] text-white disabled:opacity-40"
          aria-label="5 dakika azalt"
        >
          <Minus size={22} />
        </button>
        <button type="button" onClick={() => setPicker(true)} className="min-w-0 flex-1 text-center">
          <div className={`font-serif text-[22px] leading-tight ${minutes ? 'text-white' : 'text-white/55'}`}>
            {minutes ? formatMinutes(minutes) : 'Süre ekle'}
          </div>
          <div className="mt-0.5 text-[14px] tracking-wide text-mute">
            {minutes ? 'dokun, değiştir' : 'dokun, tam süreyi seç'}
          </div>
        </button>
        <button
          type="button"
          onClick={() => onChange(minutes + 5)}
          className="press flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full bg-accent text-ink"
          aria-label="5 dakika artır"
        >
          <Plus size={22} strokeWidth={2.4} />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2.5">
        {QUICK.map((q) => (
          <button
            key={q.value}
            type="button"
            onClick={() => onChange(minutes === q.value ? 0 : q.value)}
            className={`press h-11 rounded-full text-[15px] transition-colors ${
              minutes === q.value ? 'bg-accent/90 font-semibold text-ink' : 'bg-card-3/70 text-white/90 hairline'
            }`}
          >
            {q.label}
          </button>
        ))}
      </div>
      <DurationPickerSheet open={picker} minutes={minutes} onClose={() => setPicker(false)} onSave={onChange} />
    </div>
  )
}
