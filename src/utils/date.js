export const DAY_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
export const MONTH_SHORT = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
export const MONTH_LONG = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
]

const pad = (n) => String(n).padStart(2, '0')

/** Yerel saat dilimine göre YYYY-MM-DD */
export function toDateStr(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** YYYY-MM-DD → yerel gece yarısı Date */
export function parseDateStr(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export function startOfDay(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Haftanın Pazartesi'si */
export function startOfWeek(date = new Date()) {
  const d = startOfDay(date)
  const idx = (d.getDay() + 6) % 7 // Pzt = 0
  return addDays(d, -idx)
}

/** 0 = Pzt ... 6 = Paz */
export function weekdayIndex(date) {
  return (new Date(date).getDay() + 6) % 7
}

export function formatDayMonth(dateOrStr) {
  const d = typeof dateOrStr === 'string' ? parseDateStr(dateOrStr) : new Date(dateOrStr)
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`
}

export function formatDayMonthYear(dateOrStr) {
  const d = typeof dateOrStr === 'string' && dateOrStr.length === 10 ? parseDateStr(dateOrStr) : new Date(dateOrStr)
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`
}

export function formatTime(dateOrIso) {
  const d = new Date(dateOrIso)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 70 → "01:10", 3725 → "1:02:05" */
export function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`
}

export function formatMinutes(min) {
  if (!min) return '0 dk'
  if (min < 60) return `${min} dk`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} sa ${m} dk` : `${h} sa`
}

export function greeting(date = new Date()) {
  const h = date.getHours()
  if (h >= 5 && h < 11) return 'Günaydın,'
  if (h >= 11 && h < 18) return 'İyi günler,'
  if (h >= 18 && h < 23) return 'İyi akşamlar,'
  return 'İyi geceler,'
}

export function toMillis(v) {
  if (!v) return 0
  if (typeof v === 'number') return v
  if (typeof v === 'string') return new Date(v).getTime()
  if (typeof v.toMillis === 'function') return v.toMillis()
  if (v.seconds) return v.seconds * 1000
  return 0
}
