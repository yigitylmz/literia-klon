import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CalendarDays } from 'lucide-react'
import Page from '../components/Page'
import StreakCard from '../components/home/StreakCard'
import CurrentlyReading from '../components/home/CurrentlyReading'
import GoalCard from '../components/GoalCard'
import GoalSheet from '../components/GoalSheet'
import ProgressSheet from '../components/ProgressSheet'
import NotificationsSheet from '../components/NotificationsSheet'
import BookDetailSheet from '../components/library/BookDetailSheet'
import SearchModal from '../components/library/SearchModal'
import { ProgressBar } from '../components/ui/primitives'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useTimer } from '../context/TimerContext'
import { useUI } from '../context/UIContext'
import { calculateStreak, weekStatus, dayStats, yearlyGoalProgress } from '../utils/statsCalculator'
import { greeting, toMillis } from '../utils/date'

const DAILY_MINUTE_GOAL = 30

export default function HomePage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { books, sessions, updateProfile } = useData()
  const timer = useTimer()
  const { toast } = useUI()

  const [progressBook, setProgressBook] = useState(null)
  const [progressOpen, setProgressOpen] = useState(false)
  const [detailBook, setDetailBook] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [goalOpen, setGoalOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const streak = useMemo(() => calculateStreak(sessions), [sessions])
  const week = useMemo(() => weekStatus(sessions), [sessions])
  const today = useMemo(() => dayStats(sessions), [sessions])
  const goal = yearlyGoalProgress(books, profile?.yearlyGoal)
  const dailyGoal = profile?.dailyPageGoal || 30

  const reading = useMemo(
    () =>
      books
        .filter((b) => b.status === 'reading')
        .sort((a, b) => toMillis(b.startedAt || b.createdAt) - toMillis(a.startedAt || a.createdAt)),
    [books],
  )

  const liveProgressBook = progressBook ? books.find((b) => b.id === progressBook.id) || progressBook : null
  const newFollowers = (profile?.followers || []).filter((f) => !(profile?.following || []).includes(f)).length

  const start = (book) => {
    if (timer.timer && timer.timer.book.id !== book.id) return toast('Önce devam eden okumayı bitir', 'info')
    timer.start(book)
  }

  return (
    <Page>
      {/* Üst bar */}
      <header className="flex items-center justify-between pb-5 pt-4">
        <div className="min-w-0">
          <div className="text-[16px] text-mute">{greeting()}</div>
          <div className="truncate font-serif text-[23px] font-medium leading-tight">
            {profile?.displayName || profile?.nickname}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button onClick={() => setNotifOpen(true)} className="icon-btn relative h-[44px] w-[44px]" aria-label="Bildirimler">
            <Bell size={22} strokeWidth={1.8} />
            {newFollowers > 0 && <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-streak ring-2 ring-card" />}
          </button>
          <button onClick={() => navigate('/stats')} className="icon-btn h-[44px] w-[44px]" aria-label="Okuma takvimi">
            <CalendarDays size={22} strokeWidth={1.8} />
          </button>
        </div>
      </header>

      <div className="space-y-4">
        <StreakCard streak={streak} week={week} todayPages={today.pages} onClick={() => navigate('/stats')} />

        {/* Bento */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-4">
            <div className="text-[14.5px] text-mute">Bugün okunan</div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-[28px] font-bold leading-none tabular">{today.pages}</span>
              <span className="text-[17px] text-mute">/ {dailyGoal} sf</span>
            </div>
            <ProgressBar value={(today.pages / dailyGoal) * 100} className="mt-4" />
          </div>
          <div className="card p-4">
            <div className="text-[14.5px] text-mute">Süre</div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-[28px] font-bold leading-none tabular">{today.minutes}</span>
              <span className="text-[17px] text-mute">dk</span>
            </div>
            <ProgressBar value={(today.minutes / DAILY_MINUTE_GOAL) * 100} className="mt-4" />
          </div>
        </div>

        <GoalCard progress={goal} onClick={() => setGoalOpen(true)} />
      </div>

      <section className="mt-8">
        <div className="section-label mb-3">Şu an okuyorum</div>
        <CurrentlyReading
          books={reading}
          timer={timer.timer}
          onStart={start}
          onEdit={(b) => {
            setProgressBook(b)
            setProgressOpen(true)
          }}
          onOpenTimer={timer.expand}
          onOpenBook={(b) => {
            setDetailBook(b)
            setDetailOpen(true)
          }}
          onSearch={() => setSearchOpen(true)}
        />
      </section>

      <ProgressSheet book={liveProgressBook} open={progressOpen} onClose={() => setProgressOpen(false)} />
      <BookDetailSheet
        book={detailBook}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onProgress={(b) => {
          setProgressBook(b)
          setProgressOpen(true)
        }}
      />
      <GoalSheet
        open={goalOpen}
        onClose={() => setGoalOpen(false)}
        books={books}
        goal={profile?.yearlyGoal || 12}
        editable
        onSaveGoal={(v) => updateProfile({ yearlyGoal: v }).then(() => toast('Hedef güncellendi'))}
      />
      <NotificationsSheet open={notifOpen} onClose={() => setNotifOpen(false)} profile={profile} />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </Page>
  )
}
