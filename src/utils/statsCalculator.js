/**
 * Okuma istatistikleri: seri (streak), haftalık durum, günlük/aylık toplamlar ve yıllık hedef.
 * Tüm hesaplamalar yalnızca `excludeFromStats !== true` olan seansları baz alır.
 */
import { addDays, parseDateStr, startOfWeek, toDateStr, DAY_SHORT, toMillis } from './date'

/** İstatistiğe sayılan seanslar */
export function countedSessions(sessions = []) {
  return sessions.filter((s) => !s.excludeFromStats)
}

/** Bir gün "okuma yapılmış" sayılır mı? (sayfa veya süre > 0) */
export function isActiveDay(day) {
  return Boolean(day && (day.pages > 0 || day.minutes > 0))
}

/**
 * dateStr → { dateStr, pages, minutes, seconds, sessions[], books[] }
 * books: o gün okunan kitaplar (en çok sayfa okunandan aza doğru).
 */
export function groupSessionsByDay(sessions = []) {
  const map = new Map()
  for (const s of countedSessions(sessions)) {
    if (!s.dateStr) continue
    let day = map.get(s.dateStr)
    if (!day) {
      day = { dateStr: s.dateStr, pages: 0, minutes: 0, seconds: 0, sessions: [], _books: new Map() }
      map.set(s.dateStr, day)
    }
    const pages = Math.max(0, Number(s.pagesRead) || 0)
    const minutes = Math.max(0, Number(s.durationMinutes) || 0)
    day.pages += pages
    day.minutes += minutes
    day.seconds += Number(s.durationSeconds) || minutes * 60
    day.sessions.push(s)
    const key = s.bookId || s.bookTitle
    const prev = day._books.get(key) || {
      bookId: s.bookId,
      title: s.bookTitle,
      author: s.bookAuthor,
      cover: s.bookCover,
      pages: 0,
      minutes: 0,
    }
    prev.pages += pages
    prev.minutes += minutes
    day._books.set(key, prev)
  }
  for (const day of map.values()) {
    day.books = [...day._books.values()].sort((a, b) => b.pages - a.pages || b.minutes - a.minutes)
    day.sessions.sort((a, b) => toMillis(a.startTime || a.createdAt) - toMillis(b.startTime || b.createdAt))
    delete day._books
  }
  return map
}

/**
 * Ardışık gün serisi.
 * Bugün okuma yapılmadıysa seri dünden geriye doğru sayılır (gün bitene kadar seri "yaşar").
 */
export function calculateStreak(sessions = [], today = new Date()) {
  const days = groupSessionsByDay(sessions)
  const active = new Set([...days.values()].filter(isActiveDay).map((d) => d.dateStr))
  const todayStr = toDateStr(today)
  const activeToday = active.has(todayStr)

  let cursor = activeToday ? today : addDays(today, -1)
  let current = 0
  while (active.has(toDateStr(cursor))) {
    current++
    cursor = addDays(cursor, -1)
  }

  // En uzun seri
  const sorted = [...active].sort()
  let longest = 0
  let run = 0
  let prev = null
  for (const ds of sorted) {
    const d = parseDateStr(ds)
    run = prev && toDateStr(addDays(prev, 1)) === ds ? run + 1 : 1
    longest = Math.max(longest, run)
    prev = d
  }

  return { current, longest, activeToday, totalActiveDays: active.size }
}

/** İçinde bulunulan haftanın Pzt–Paz durumu */
export function weekStatus(sessions = [], today = new Date()) {
  const days = groupSessionsByDay(sessions)
  const monday = startOfWeek(today)
  const todayStr = toDateStr(today)
  return DAY_SHORT.map((label, i) => {
    const date = addDays(monday, i)
    const dateStr = toDateStr(date)
    const day = days.get(dateStr)
    return {
      label,
      dateStr,
      active: isActiveDay(day),
      isToday: dateStr === todayStr,
      isFuture: dateStr > todayStr,
      pages: day?.pages || 0,
    }
  })
}

/** Belirli bir günün toplamları */
export function dayStats(sessions = [], date = new Date()) {
  const day = groupSessionsByDay(sessions).get(toDateStr(date))
  return {
    pages: day?.pages || 0,
    minutes: day?.minutes || 0,
    seconds: day?.seconds || 0,
    books: day?.books || [],
    sessions: day?.sessions || [],
  }
}

/**
 * Takvim ızgarası (Pazartesi başlangıçlı).
 * cells: başta boş (null) hücreler + ayın her günü için hücre nesnesi.
 */
export function buildMonthGrid(year, month, sessions = [], today = new Date()) {
  const days = groupSessionsByDay(sessions)
  const first = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leading = (first.getDay() + 6) % 7
  const todayStr = toDateStr(today)

  const cells = Array.from({ length: leading }, () => null)
  const summary = { pages: 0, minutes: 0, days: 0, maxPages: 0 }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = toDateStr(new Date(year, month, d))
    const day = days.get(dateStr)
    const active = isActiveDay(day)
    if (active) {
      summary.pages += day.pages
      summary.minutes += day.minutes
      summary.days += 1
      summary.maxPages = Math.max(summary.maxPages, day.pages)
    }
    cells.push({
      day: d,
      dateStr,
      active,
      pages: day?.pages || 0,
      minutes: day?.minutes || 0,
      books: day?.books || [],
      sessions: day?.sessions || [],
      isToday: dateStr === todayStr,
      isFuture: dateStr > todayStr,
    })
  }
  return { cells, summary }
}

/** Bu yıl bitirilen kitaplar */
export function completedInYear(books = [], year = new Date().getFullYear()) {
  return books.filter((b) => {
    if (b.status !== 'completed' || !b.completedAt) return false
    return new Date(toMillis(b.completedAt)).getFullYear() === year
  })
}

export function yearlyGoalProgress(books = [], goal = 12, year = new Date().getFullYear()) {
  const done = completedInYear(books, year).length
  const safeGoal = Math.max(1, Number(goal) || 12)
  return {
    year,
    done,
    goal: safeGoal,
    remaining: Math.max(0, safeGoal - done),
    percent: Math.min(100, Math.round((done / safeGoal) * 100)),
  }
}

export function bookPercent(book) {
  if (!book?.totalPages) return 0
  return Math.min(100, Math.round(((book.currentPage || 0) / book.totalPages) * 100))
}

/** Profil "okunan" sayacı */
export function completedCount(books = []) {
  return books.filter((b) => b.status === 'completed').length
}
