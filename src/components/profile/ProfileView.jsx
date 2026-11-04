import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  Settings,
  MoreVertical,
  Users,
  UserPlus,
  UserCheck,
  Share,
  Pencil,
  ChevronLeft,
  Search,
  Plus,
  UserMinus,
} from 'lucide-react'
import BookCover from '../BookCover'
import GoalCard from '../GoalCard'
import GoalSheet from '../GoalSheet'
import BottomSheet from '../ui/BottomSheet'
import { Avatar, ProgressBar, Stars } from '../ui/primitives'
import BookDetailSheet from '../library/BookDetailSheet'
import EditProfileSheet from './EditProfileSheet'
import FavoritePickerSheet from './FavoritePickerSheet'
import FollowListSheet from './FollowListSheet'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { useUI } from '../../context/UIContext'
import { bookPercent, completedCount, yearlyGoalProgress } from '../../utils/statsCalculator'
import { formatDayMonthYear, toMillis } from '../../utils/date'
import { shareOrCopy } from '../../utils/helpers'

function SectionHead({ title, onAll }) {
  return (
    <div className="mb-3 mt-9 flex items-center justify-between">
      <div className="section-label">{title}</div>
      {onAll && (
        <button onClick={onAll} className="press text-[16px] text-accent">
          Tümünü gör
        </button>
      )}
    </div>
  )
}

export function reviewedBooks(books) {
  return books
    .filter((b) => b.status === 'completed' && (b.rating || b.reviewText))
    .sort((a, b) => toMillis(b.reviewedAt || b.completedAt) - toMillis(a.reviewedAt || a.completedAt))
}

export function ReviewRow({ book, onClick }) {
  return (
    <button onClick={onClick} className="card press flex w-full gap-4 p-4 text-left">
      <BookCover book={book} className="aspect-[2/3] w-[64px] shrink-0" rounded="rounded-lg" compact />
      <div className="min-w-0 flex-1 py-1">
        <div className="truncate font-serif text-[18px]">{book.title}</div>
        <div className="mt-2 flex items-center gap-3">
          <Stars value={book.rating} size={17} color="text-accent" gap="gap-1" />
          <span className="text-[15px] text-mute">
            {formatDayMonthYear(new Date(toMillis(book.reviewedAt || book.completedAt)))}
          </span>
        </div>
        {book.reviewText && <p className="mt-2 line-clamp-2 text-[14.5px] leading-snug text-white/75">{book.reviewText}</p>}
      </div>
    </button>
  )
}

/**
 * Hem kendi profilimiz hem arkadaş profili için ortak görünüm.
 */
export default function ProfileView({ profile, books, isOwn }) {
  const navigate = useNavigate()
  const { profile: me } = useAuth()
  const data = useData()
  const { toast, confirm } = useUI()

  const [editOpen, setEditOpen] = useState(false)
  const [favOpen, setFavOpen] = useState(false)
  const [goalOpen, setGoalOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [list, setList] = useState(null) // { title, uids }
  const [detail, setDetail] = useState(null)

  const reading = useMemo(() => books.filter((b) => b.status === 'reading'), [books])
  const libraryPreview = useMemo(
    () => [...books].sort((a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt)).slice(0, 12),
    [books],
  )
  const reviews = useMemo(() => reviewedBooks(books).slice(0, 3), [books])
  const goal = yearlyGoalProgress(books, profile.yearlyGoal)
  const bookMap = useMemo(() => new Map(books.map((b) => [b.id, b])), [books])
  const favorites = (profile.favorites || []).map((f) => bookMap.get(f.bookId) || { ...f, id: f.bookId })

  const iFollow = (me?.following || []).includes(profile.uid)
  const followsMe = (me?.followers || []).includes(profile.uid)

  const openDetail = (b) => setDetail(b)

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}#/u/${profile.nickname}`
    const res = await shareOrCopy({ title: `@${profile.nickname}`, text: `${profile.displayName} (@${profile.nickname}) okuma profili`, url })
    if (res === 'copied') toast('Profil bağlantısı kopyalandı')
  }

  const followAction = async () => {
    if (iFollow) {
      const ok = await confirm({
        title: 'Takibi bırak?',
        message: `@${profile.nickname} artık akışında olmayacak.`,
        confirmText: 'Takibi bırak',
        destructive: true,
      })
      if (ok) await data.unfollow(profile.uid)
    } else {
      await data.follow(profile.uid)
      toast(followsMe ? 'Artık arkadaşsınız' : `@${profile.nickname} takip ediliyor`)
    }
  }

  const followBtn = iFollow
    ? followsMe
      ? { label: 'Arkadaş', icon: Users, style: 'bg-transparent text-white ring-1 ring-white/15' }
      : { label: 'Takip ediliyor', icon: UserCheck, style: 'bg-transparent text-white ring-1 ring-white/15' }
    : followsMe
      ? { label: 'Geri takip et', icon: UserPlus, style: 'bg-accent text-ink' }
      : { label: 'Takip et', icon: UserPlus, style: 'bg-accent text-ink' }

  return (
    <div>
      {/* Üst bar */}
      <div className="flex min-h-[46px] items-center gap-2 pt-2">
        {!isOwn && (
          <button onClick={() => navigate(-1)} className="press -ml-2 flex h-11 w-11 items-center justify-center" aria-label="Geri">
            <ChevronLeft size={30} />
          </button>
        )}
        <h1 className={`min-w-0 flex-1 truncate font-serif text-[23px] font-medium ${isOwn ? '' : 'ml-1'}`}>
          @{profile.nickname}
        </h1>
        <button
          onClick={() => navigate(isOwn ? '/stats' : `/u/${profile.nickname}/calendar`)}
          className="press flex h-11 w-11 items-center justify-center"
          aria-label="Okuma takvimi"
        >
          <CalendarDays size={26} strokeWidth={1.9} />
        </button>
        {isOwn ? (
          <button onClick={() => navigate('/settings')} className="press -mr-2 flex h-11 w-11 items-center justify-center" aria-label="Ayarlar">
            <Settings size={25} strokeWidth={1.9} />
          </button>
        ) : (
          <button onClick={() => setMenuOpen(true)} className="press -mr-2 flex h-11 w-11 items-center justify-center" aria-label="Daha fazla">
            <MoreVertical size={26} />
          </button>
        )}
      </div>

      {/* Kapak + avatar */}
      <div className="relative -mx-5 mt-1 h-[104px] bg-gradient-to-br from-[#56709F] via-[#2A3A57] to-[#121826]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.15),transparent_55%)]" />
      </div>
      <div className="flex items-end gap-4">
        <div className="relative z-10 -mt-9 rounded-full ring-4 ring-ink">
          <Avatar user={profile} size={72} />
        </div>
        <div className="grid flex-1 grid-cols-3 pb-1 text-center">
          <div>
            <div className="font-serif text-[22px] leading-none tabular">{completedCount(books)}</div>
            <div className="mt-1.5 text-[15px] text-mute">okunan</div>
          </div>
          <button onClick={() => setList({ title: 'Takipçiler', uids: profile.followers || [] })} className="press">
            <div className="font-serif text-[22px] leading-none tabular">{profile.followers?.length || 0}</div>
            <div className="mt-1.5 text-[15px] text-mute">takipçi</div>
          </button>
          <button onClick={() => setList({ title: 'Takip edilenler', uids: profile.following || [] })} className="press">
            <div className="font-serif text-[22px] leading-none tabular">{profile.following?.length || 0}</div>
            <div className="mt-1.5 text-[15px] text-mute">takip</div>
          </button>
        </div>
      </div>

      <div className="mt-5">
        <div className="font-serif text-[22px] font-medium leading-tight">{profile.displayName}</div>
        <div className="text-[16px] text-mute">@{profile.nickname}</div>
      </div>

      {/* Aksiyonlar */}
      <div className="mt-5 flex items-center gap-3">
        {isOwn ? (
          <>
            <button onClick={() => setEditOpen(true)} className="press flex h-[44px] min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl text-[14px] font-medium ring-1 ring-white/15">
              <Pencil size={17} className="shrink-0" /> Profili düzenle
            </button>
            <button
              onClick={() => navigate('/friends')}
              className="press flex h-[44px] min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl bg-accent/[0.12] text-[14px] font-medium text-accent ring-1 ring-accent/30"
            >
              <Search size={17} className="shrink-0" /> Arkadaş ara
            </button>
          </>
        ) : (
          <button
            onClick={followAction}
            className={`press flex h-[44px] flex-1 items-center justify-center gap-2 rounded-2xl text-[16px] font-medium ${followBtn.style}`}
          >
            <followBtn.icon size={20} className={followBtn.label === 'Arkadaş' ? 'fill-accent/40 text-accent' : ''} />
            {followBtn.label}
          </button>
        )}
        <button onClick={share} className="press flex h-[44px] w-10 shrink-0 items-center justify-center" aria-label="Paylaş">
          <Share size={25} />
        </button>
      </div>

      {/* Favoriler */}
      <SectionHead title="Favoriler" />
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }, (_, i) => favorites[i]).map((f, i) =>
          f ? (
            <button key={f.id} onClick={() => (isOwn ? setFavOpen(true) : openDetail(f))} className="press">
              <BookCover book={f} className="aspect-[2/3] w-full shadow-lg" rounded="rounded-[14px]" compact />
            </button>
          ) : (
            <button
              key={`e${i}`}
              disabled={!isOwn}
              onClick={() => setFavOpen(true)}
              className="flex aspect-[2/3] items-center justify-center rounded-[14px] bg-card-3/60"
            >
              {isOwn && <Plus size={22} className="text-mute-2" />}
            </button>
          ),
        )}
      </div>

      {/* Şu an okuyor */}
      {reading.length > 0 && (
        <>
          <SectionHead title={isOwn ? 'Şu an okuyorum' : 'Şu an okuyor'} />
          <div className="space-y-3">
            {reading.map((b) => {
              const pct = bookPercent(b)
              return (
                <button key={b.id} onClick={() => openDetail(b)} className="card press flex w-full gap-4 p-4 text-left">
                  <BookCover book={b} className="aspect-[2/3] w-[78px] shrink-0" rounded="rounded-[10px]" />
                  <div className="min-w-0 flex-1 py-1">
                    <div className="line-clamp-2 font-serif text-[19px] leading-tight">{b.title}</div>
                    <div className="mt-1 truncate text-[16px] text-mute">{b.author}</div>
                    <div className="mt-3 flex justify-between text-[16px] text-mute">
                      <span>
                        Sayfa <span className="font-semibold text-white">{b.currentPage || 0}</span>/{b.totalPages}
                      </span>
                      <span>%{pct}</span>
                    </div>
                    <ProgressBar value={pct} className="mt-2" />
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}

      <div className="mt-4">
        <GoalCard progress={goal} chevron onClick={() => setGoalOpen(true)} />
      </div>

      {/* Kütüphane */}
      <div className="-mx-5 mt-8 border-t border-white/[0.06] px-5" />
      <SectionHead
        title="Kütüphane"
        onAll={books.length ? () => navigate(isOwn ? '/library' : `/u/${profile.nickname}/library`) : null}
      />
      {libraryPreview.length === 0 ? (
        <p className="text-[15px] text-mute">Kütüphane henüz boş.</p>
      ) : (
        <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5">
          {libraryPreview.map((b) => (
            <button key={b.id} onClick={() => openDetail(b)} className="press w-[38%] max-w-[170px] shrink-0">
              <BookCover book={b} className="aspect-[2/3] w-full shadow-lg" rounded="rounded-[14px]" />
            </button>
          ))}
        </div>
      )}

      {/* Son incelemeler */}
      <SectionHead
        title="Son incelemeler"
        onAll={reviews.length ? () => navigate(`/u/${profile.nickname}/reviews`) : null}
      />
      {reviews.length === 0 ? (
        <p className="text-[15px] text-mute">Henüz inceleme yok.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((b) => (
            <ReviewRow key={b.id} book={b} onClick={() => openDetail(b)} />
          ))}
        </div>
      )}

      {/* Paneller */}
      <BookDetailSheet book={detail} open={Boolean(detail)} onClose={() => setDetail(null)} readOnly={!isOwn} />
      <GoalSheet
        open={goalOpen}
        onClose={() => setGoalOpen(false)}
        books={books}
        goal={profile.yearlyGoal || 12}
        editable={isOwn}
        onSaveGoal={(v) => data.updateProfile({ yearlyGoal: v }).then(() => toast('Hedef güncellendi'))}
      />
      <FollowListSheet open={Boolean(list)} onClose={() => setList(null)} title={list?.title} uids={list?.uids || []} />
      {isOwn && (
        <>
          <EditProfileSheet open={editOpen} onClose={() => setEditOpen(false)} profile={profile} />
          <FavoritePickerSheet open={favOpen} onClose={() => setFavOpen(false)} favorites={profile.favorites || []} />
        </>
      )}
      {!isOwn && (
        <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)}>
          <div className="pb-4">
            <button
              onClick={() => {
                setMenuOpen(false)
                share()
              }}
              className="flex w-full items-center gap-3 py-4 text-[16px]"
            >
              <Share size={20} /> Profili paylaş
            </button>
            <button
              onClick={() => {
                setMenuOpen(false)
                navigate(`/u/${profile.nickname}/calendar`)
              }}
              className="flex w-full items-center gap-3 border-t border-white/[0.06] py-4 text-[16px]"
            >
              <CalendarDays size={20} /> Okuma takvimini gör
            </button>
            {iFollow && (
              <button
                onClick={() => {
                  setMenuOpen(false)
                  followAction()
                }}
                className="flex w-full items-center gap-3 border-t border-white/[0.06] py-4 text-[16px] text-[#FF7A7E]"
              >
                <UserMinus size={20} /> Takibi bırak
              </button>
            )}
          </div>
        </BottomSheet>
      )}
    </div>
  )
}
