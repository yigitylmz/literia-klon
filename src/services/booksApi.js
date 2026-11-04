/**
 * Kitap arama: Google Books API.
 * Kapaklar https'e çevrilir, `edge=curl` temizlenir ve yüksek çözünürlük (fife) istenir.
 */
import { googleBooksApiKey } from '../config/firebaseConfig'

const GB = 'https://www.googleapis.com/books/v1/volumes'

export function upgradeGoogleCover(url) {
  if (!url) return ''
  let u = url.replace(/^http:\/\//i, 'https://').replace(/&edge=curl/gi, '')
  if (!/fife=/.test(u)) u += `${u.includes('?') ? '&' : '?'}fife=w800-h1200`
  return u
}

function cleanThumb(url) {
  return url ? url.replace(/^http:\/\//i, 'https://').replace(/&edge=curl/gi, '') : ''
}

function normalizeGoogle(item) {
  const v = item.volumeInfo || {}
  const links = v.imageLinks || {}
  const raw = links.extraLarge || links.large || links.medium || links.small || links.thumbnail || links.smallThumbnail || ''
  const ids = v.industryIdentifiers || []
  const isbn =
    ids.find((i) => i.type === 'ISBN_13')?.identifier || ids.find((i) => i.type === 'ISBN_10')?.identifier || ''
  return {
    source: 'google',
    googleBooksId: item.id,
    title: v.title || '',
    subtitle: v.subtitle || '',
    author: (v.authors || []).join(', '),
    coverUrl: raw ? upgradeGoogleCover(raw) : '',
    coverThumb: cleanThumb(links.thumbnail || links.smallThumbnail || ''),
    totalPages: v.pageCount || 0,
    publisher: v.publisher || '',
    year: (v.publishedDate || '').slice(0, 4),
    isbn,
    description: v.description || '',
    language: v.language || '',
  }
}

function buildQuery(q) {
  const digits = q.replace(/[-\s]/g, '')
  if (/^\d{10}(\d{3})?$/.test(digits)) return `isbn:${digits}`
  return q
}

async function request(q, { signal, max = 20 } = {}) {
  const params = new URLSearchParams({ q, maxResults: String(max), printType: 'books' })
  if (googleBooksApiKey) params.set('key', googleBooksApiKey)
  // Google zaman zaman geçici 5xx döndürür → kısa beklemeyle 2 kez yeniden dene
  let res
  for (let attempt = 0; attempt < 3; attempt++) {
    res = await fetch(`${GB}?${params}`, { signal })
    if (res.status < 500) break
    await new Promise((r) => setTimeout(r, 350 * (attempt + 1) ** 2))
  }
  if (!res.ok) {
    const e = new Error(res.status === 429 ? 'Google Books kotası doldu, biraz sonra tekrar dene' : `Google Books hatası (${res.status})`)
    e.status = res.status
    throw e
  }
  const json = await res.json()
  return (json.items || []).map(normalizeGoogle).filter((b) => b.title)
}

const keyOf = (b) => b.googleBooksId

/** "İyi Hissetmek" / "Iyi hissetmek" → "iyihissetmek" (baskıları eşleştirmek için) */
export function normTitle(s = '') {
  return s
    .toLocaleLowerCase('tr')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ı/g, 'i')
    .split(/[:(\-–]/)[0]
    .replace(/[^a-z0-9]/g, '')
}

function authorKey(author = '') {
  const last = author.split(',')[0].trim().split(/\s+/).slice(-1)[0] || ''
  return normTitle(last)
}

/**
 * Aynı listede kapağı olmayan baskılara, aynı başlık + yazara sahip kapaklı baskının kapağını ödünç verir.
 * (Google'da bazı katalog kayıtlarının hiç görseli yoktur.)
 */
function borrowCovers(list) {
  const byWork = new Map()
  for (const b of list) {
    const k = `${normTitle(b.title)}|${authorKey(b.author)}`
    if (b.coverUrl && !byWork.has(k)) byWork.set(k, b)
  }
  return list.map((b) => {
    if (b.coverUrl) return b
    const donor = byWork.get(`${normTitle(b.title)}|${authorKey(b.author)}`)
    return donor ? { ...b, coverUrl: donor.coverUrl, coverThumb: donor.coverThumb, coverBorrowed: true } : b
  })
}

/* ---------- Bulanık eşleştirme (yazım hatalarına dayanıklı sıralama) ---------- */
function fold(s = '') {
  return s
    .toLocaleLowerCase('tr')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ı/g, 'i')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function levenshtein(a, b) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    prev = cur
  }
  return prev[b.length]
}

const ratio = (a, b) => (a && b ? 1 - levenshtein(a, b) / Math.max(a.length, b.length) : 0)

/** Bir sorgu kelimesinin metindeki en yakın kelimeye benzerliği (0–1) */
function tokenScore(token, words) {
  let best = 0
  for (const w of words) {
    if (w === token) return 1
    if (w.startsWith(token) && token.length >= 3) best = Math.max(best, 0.92)
    else best = Math.max(best, ratio(token, w.slice(0, Math.max(token.length, 1) + 1)), ratio(token, w))
  }
  return best
}

/** Sorgunun bir esere ne kadar uyduğu: başlık ağırlıklı, yazar da sayılır. */
function matchScore(query, book) {
  const qf = fold(query)
  const tf = fold(book.title)
  const af = fold(book.author)
  if (!qf) return 0
  const qTokens = qf.split(' ').filter(Boolean)
  const titleWords = tf.split(' ')
  const allWords = [...titleWords, ...af.split(' ')]
  const tokenAvg = qTokens.reduce((s, t) => s + tokenScore(t, allWords), 0) / qTokens.length
  const whole = Math.max(ratio(qf, tf), tf.startsWith(qf) ? 0.95 : 0, tf.includes(qf) ? 0.85 : 0)
  return Math.max(whole, tokenAvg * 0.9)
}

/**
 * Baskıları tek esere toplar; her eser için kapaklı (ve sayfa bilgisi olan) baskıyı temsilci seçer.
 * Kapaksız temsilci kalırsa, aynı eserin kapaklı baskısının kapağını ödünç alır.
 */
function groupWorks(list) {
  // Başlığa göre kova; aynı kovada yazar adı yaklaşık eşleşiyorsa (Dostoyevski ≈ Dostoevskij) aynı eser
  const byTitle = new Map()
  const works = []
  list.forEach((b, idx) => {
    const tk = normTitle(b.title)
    const ak = authorKey(b.author)
    const bucket = byTitle.get(tk) || []
    let w = bucket.find((x) => !x.ak || !ak || x.ak === ak || ratio(x.ak, ak) >= 0.6)
    if (!w) {
      w = { ak, rep: b, editions: [b], firstIdx: idx }
      bucket.push(w)
      byTitle.set(tk, bucket)
      works.push(w)
    } else {
      if (!w.ak) w.ak = ak
      w.editions.push(b)
      const better =
        (!w.rep.coverUrl && b.coverUrl) || (Boolean(w.rep.coverUrl) === Boolean(b.coverUrl) && !w.rep.totalPages && b.totalPages)
      if (better) w.rep = b
    }
  })
  return works.map((w) => {
    let rep = w.rep
    if (!rep.coverUrl) {
      const donor = w.editions.find((e) => e.coverUrl)
      if (donor) rep = { ...rep, coverUrl: donor.coverUrl, coverThumb: donor.coverThumb, coverBorrowed: true }
    }
    if (!rep.totalPages) {
      const withPages = w.editions.find((e) => e.totalPages)
      if (withPages) rep = { ...rep, totalPages: withPages.totalPages }
    }
    return { ...rep, editionCount: w.editions.length, _idx: w.firstIdx }
  })
}

/**
 * Kitap adı, yazar veya ISBN ile arama.
 * Serbest sorgu + başlık sorgusu paralel çalışır; sonuçlar esere göre gruplanır ve
 * bulanık benzerlik, kapak ve Google sıralamasına göre yeniden sıralanır.
 */
export async function searchBooks(q, { signal } = {}) {
  const query = q.trim()
  if (!query) return []
  const built = buildQuery(query)
  const isIsbn = built.startsWith('isbn:')
  const queries = isIsbn ? [built] : [built, `intitle:${query}`]

  const settled = await Promise.allSettled(queries.map((x) => request(x, { signal, max: 40 })))
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
  const ok = settled.filter((s) => s.status === 'fulfilled').map((s) => s.value)
  if (!ok.length) throw settled[0].reason

  const seen = new Set()
  const merged = []
  // Serbest sorgu ve başlık sorgusunu sırayla iç içe geçir (Google'ın alaka sırasını korur)
  for (let i = 0; i < Math.max(...ok.map((l) => l.length)); i++) {
    for (const list of ok) {
      const b = list[i]
      if (b && !seen.has(keyOf(b))) {
        seen.add(keyOf(b))
        merged.push(b)
      }
    }
  }
  if (isIsbn) return borrowCovers(merged)

  return groupWorks(merged)
    .map((w) => ({
      ...w,
      _score:
        matchScore(query, w) * 3 + // metin benzerliği
        (w.coverUrl ? 0.6 : 0) + // kapaklı olanlar öne
        (w.language === 'tr' ? 0.15 : 0) +
        Math.min(w.editionCount, 4) * 0.05 + // çok baskılı = bilinen eser
        (1 - Math.min(w._idx, 60) / 60) * 0.8, // Google'ın kendi alaka sırası
    }))
    .sort((a, b) => b._score - a._score)
    .slice(0, 36)
    .map(({ _score, _idx, ...b }) => b)
}

/** Kapak seçici için: aynı kitabın kapaklı tüm baskıları */
export async function findCoverCandidates(title, author, { signal } = {}) {
  const last = (author || '').split(',')[0].trim().split(/\s+/).slice(-1)[0]
  const queries = [`intitle:${title}${last ? ` inauthor:${last}` : ''}`, `${title} ${author || ''}`.trim()]
  const seen = new Set()
  const out = []
  const nt = normTitle(title)
  const ak = authorKey(author)
  const sameWork = (r) => {
    const rt = normTitle(r.title)
    const titleOk = rt === nt || (nt.length >= 4 && (rt.startsWith(nt) || nt.startsWith(rt)) && rt.length >= 4)
    const authorOk = !ak || !r.author || authorKey(r.author) === ak
    return titleOk && authorOk
  }
  const batches = await Promise.all(
    queries.map((q) =>
      request(q, { signal, max: 30 }).catch((e) => {
        if (e.name === 'AbortError') throw e
        return []
      }),
    ),
  )
  for (const batch of batches) {
    try {
      for (const r of batch) {
        if (!r.coverUrl || !sameWork(r) || seen.has(r.coverThumb || r.coverUrl)) continue
        seen.add(r.coverThumb || r.coverUrl)
        out.push({
          coverUrl: r.coverUrl,
          coverThumb: r.coverThumb,
          label: [r.year, r.publisher].filter(Boolean).join(' · '),
          title: r.title,
        })
      }
    } catch (e) {
      if (e.name === 'AbortError') throw e
    }
    if (out.length >= 12) break
  }
  // Birebir aynı başlıkları öne al
  return out.sort((a, b) => (normTitle(b.title) === nt) - (normTitle(a.title) === nt)).slice(0, 18)
}

/** Başlık + yazara göre en iyi kapağı bul. */
export async function findCover(title, author) {
  const lastName = (author || '').split(',')[0].trim().split(' ').slice(-1)[0]
  const attempts = [`intitle:${title}${lastName ? ` inauthor:${lastName}` : ''}`, `${title} ${author || ''}`.trim()]
  for (const q of attempts) {
    try {
      const results = await request(q, { max: 15 })
      const nt = normTitle(title)
      const hit = results.find((r) => r.coverUrl && normTitle(r.title) === nt)
      if (hit) return { coverUrl: hit.coverUrl, coverThumb: hit.coverThumb, googleBooksId: hit.googleBooksId }
    } catch (e) {
      if (e.status === 429) return null
    }
  }
  return null
}

/* ---------- Eksik kapaklar için önbellekli, sıralı çözümleyici ---------- */
const CACHE_KEY = 'satir:covercache:v1'
const RETRY_MS = 24 * 60 * 60 * 1000
let cache = null
const inflight = new Map()
let chain = Promise.resolve()

function readCache() {
  if (cache) return cache
  try {
    cache = JSON.parse(localStorage.getItem(CACHE_KEY)) || {}
  } catch {
    cache = {}
  }
  return cache
}

function writeCache() {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    /* yoksay */
  }
}

/** Kapağı olmayan bir kitap için kapak bulur. Sonuç (bulunamadı dahil) önbelleğe alınır. */
export function resolveCover(title, author) {
  if (!title) return Promise.resolve(null)
  const key = `${title}|${author || ''}`.toLocaleLowerCase('tr')
  const c = readCache()[key]
  if (c && (c.url || Date.now() - c.at < RETRY_MS)) return Promise.resolve(c.url ? c : null)
  if (inflight.has(key)) return inflight.get(key)
  const p = (chain = chain.then(async () => {
    const hit = await findCover(title, author)
    readCache()[key] = hit
      ? { url: hit.coverUrl, coverUrl: hit.coverUrl, coverThumb: hit.coverThumb, at: Date.now() }
      : { url: '', at: Date.now() }
    writeCache()
    inflight.delete(key)
    return hit
  }))
  inflight.set(key, p)
  return p
}
