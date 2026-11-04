import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import BottomSheet from './ui/BottomSheet'
import { Checkbox } from './ui/primitives'
import PageInput, { toPage } from './PageInput'
import { DurationField } from './DurationPicker'
import { useData } from '../context/DataContext'
import { useUI } from '../context/UIContext'

/** Manuel ilerleme girme paneli ("İlerlemeni gir") */
export default function ProgressSheet({ book, open, onClose }) {
  const { logProgress, finishBook } = useData()
  const { toast, openRating } = useUI()
  const [unit, setUnit] = useState('page')
  const [value, setValue] = useState('')
  const [minutes, setMinutes] = useState(0)
  const [exclude, setExclude] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && book) {
      setUnit('page')
      setValue(String(book.currentPage || 0))
      setMinutes(0)
      setExclude(false)
    }
  }, [open, book?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!book) return <BottomSheet open={false} onClose={onClose} />
  const total = book.totalPages || 0

  const finish = async () => {
    setSaving(true)
    try {
      await finishBook(book, { minutes, exclude })
      onClose()
      toast('Tebrikler, kitabı bitirdin!')
      setTimeout(() => openRating(book), 350)
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const save = async () => {
    const page = toPage(value, unit, total)
    if (page === null) return toast('Geçerli bir sayfa gir', 'error')
    if (total && page >= total && book.status !== 'completed') return finish()
    setSaving(true)
    try {
      const { pagesRead } = await logProgress(book, { page, minutes, exclude })
      onClose()
      if (exclude) toast('İlerleme güncellendi (istatistiklere eklenmedi)', 'info')
      else if (pagesRead > 0) toast(`+${pagesRead} sayfa kaydedildi`)
      else if (minutes > 0) toast(`${minutes} dk okuma kaydedildi`)
      else toast('İlerleme güncellendi', 'info')
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="pb-2">
        <h2 className="font-serif text-[23px] leading-tight">İlerlemeni gir</h2>
        <p className="mt-1 text-[15.5px] text-mute">Süre tutmadan da nerede olduğunu kaydedebilirsin.</p>

        <div className="mt-6">
          <PageInput value={value} onChange={setValue} unit={unit} onUnitChange={setUnit} totalPages={total} />
        </div>

        <div className="mt-7 flex items-baseline gap-3">
          <h3 className="font-serif text-[18px]">Okuma süresi</h3>
          <span className="text-[15px] text-mute">isteğe bağlı</span>
        </div>
        <div className="mt-3">
          <DurationField minutes={minutes} onChange={setMinutes} />
        </div>

        <div className="mt-5 px-1">
          <Checkbox
            checked={exclude}
            onChange={setExclude}
            label="İstatistiklere ekleme"
            description="Sadece ilerlemeyi günceller; günün okuma sayısına eklenmez."
          />
        </div>

        <button onClick={save} disabled={saving} className="btn-primary mt-6 h-[46px] w-full text-[16px]">
          Kaydet
        </button>
        {book.status !== 'completed' && (
          <button
            onClick={finish}
            disabled={saving}
            className="press mx-auto mt-3 flex h-12 items-center gap-2 px-4 text-[16px] text-accent"
          >
            <CheckCircle2 size={22} />
            Kitabı bitirdim
          </button>
        )}
      </div>
    </BottomSheet>
  )
}
