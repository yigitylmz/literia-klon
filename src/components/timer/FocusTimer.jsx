import { useEffect } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { ChevronDown, Pause, Play, Square } from 'lucide-react'
import ReadingBunny from './ReadingBunny'
import SaveSessionSheet from './SaveSessionSheet'
import SessionSummary from './SessionSummary'
import { useTimer, useElapsedSeconds } from '../../context/TimerContext'
import { useData } from '../../context/DataContext'
import { useUI } from '../../context/UIContext'
import { formatClock } from '../../utils/date'

const shellSpring = { type: 'spring', damping: 34, stiffness: 320, mass: 0.9 }

function Ring({ seconds, running }) {
  const r = 112
  const c = 2 * Math.PI * r
  const frac = (seconds % 60) / 60
  return (
    <svg viewBox="0 0 240 240" className="absolute inset-0 h-full w-full -rotate-90">
      <circle cx="120" cy="120" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
      <circle
        cx="120"
        cy="120"
        r={r}
        fill="none"
        stroke="#8AB4F8"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - frac)}
        style={{ transition: 'stroke-dashoffset 0.3s linear', opacity: running ? 0.9 : 0.35 }}
      />
    </svg>
  )
}

function FullScreen({ timer, seconds, api }) {
  const running = Boolean(timer.runningSince)
  return (
    <motion.div
      layoutId="focus-shell"
      transition={shellSpring}
      className="fixed inset-0 z-[65] overflow-hidden bg-gradient-to-b from-[#1A2131] via-[#121825] to-ink"
      style={{ borderRadius: 0 }}
    >
      <motion.div
        className="mx-auto flex h-full w-full max-w-[560px] flex-col px-5 pb-safe pt-safe"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.12 } }}
        exit={{ opacity: 0, transition: { duration: 0.1 } }}
      >
        <div className="flex h-14 items-center">
          <button
            onClick={api.minimize}
            className="press -ml-2 flex h-12 w-12 items-center justify-center rounded-full text-white/90"
            aria-label="Küçült"
          >
            <ChevronDown size={30} />
          </button>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center">
          <ReadingBunny paused={!running} className="w-[min(62vw,260px)]" />
          <motion.h2 layoutId="focus-title" className="mt-4 max-w-full truncate px-4 text-center font-serif text-[20px]">
            {timer.book.title}
          </motion.h2>
          <div className="mt-1.5 flex items-center gap-2 text-[13px] font-semibold tracking-[0.18em] text-mute">
            <span className={`h-2 w-2 rounded-full ${running ? 'animate-pulseDot bg-accent' : 'bg-mute-2'}`} />
            {running ? 'OKUNUYOR' : 'DURAKLATILDI'}
          </div>

          <div className="relative mt-8 flex h-[min(62vw,250px)] w-[min(62vw,250px)] items-center justify-center rounded-full bg-white/[0.02]">
            <Ring seconds={seconds} running={running} />
            <motion.span layoutId="focus-clock" className="text-[clamp(52px,15vw,68px)] font-bold tracking-tight tabular">
              {formatClock(seconds)}
            </motion.span>
          </div>
        </div>

        <div className="mb-2 mt-6 space-y-3">
          <button onClick={api.toggle} className="press flex h-[46px] w-full items-center justify-center gap-2.5 rounded-2xl bg-white/[0.04] text-[16px] font-medium hairline">
            {running ? <Pause size={20} className="fill-current" /> : <Play size={20} className="fill-current" />}
            {running ? 'Duraklat' : 'Devam et'}
          </button>
          <button onClick={api.openSave} className="btn-primary h-[46px] w-full text-[16px]">
            <Square size={16} className="fill-current" />
            Bitir &amp; Kaydet
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function MiniPlayer({ timer, seconds, api }) {
  const running = Boolean(timer.runningSince)
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-tabbar z-[45] flex justify-center px-4">
      <motion.div
        layoutId="focus-shell"
        transition={shellSpring}
        style={{ borderRadius: 999 }}
        className="glass-strong pointer-events-auto flex h-[46px] max-w-full items-center gap-3 overflow-hidden pl-5 pr-2 shadow-glass hairline"
      >
        <button onClick={api.expand} className="flex min-w-0 items-center gap-3" aria-label="Okuma sayacını aç">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${running ? 'animate-pulseDot bg-accent' : 'bg-mute-2'}`} />
          <motion.span layoutId="focus-clock" className="text-[17px] font-bold tabular">
            {formatClock(seconds)}
          </motion.span>
          <motion.span layoutId="focus-title" className="max-w-[40vw] truncate text-[15px] text-mute">
            {timer.book.title}
          </motion.span>
        </button>
        <button
          onClick={api.toggle}
          className="press flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-accent"
          aria-label={running ? 'Duraklat' : 'Devam et'}
        >
          {running ? <Pause size={22} className="fill-current" /> : <Play size={22} className="fill-current" />}
        </button>
      </motion.div>
    </div>
  )
}

/** Uygulama genelinde sayaç katmanı: tam ekran ↔ yüzen mini-player, kayıt paneli, seans özeti. */
export default function FocusTimer() {
  const api = useTimer()
  const { timer } = api
  const seconds = useElapsedSeconds(timer)
  const { saveTimerSession, updateSession, bookById } = useData()
  const { toast, openRating } = useUI()

  const miniVisible = Boolean(timer && !timer.expanded && timer.phase === 'timer')
  useEffect(() => {
    document.documentElement.style.setProperty('--mini-h', miniVisible ? '66px' : '0px')
  }, [miniVisible])

  const liveBook = timer ? bookById(timer.book.id) || timer.book : null

  const handleSave = async ({ seconds: secs, page }) => {
    try {
      const endedAt = timer.endedAt || Date.now()
      const startedAt = Math.min(timer.startedAt, endedAt - secs * 1000)
      const res = await saveTimerSession(liveBook, {
        startedAt,
        endedAt,
        seconds: secs,
        page,
      })
      api.showSummary({
        sessionId: res.sessionId,
        startedAt,
        endedAt,
        minutes: res.minutes,
        pagesRead: res.pagesRead,
        completed: res.completed,
        book: {
          id: liveBook.id,
          title: liveBook.title,
          author: liveBook.author,
          coverUrl: liveBook.coverUrl,
          coverThumb: liveBook.coverThumb,
        },
      })
    } catch (e) {
      toast(e.message || 'Kaydedilemedi', 'error')
    }
  }

  const finishSummary = () => {
    const s = timer?.summary
    api.discard()
    if (s?.completed) {
      toast('Tebrikler, kitabı bitirdin!')
      setTimeout(() => openRating(s.book), 400)
    }
  }

  return (
    <LayoutGroup id="focus">
      <AnimatePresence>
        {timer && timer.expanded && timer.phase !== 'summary' && (
          <FullScreen key="full" timer={timer} seconds={seconds} api={api} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {miniVisible && <MiniPlayer key="mini" timer={timer} seconds={seconds} api={api} />}
      </AnimatePresence>

      <SaveSessionSheet
        open={Boolean(timer && timer.phase === 'saving')}
        book={liveBook}
        seconds={seconds}
        onCancel={api.cancelSave}
        onSave={handleSave}
      />

      <AnimatePresence>
        {timer?.phase === 'summary' && timer.summary && (
          <SessionSummary
            key="summary"
            summary={timer.summary}
            onDone={finishSummary}
            onEditMinutes={async (m) => {
              api.setSummary({ minutes: m })
              try {
                await updateSession(timer.summary.sessionId, { durationMinutes: m, durationSeconds: m * 60 })
              } catch (e) {
                toast(e.message, 'error')
              }
            }}
          />
        )}
      </AnimatePresence>
    </LayoutGroup>
  )
}
