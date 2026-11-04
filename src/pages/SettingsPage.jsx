import { useState } from 'react'
import { Database, Trash2, LogOut, Smartphone, Cloud, HardDrive, ChevronRight, Target, UserPen } from 'lucide-react'
import Page from '../components/Page'
import { Avatar, TopBar } from '../components/ui/primitives'
import EditProfileSheet from '../components/profile/EditProfileSheet'
import GoalSheet from '../components/GoalSheet'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useUI } from '../context/UIContext'
import { useTimer } from '../context/TimerContext'
import { repo } from '../data/repo'

function Row({ icon: Icon, label, hint, onClick, danger, right }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-white/[0.03]">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] ${
          danger ? 'bg-[#E5484D]/15 text-[#FF7A7E]' : 'bg-white/[0.06] text-accent'
        }`}
      >
        <Icon size={17} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[16px] ${danger ? 'text-[#FF8A8E]' : 'text-white/95'}`}>{label}</span>
        {hint && <span className="mt-0.5 block text-[13px] leading-snug text-mute">{hint}</span>}
      </span>
      {right ?? <ChevronRight size={18} className="text-mute-2" />}
    </button>
  )
}

function Group({ title, children }) {
  return (
    <div className="mt-6">
      {title && <div className="section-label mb-2 px-1">{title}</div>}
      <div className="card divide-y divide-white/[0.05] overflow-hidden">{children}</div>
    </div>
  )
}

export default function SettingsPage() {
  const { profile, authUser, signOut, isLocalMode } = useAuth()
  const data = useData()
  const { toast, confirm } = useUI()
  const timer = useTimer()
  const [editOpen, setEditOpen] = useState(false)
  const [goalOpen, setGoalOpen] = useState(false)
  const [installOpen, setInstallOpen] = useState(false)

  const clear = async () => {
    const ok = await confirm({
      title: 'Verilerin silinsin mi?',
      message: 'Tüm kitapların, seansların ve favorilerin kalıcı olarak silinir. Profilin ve arkadaşların kalır.',
      confirmText: 'Sil',
      destructive: true,
    })
    if (!ok) return
    timer.discard()
    await data.clearMyData()
    toast('Veriler silindi', 'info')
  }

  const wipe = async () => {
    const ok = await confirm({
      title: 'Cihazdaki her şey silinsin mi?',
      message: 'Yerel moddaki tüm hesaplar ve veriler bu cihazdan kaldırılır.',
      confirmText: 'Hepsini sil',
      destructive: true,
    })
    if (!ok) return
    timer.discard()
    await repo.wipeEverything()
  }

  const logout = async () => {
    const ok = await confirm({ title: 'Çıkış yapılsın mı?', confirmText: 'Çıkış yap', destructive: true })
    if (!ok) return
    timer.discard()
    await signOut()
  }

  return (
    <Page>
      <TopBar back title="Ayarlar" className="pt-2" />

      <div className="card mt-3 flex items-center gap-3.5 p-4">
        <Avatar user={profile} size={52} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-serif text-[18px]">{profile.displayName}</div>
          <div className="truncate text-[13.5px] text-mute">
            @{profile.nickname} · {authUser?.email}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-2xl bg-white/[0.03] px-4 py-3 text-[13px] leading-snug text-mute hairline">
        {isLocalMode ? (
          <HardDrive size={16} className="shrink-0 text-streak-soft" />
        ) : (
          <Cloud size={16} className="shrink-0 text-ok" />
        )}
        {isLocalMode
          ? 'Yerel mod — veriler yalnızca bu cihazda saklanıyor. Firebase anahtarlarını ekleyince bulut senkronu açılır.'
          : 'Firebase bağlı — verilerin gerçek zamanlı senkronize ediliyor (çevrimdışı önbellek açık).'}
      </div>

      <Group title="Profil">
        <Row icon={UserPen} label="Profili düzenle" hint="Fotoğraf, isim, @kullanıcıadı" onClick={() => setEditOpen(true)} />
        <Row
          icon={Target}
          label="Okuma hedefleri"
          hint={`Yılda ${profile.yearlyGoal || 12} kitap · Günde ${profile.dailyPageGoal || 30} sayfa`}
          onClick={() => setGoalOpen(true)}
        />
      </Group>

      <Group title="Veri">
        <Row icon={Trash2} label="Kitap ve seanslarımı sil" onClick={clear} danger />
        {isLocalMode && <Row icon={Database} label="Cihazdaki tüm verileri sil" onClick={wipe} danger />}
      </Group>

      <Group title="Uygulama">
        <Row icon={Smartphone} label="Ana ekrana ekle" hint="Tam ekran uygulama deneyimi için" onClick={() => setInstallOpen((v) => !v)} />
        {installOpen && (
          <div className="px-5 pb-4 text-[14px] leading-relaxed text-white/80">
            Safari’de alttaki <b>Paylaş</b> düğmesine dokun → <b>Ana Ekrana Ekle</b>’yi seç → <b>Ekle</b>. Uygulama artık tam ekran,
            adres çubuğu olmadan açılır.
          </div>
        )}
      </Group>

      <Group>
        <Row icon={LogOut} label="Çıkış yap" onClick={logout} danger right={<span />} />
      </Group>

      <div className="mt-8 text-center text-[12.5px] text-mute-2">Satır · v1.0</div>

      <EditProfileSheet open={editOpen} onClose={() => setEditOpen(false)} profile={profile} />
      <GoalSheet
        open={goalOpen}
        onClose={() => setGoalOpen(false)}
        books={data.books}
        goal={profile.yearlyGoal || 12}
        editable
        onSaveGoal={(v) => data.updateProfile({ yearlyGoal: v }).then(() => toast('Hedef güncellendi'))}
      />
    </Page>
  )
}
