import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, ChevronLeft, Minus, Plus } from 'lucide-react'
import { useAuth, authErrorMessage } from '../context/AuthContext'
import { NicknameField, PhotoPicker, useNicknameCheck } from '../components/profile/EditProfileSheet'
import { Spinner } from '../components/ui/primitives'
import { useUI } from '../context/UIContext'
import { normalizeNickname, validateNickname } from '../utils/helpers'

function Brand() {
  return (
    <div className="flex flex-col items-center text-center">
      <img src="icons/icon-192.png" alt="" className="h-[76px] w-[76px] rounded-[22px] shadow-glass" />
      <h1 className="mt-5 font-serif text-[26px] font-medium leading-none">Satır</h1>
      <p className="mt-3 max-w-[290px] text-[16px] leading-relaxed text-mute">
        Okuduklarını takip et, serini koru, arkadaşlarınla kütüphaneni paylaş.
      </p>
    </div>
  )
}

function Field({ icon: Icon, ...props }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card px-4 hairline focus-within:border-accent/60">
      <Icon size={19} className="shrink-0 text-mute" />
      <input {...props} className="min-w-0 flex-1 bg-transparent py-4 text-[16px] outline-none placeholder:text-mute-2" />
    </div>
  )
}

function GoalStepper({ value, onChange }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-card p-2.5 hairline">
      <button type="button" onClick={() => onChange(Math.max(1, value - 1))} className="press flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.07]">
        <Minus size={20} />
      </button>
      <div className="text-center">
        <span className="text-[18px] font-semibold tabular">{value}</span>
        <span className="ml-1.5 text-[14px] text-mute">kitap / yıl</span>
      </div>
      <button type="button" onClick={() => onChange(Math.min(365, value + 1))} className="press flex h-11 w-11 items-center justify-center rounded-full bg-accent text-ink">
        <Plus size={20} />
      </button>
    </div>
  )
}

/** Profil bilgileri adımı (kayıt 2. adım ve yarım kalan hesap tamamlama) */
export function ProfileStep({ onSubmit, busy, submitLabel = 'Hesabı oluştur', onBack }) {
  const [nickname, setNickname] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [photoURL, setPhotoURL] = useState('')
  const [goal, setGoal] = useState(12)
  const check = useNicknameCheck(nickname)
  const valid = !validateNickname(nickname) && check.available !== false && displayName.trim()

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (valid) onSubmit({ nickname, displayName: displayName.trim(), photoURL, yearlyGoal: goal })
      }}
      className="space-y-4"
    >
      {onBack && (
        <button type="button" onClick={onBack} className="press -ml-2 flex items-center gap-1 text-[16px] text-mute">
          <ChevronLeft size={22} /> Geri
        </button>
      )}
      <h2 className="font-serif text-[23px] leading-tight">Profilini oluştur</h2>
      <PhotoPicker photoURL={photoURL} name={displayName || nickname} onChange={setPhotoURL} />
      <div>
        <div className="mb-1.5 px-1 text-[14px] text-mute">Görünen isim</div>
        <input
          value={displayName}
          onChange={(e) => {
            setDisplayName(e.target.value.slice(0, 40))
            if (!nickname || nickname === normalizeNickname(displayName)) setNickname(normalizeNickname(e.target.value))
          }}
          placeholder="Adın"
          className="field"
        />
      </div>
      <div>
        <div className="mb-1.5 px-1 text-[14px] text-mute">Kullanıcı adı (arkadaşların seni bununla bulur)</div>
        <NicknameField value={nickname} onChange={setNickname} check={check} />
      </div>
      <div>
        <div className="mb-1.5 px-1 text-[14px] text-mute">{new Date().getFullYear()} okuma hedefin</div>
        <GoalStepper value={goal} onChange={setGoal} />
      </div>
      <button type="submit" disabled={!valid || busy || check.checking} className="btn-primary mt-2 h-[46px] w-full text-[16px]">
        {busy ? <Spinner size={20} className="border-ink/20 border-t-ink" /> : submitLabel}
      </button>
    </form>
  )
}

export default function AuthPage() {
  const { signIn, signUp, resetPassword, busy, isLocalMode } = useAuth()
  const { toast } = useUI()
  const [mode, setMode] = useState('login') // login | register | profile
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submitLogin = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await signIn(email, password)
    } catch (err) {
      setError(authErrorMessage(err))
    }
  }

  const submitRegisterStep1 = (e) => {
    e.preventDefault()
    setError('')
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Geçerli bir e-posta gir')
    if (password.length < 6) return setError('Şifre en az 6 karakter olmalı')
    setMode('profile')
  }

  const submitProfile = async (p) => {
    try {
      await signUp({ email, password, ...p, dailyPageGoal: 30 })
    } catch (err) {
      const msg = authErrorMessage(err)
      toast(msg, 'error')
      if (err.code?.startsWith('auth/')) {
        setMode('register')
        setError(msg)
      }
    }
  }

  return (
    <div className="no-scrollbar scroll-touch absolute inset-0 overflow-y-auto bg-[radial-gradient(ellipse_at_top,#1A2438_0%,#0B0E14_60%)]">
      <div className="mx-auto flex min-h-full w-full max-w-[460px] flex-col justify-center px-6 pb-safe pt-safe">
        <>
          {mode === 'profile' ? (
            <motion.div key="profile" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }} className="py-8">
              <ProfileStep onSubmit={submitProfile} busy={busy} onBack={() => setMode('register')} />
            </motion.div>
          ) : (
            <motion.div key="cred" initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }} className="py-10">
              <Brand />

              <div className="mt-9 flex rounded-full bg-card p-1 hairline">
                {[
                  ['login', 'Giriş yap'],
                  ['register', 'Kayıt ol'],
                ].map(([m, label]) => (
                  <button
                    key={m}
                    onClick={() => {
                      setMode(m)
                      setError('')
                    }}
                    className={`relative flex-1 rounded-full py-2.5 text-[15.5px] font-semibold ${mode === m ? 'text-ink' : 'text-white/75'}`}
                  >
                    {mode === m && <motion.span layoutId="auth-tab" className="absolute inset-0 rounded-full bg-accent" />}
                    <span className="relative">{label}</span>
                  </button>
                ))}
              </div>

              <form onSubmit={mode === 'login' ? submitLogin : submitRegisterStep1} className="mt-5 space-y-3">
                <Field icon={Mail} type="email" placeholder="E-posta" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoCapitalize="off" />
                <Field
                  icon={Lock}
                  type="password"
                  placeholder="Şifre"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                {error && <div className="px-1 text-[14px] text-[#FF8A8E]">{error}</div>}
                <button type="submit" disabled={busy || !email || !password} className="btn-primary h-[46px] w-full text-[16px]">
                  {busy ? <Spinner size={20} className="border-ink/20 border-t-ink" /> : mode === 'login' ? 'Giriş yap' : 'Devam et'}
                </button>
              </form>

              {mode === 'login' && !isLocalMode && (
                <button
                  onClick={async () => {
                    if (!email) return setError('Önce e-postanı yaz')
                    try {
                      await resetPassword(email)
                      toast('Şifre sıfırlama e-postası gönderildi')
                    } catch (err) {
                      setError(authErrorMessage(err))
                    }
                  }}
                  className="press mx-auto mt-4 block text-[15px] text-mute"
                >
                  Şifremi unuttum
                </button>
              )}

            </motion.div>
          )}
        </>
      </div>
    </div>
  )
}
