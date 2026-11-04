import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { repo } from '../data/repo'
import { useAuth } from './AuthContext'
import { toDateStr } from '../utils/date'
import { clamp, favSnapshot, remoteUrl } from '../utils/helpers'
import { resolveCover } from '../services/booksApi'

const DataContext = createContext(null)

/** Herhangi bir kullanıcının (kendimiz veya arkadaş) profil + kitap + seans aboneliği. */
export function useUserBundle(userId, { withProfile = true } = {}) {
  const [profile, setProfile] = useState(undefined)
  const [books, setBooks] = useState(undefined)
  const [sessions, setSessions] = useState(undefined)

  useEffect(() => {
    if (!userId) return
    setBooks(undefined)
    setSessions(undefined)
    const unsubs = [repo.watchBooks(userId, setBooks), repo.watchSessions(userId, setSessions)]
    if (withProfile) {
      setProfile(undefined)
      unsubs.push(repo.watchUser(userId, setProfile))
    }
    return () => unsubs.forEach((u) => u && u())
  }, [userId, withProfile])

  return {
    profile,
    books: books || [],
    sessions: sessions || [],
    loading: books === undefined || sessions === undefined || (withProfile && profile === undefined),
  }
}

const nowIso = () => new Date().toISOString()

export function DataProvider({ children }) {
  const { uid, profile } = useAuth()
  const { books, sessions, loading } = useUserBundle(uid, { withProfile: false })

  const bookById = useCallback((id) => books.find((b) => b.id === id), [books])

  /** Seans kaydı oluşturur (kitap bilgisini anlık görüntü olarak içerir). */
  const addSession = useCallback(
    (book, { pagesRead = 0, seconds = 0, minutes, start, end, exclude = false, source = 'manual' }) => {
      const endD = end ? new Date(end) : new Date()
      const secs = seconds || (minutes || 0) * 60
      const startD = start ? new Date(start) : new Date(endD.getTime() - secs * 1000)
      const mins = minutes ?? (secs > 0 ? Math.max(1, Math.round(secs / 60)) : 0)
      return repo.addSession(uid, {
        bookId: book.id,
        bookTitle: book.title,
        bookAuthor: book.author || '',
        bookCover: remoteUrl(book.coverUrl),
        dateStr: toDateStr(startD),
        startTime: startD.toISOString(),
        endTime: endD.toISOString(),
        pagesRead: Math.max(0, Math.round(pagesRead)),
        durationMinutes: mins,
        durationSeconds: Math.round(secs),
        excludeFromStats: Boolean(exclude),
        source,
      })
    },
    [uid],
  )

  const actions = useMemo(
    () => ({
      /** Arama sonucundan kitaplığa ekleme */
      async addBookFromSearch(result, { status, totalPages, currentPage = 0, rating = null }) {
        const exists = books.find(
          (b) =>
            (result.googleBooksId && b.googleBooksId === result.googleBooksId) ||
            (b.title?.toLocaleLowerCase('tr') === result.title?.toLocaleLowerCase('tr') &&
              (b.author || '') === (result.author || '')),
        )
        if (exists) return { duplicate: true, id: exists.id }
        const total = Math.max(1, Number(totalPages) || result.totalPages || 1)
        const completed = status === 'completed'
        const id = await repo.addBook(uid, {
          googleBooksId: result.googleBooksId || '',
          title: result.title,
          author: result.author || '',
          coverUrl: result.coverUrl || '',
          coverThumb: result.coverThumb || '',
          totalPages: total,
          currentPage: completed ? total : clamp(Number(currentPage) || 0, 0, total),
          status,
          rating: completed ? rating : null,
          reviewText: '',
          isbn: result.isbn || '',
          publisher: result.publisher || '',
          year: result.year || '',
          completedAt: completed ? nowIso() : null,
          startedAt: status === 'reading' ? nowIso() : null,
        })
        // Kapağı yoksa aynı eserin kapaklı bir baskısını arayıp kalıcı olarak kaydet
        if (!result.coverUrl) {
          resolveCover(result.title, result.author).then((hit) => {
            if (hit) repo.updateBook(uid, id, { coverUrl: hit.coverUrl, coverThumb: hit.coverThumb || '' }).catch(() => {})
          })
        }
        return { id }
      },

      /** Kapağı değiştir (başka baskı veya yüklenen fotoğraf). Boş değer kapağı kaldırır. */
      setCover: (id, { coverUrl = '', coverThumb = '' }) => repo.updateBook(uid, id, { coverUrl, coverThumb }),

      updateBook: (id, data) => repo.updateBook(uid, id, data),

      async deleteBook(id) {
        await repo.deleteBook(uid, id)
        if (profile?.favorites?.some((f) => f.bookId === id)) {
          await repo.updateUser(uid, { favorites: profile.favorites.filter((f) => f.bookId !== id) })
        }
      },

      /**
       * Manuel ilerleme. exclude=true → sayfa güncellenir ama seans istatistiklere sayılmaz.
       */
      async logProgress(book, { page, minutes = 0, exclude = false }) {
        const total = book.totalPages || page
        const next = clamp(Math.round(page), 0, total)
        const diff = Math.max(0, next - (book.currentPage || 0))
        await repo.updateBook(uid, book.id, {
          currentPage: next,
          status: book.status === 'want_to_read' ? 'reading' : book.status,
          startedAt: book.startedAt || nowIso(),
        })
        if (diff > 0 || minutes > 0) {
          await addSession(book, { pagesRead: diff, minutes, seconds: minutes * 60, exclude })
        }
        return { pagesRead: diff, reachedEnd: next >= total }
      },

      /** "Kitabı bitirdim" — kalan sayfalar seans olarak eklenir, durum completed olur. */
      async finishBook(book, { minutes = 0, exclude = false } = {}) {
        const total = book.totalPages || book.currentPage || 0
        const diff = Math.max(0, total - (book.currentPage || 0))
        if (diff > 0 || minutes > 0) await addSession(book, { pagesRead: diff, minutes, seconds: minutes * 60, exclude })
        await repo.updateBook(uid, book.id, {
          currentPage: total,
          status: 'completed',
          completedAt: nowIso(),
          startedAt: book.startedAt || nowIso(),
        })
      },

      /** Canlı sayaç seansını kaydet. page=null → yalnızca süre kaydedilir. */
      async saveTimerSession(book, { startedAt, endedAt, seconds, page = null }) {
        const live = books.find((b) => b.id === book.id) || book
        let pagesRead = 0
        let completed = false
        if (page !== null && page !== undefined && page !== '') {
          const total = live.totalPages || Number(page)
          const next = clamp(Math.round(Number(page)), 0, total)
          pagesRead = Math.max(0, next - (live.currentPage || 0))
          completed = next >= total && live.status !== 'completed'
          await repo.updateBook(uid, live.id, {
            currentPage: next,
            status: completed ? 'completed' : live.status === 'want_to_read' ? 'reading' : live.status,
            completedAt: completed ? nowIso() : live.completedAt || null,
          })
        }
        const minutes = seconds > 0 ? Math.max(1, Math.round(seconds / 60)) : 0
        const sessionId = await addSession(live, {
          pagesRead,
          seconds,
          minutes,
          start: startedAt,
          end: endedAt,
          source: 'timer',
        })
        return { sessionId, pagesRead, minutes, completed, book: live }
      },

      rateBook: (id, rating, reviewText = '') =>
        repo.updateBook(uid, id, { rating: rating || null, reviewText, reviewedAt: nowIso() }),

      updateSession: (id, data) => repo.updateSession(uid, id, data),
      deleteSession: (id) => repo.deleteSession(uid, id),

      async setFavorites(list) {
        await repo.updateUser(uid, { favorites: list.slice(0, 4).map((b) => (b.bookId ? b : favSnapshot(b))) })
      },

      updateProfile: (data) => repo.updateUser(uid, data),
      follow: (target) => repo.follow(uid, target),
      unfollow: (target) => repo.unfollow(uid, target),
      clearMyData: () => repo.clearUserData(uid),
    }),
    [uid, books, profile, addSession],
  )

  const value = useMemo(
    () => ({ books, sessions, loading, bookById, ...actions }),
    [books, sessions, loading, bookById, actions],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export const useData = () => useContext(DataContext)
