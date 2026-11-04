/**
 * Canlı okuma sayacı. Süre her zaman `Date.now()` farkından hesaplanır;
 * iOS Safari uygulamayı arka plana atıp setInterval'ı dondursa bile süre doğru kalır.
 * Durum LocalStorage'a yazılır → uygulama kapanıp açılsa da seans devam eder.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const KEY = 'satir:timer:v1'
const TimerContext = createContext(null)

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || null
  } catch {
    return null
  }
}

export function elapsedMsOf(t, now = Date.now()) {
  if (!t) return 0
  return (t.accumulatedMs || 0) + (t.runningSince ? now - t.runningSince : 0)
}

export function TimerProvider({ children }) {
  // timer: { book, startedAt, runningSince, accumulatedMs, expanded, phase: 'timer'|'saving'|'summary', summary }
  const [timer, setTimer] = useState(load)

  useEffect(() => {
    try {
      if (timer) localStorage.setItem(KEY, JSON.stringify(timer))
      else localStorage.removeItem(KEY)
    } catch {
      /* yoksay */
    }
  }, [timer])

  const update = useCallback((fn) => setTimer((t) => (t ? { ...t, ...fn(t) } : t)), [])

  const api = useMemo(
    () => ({
      timer,
      isActive: Boolean(timer),
      isRunning: Boolean(timer?.runningSince),
      start(book) {
        const now = Date.now()
        setTimer({
          book: {
            id: book.id,
            title: book.title,
            author: book.author,
            coverUrl: book.coverUrl,
            coverThumb: book.coverThumb,
            currentPage: book.currentPage,
            totalPages: book.totalPages,
          },
          startedAt: now,
          runningSince: now,
          accumulatedMs: 0,
          expanded: true,
          phase: 'timer',
          wasRunning: true,
          summary: null,
        })
      },
      pause: () =>
        update((t) =>
          t.runningSince ? { accumulatedMs: elapsedMsOf(t), runningSince: null } : {},
        ),
      resume: () => update((t) => (t.runningSince ? {} : { runningSince: Date.now() })),
      toggle: () =>
        update((t) =>
          t.runningSince
            ? { accumulatedMs: elapsedMsOf(t), runningSince: null }
            : { runningSince: Date.now() },
        ),
      minimize: () => update(() => ({ expanded: false })),
      expand: () => update(() => ({ expanded: true })),
      /** "Bitir & Kaydet": sayaç durur, kayıt paneli açılır */
      openSave: () =>
        update((t) => ({
          wasRunning: Boolean(t.runningSince),
          accumulatedMs: elapsedMsOf(t),
          runningSince: null,
          endedAt: Date.now(),
          phase: 'saving',
          expanded: true,
        })),
      /** Kayıt panelinden vazgeç → kaldığı yerden devam */
      cancelSave: () =>
        update((t) => ({ phase: 'timer', runningSince: t.wasRunning ? Date.now() : null, endedAt: null })),
      showSummary: (summary) => update(() => ({ phase: 'summary', summary, expanded: true })),
      setSummary: (patch) => update((t) => ({ summary: { ...t.summary, ...patch } })),
      discard: () => setTimer(null),
    }),
    [timer, update],
  )

  return <TimerContext.Provider value={api}>{children}</TimerContext.Provider>
}

export const useTimer = () => useContext(TimerContext)

/** Canlı geçen süre (saniye). Görünürlük değişince anında yeniden hesaplanır. */
export function useElapsedSeconds(timer) {
  const [now, setNow] = useState(Date.now())
  const running = Boolean(timer?.runningSince)
  useEffect(() => {
    if (!running) {
      setNow(Date.now())
      return
    }
    const tick = () => setNow(Date.now())
    const id = setInterval(tick, 250)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [running])
  return Math.floor(elapsedMsOf(timer, now) / 1000)
}
