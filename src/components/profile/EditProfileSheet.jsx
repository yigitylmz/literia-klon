import { useEffect, useRef, useState } from 'react'
import { Camera, Trash2, AtSign, Check, X } from 'lucide-react'
import BottomSheet from '../ui/BottomSheet'
import { Avatar, Spinner } from '../ui/primitives'
import { useData } from '../../context/DataContext'
import { useUI } from '../../context/UIContext'
import { repo } from '../../data/repo'
import { compressImage, normalizeNickname, validateNickname } from '../../utils/helpers'

export function useNicknameCheck(nick, exceptUid) {
  const [state, setState] = useState({ checking: false, available: null, error: '' })
  useEffect(() => {
    const error = validateNickname(nick)
    if (error) return setState({ checking: false, available: null, error })
    setState({ checking: true, available: null, error: '' })
    const t = setTimeout(async () => {
      try {
        const ok = await repo.isNicknameAvailable(nick, exceptUid)
        setState({ checking: false, available: ok, error: ok ? '' : 'Bu kullanıcı adı alınmış' })
      } catch {
        setState({ checking: false, available: null, error: '' })
      }
    }, 350)
    return () => clearTimeout(t)
  }, [nick, exceptUid])
  return state
}

export function NicknameField({ value, onChange, check }) {
  return (
    <div>
      <div className="flex items-center gap-2 rounded-2xl bg-ink-850 px-4 hairline focus-within:border-accent/60">
        <AtSign size={18} className="shrink-0 text-mute" />
        <input
          value={value}
          onChange={(e) => onChange(normalizeNickname(e.target.value))}
          placeholder="kullaniciadi"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent py-3.5 text-[16px] outline-none placeholder:text-mute-2"
        />
        {check.checking && <Spinner size={18} />}
        {check.available === true && <Check size={19} className="text-ok" />}
        {check.available === false && <X size={19} className="text-[#FF7A7E]" />}
      </div>
      {check.error && value && <div className="mt-1.5 px-1 text-[13.5px] text-[#FF8A8E]">{check.error}</div>}
    </div>
  )
}

export function PhotoPicker({ photoURL, name, onChange }) {
  const ref = useRef(null)
  const { toast } = useUI()
  return (
    <div className="flex items-center gap-4">
      <button type="button" onClick={() => ref.current?.click()} className="press relative">
        <Avatar user={{ photoURL, displayName: name }} size={84} />
        <span className="absolute -bottom-0.5 -right-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-ink ring-4 ring-card-2">
          <Camera size={16} />
        </span>
      </button>
      <div className="flex flex-col items-start gap-1">
        <button type="button" onClick={() => ref.current?.click()} className="press text-[16px] text-accent">
          {photoURL ? 'Fotoğrafı değiştir' : 'Fotoğraf ekle'}
        </button>
        {photoURL && (
          <button type="button" onClick={() => onChange('')} className="press flex items-center gap-1.5 text-[14.5px] text-mute">
            <Trash2 size={14} /> Kaldır
          </button>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (!f) return
          try {
            onChange(await compressImage(f))
          } catch (err) {
            toast(err.message, 'error')
          }
        }}
      />
    </div>
  )
}

export default function EditProfileSheet({ open, onClose, profile }) {
  const { updateProfile } = useData()
  const { toast } = useUI()
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const check = useNicknameCheck(form.nickname || '', profile?.uid)

  useEffect(() => {
    if (open && profile) {
      setForm({
        displayName: profile.displayName || '',
        nickname: profile.nickname || '',
        photoURL: profile.photoURL || '',
        yearlyGoal: String(profile.yearlyGoal || 12),
        dailyPageGoal: String(profile.dailyPageGoal || 30),
      })
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))

  const save = async () => {
    if (validateNickname(form.nickname) || check.available === false) return toast('Kullanıcı adını kontrol et', 'error')
    setSaving(true)
    try {
      const payload = {
        displayName: form.displayName.trim() || form.nickname,
        photoURL: form.photoURL,
        yearlyGoal: Math.max(1, Number(form.yearlyGoal) || 12),
        dailyPageGoal: Math.max(1, Number(form.dailyPageGoal) || 30),
      }
      if (form.nickname !== profile.nickname) payload.nickname = form.nickname
      await updateProfile(payload)
      toast('Profil güncellendi')
      onClose()
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="space-y-5 pb-4">
        <h2 className="font-serif text-[23px]">Profili düzenle</h2>
        <PhotoPicker photoURL={form.photoURL} name={form.displayName} onChange={set('photoURL')} />
        <div>
          <div className="mb-1.5 px-1 text-[14px] text-mute">Görünen isim</div>
          <input
            value={form.displayName || ''}
            onChange={(e) => set('displayName')(e.target.value.slice(0, 40))}
            className="field"
            placeholder="Adın"
          />
        </div>
        <div>
          <div className="mb-1.5 px-1 text-[14px] text-mute">Kullanıcı adı</div>
          <NicknameField value={form.nickname || ''} onChange={set('nickname')} check={check} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="mb-1.5 px-1 text-[14px] text-mute">Yıllık hedef (kitap)</div>
            <input
              inputMode="numeric"
              value={form.yearlyGoal || ''}
              onChange={(e) => set('yearlyGoal')(e.target.value.replace(/\D/g, '').slice(0, 3))}
              className="field tabular"
            />
          </div>
          <div>
            <div className="mb-1.5 px-1 text-[14px] text-mute">Günlük hedef (sayfa)</div>
            <input
              inputMode="numeric"
              value={form.dailyPageGoal || ''}
              onChange={(e) => set('dailyPageGoal')(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="field tabular"
            />
          </div>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary h-[46px] w-full text-[16px]">
          Kaydet
        </button>
      </div>
    </BottomSheet>
  )
}
