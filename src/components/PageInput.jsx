import { BookOpen } from 'lucide-react'
import { Segmented } from './ui/primitives'

/**
 * "Kaçıncı sayfadasın?" — Sayfa / % birim seçimli giriş alanı.
 * value her zaman string (kullanıcı girdisi); dönüştürme toPage() ile yapılır.
 */
export function toPage(value, unit, totalPages) {
  const n = Number(String(value).replace(',', '.'))
  if (!Number.isFinite(n) || value === '') return null
  if (unit === 'percent') return Math.round((Math.min(100, Math.max(0, n)) / 100) * totalPages)
  return Math.round(Math.min(totalPages, Math.max(0, n)))
}

export function fromPage(page, unit, totalPages) {
  if (unit === 'percent') return totalPages ? String(Math.round((page / totalPages) * 100)) : '0'
  return String(page)
}

export default function PageInput({ value, onChange, unit, onUnitChange, totalPages, variant = 'floating', autoFocus }) {
  const switchUnit = (u) => {
    if (u === unit) return
    const page = toPage(value, unit, totalPages) ?? 0
    onUnitChange(u)
    onChange(fromPage(page, u, totalPages))
  }

  const input = (
    <input
      type="text"
      inputMode={unit === 'percent' ? 'decimal' : 'numeric'}
      pattern="[0-9]*"
      autoFocus={autoFocus}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, '').slice(0, 5))}
      onFocus={(e) => e.target.select()}
      className="min-w-0 flex-1 bg-transparent text-[18px] tabular text-white outline-none placeholder:text-mute-2"
      placeholder="0"
    />
  )
  const suffix = (
    <span className="shrink-0 text-[18px] tabular text-mute">{unit === 'percent' ? '/ 100 %' : `/ ${totalPages}`}</span>
  )

  if (variant === 'compact') {
    return (
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[15px] text-mute">Kaçıncı sayfadasın?</span>
          <Segmented
            options={[{ value: 'page', label: 'Sayfa' }, { value: 'percent', label: '%' }]}
            value={unit}
            onChange={switchUnit}
          />
        </div>
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-accent/60 bg-ink-850 px-4 py-3.5">
          <BookOpen size={20} className="shrink-0 text-mute" />
          {input}
          {suffix}
        </div>
      </div>
    )
  }

  return (
    <div>
      <Segmented
        options={[{ value: 'page', label: 'Sayfa' }, { value: 'percent', label: '%' }]}
        value={unit}
        onChange={switchUnit}
      />
      <fieldset className="mt-5 rounded-2xl border border-white/[0.12] px-5 pb-4 pt-1 focus-within:border-accent/70">
        <legend className="px-2 text-[15px] text-mute">
          {unit === 'percent' ? 'Yüzde kaçtasın?' : 'Kaçıncı sayfadasın?'}
        </legend>
        <div className="flex items-center gap-3">
          {input}
          {suffix}
        </div>
      </fieldset>
    </div>
  )
}
