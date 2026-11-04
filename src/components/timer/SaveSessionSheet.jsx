import { useEffect, useState } from 'react'
import { Timer, Pencil } from 'lucide-react'
import BottomSheet from '../ui/BottomSheet'
import PageInput, { toPage } from '../PageInput'
import { DurationPickerSheet } from '../DurationPicker'
import { formatClock } from '../../utils/date'

/** "Bitir & Kaydet" sonrası açılan sayfa giriş paneli */
export default function SaveSessionSheet({ open, book, seconds, onCancel, onSave }) {
  const [unit, setUnit] = useState('page')
  const [value, setValue] = useState('')
  const [secs, setSecs] = useState(seconds)
  const [picker, setPicker] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setUnit('page')
      setValue(String(book?.currentPage || 0))
      setSecs(seconds)
      setSaving(false)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const total = book?.totalPages || 0

  const submit = async (withPage) => {
    if (saving) return
    setSaving(true)
    try {
      await onSave({ seconds: secs, page: withPage ? toPage(value, unit, total) : null })
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={onCancel} zIndex={72}>
      {book && (
        <div className="pb-3 pt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Timer size={26} className="text-accent" strokeWidth={2} />
              <span className="text-[23px] font-semibold tabular">{formatClock(secs)}</span>
            </div>
            <button
              onClick={() => setPicker(true)}
              className="press flex items-center gap-1.5 rounded-full px-3 py-2 text-[16px] font-medium text-accent"
            >
              <Pencil size={16} /> Düzenle
            </button>
          </div>

          <div className="mt-6">
            <PageInput
              variant="compact"
              value={value}
              onChange={setValue}
              unit={unit}
              onUnitChange={setUnit}
              totalPages={total}
            />
            <div className="mt-2.5 text-[14.5px] text-mute">Son kaldığın sayfa: {book.currentPage || 0}</div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={() => submit(false)}
              disabled={saving}
              className="press h-[46px] px-6 text-[16px] font-medium text-white/90"
            >
              Kaydetme
            </button>
            <button onClick={() => submit(true)} disabled={saving} className="btn-primary h-[46px] flex-1 text-[16px]">
              Kaydet
            </button>
          </div>
        </div>
      )}
      <DurationPickerSheet
        open={picker}
        minutes={Math.round(secs / 60)}
        onClose={() => setPicker(false)}
        onSave={(m) => setSecs(m * 60)}
        title="Süreyi düzenle"
      />
    </BottomSheet>
  )
}
