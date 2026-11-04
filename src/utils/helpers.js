/** Güvenli kimlik üretici (crypto.randomUUID güvenli olmayan bağlamlarda — ör. LAN http — yoktur). */
export function uid(prefix = '') {
  const rnd =
    typeof crypto !== 'undefined' && crypto.getRandomValues
      ? Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16).padStart(2, '0')).join('')
      : Math.random().toString(16).slice(2, 18)
  return `${prefix}${Date.now().toString(36)}${rnd}`
}

const TR_MAP = { ç: 'c', ğ: 'g', ı: 'i', i̇: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' }

/** "Yiğit Şen" → "yigitsen" — küçük harf, boşluksuz, [a-z0-9_.] */
export function normalizeNickname(raw = '') {
  return raw
    .replace(/^@+/, '')
    .toLocaleLowerCase('tr')
    .replace(/[çğıöşüâîû]|i̇/g, (c) => TR_MAP[c] || '')
    .replace(/[^a-z0-9_.]/g, '')
    .slice(0, 20)
}

export function validateNickname(nick) {
  if (!nick) return 'Kullanıcı adı gerekli'
  if (nick.length < 3) return 'En az 3 karakter olmalı'
  if (!/^[a-z0-9_.]+$/.test(nick)) return 'Sadece küçük harf, rakam, nokta ve alt çizgi'
  if (/^[._]|[._]$/.test(nick)) return 'Nokta veya alt çizgiyle başlayıp bitemez'
  return ''
}

/** Profil vitrini için favori kitabın anlık görüntüsü */
export const favSnapshot = (b) => ({
  bookId: b.id,
  title: b.title,
  author: b.author,
  coverUrl: remoteUrl(b.coverUrl),
  coverThumb: remoteUrl(b.coverThumb),
})

/** Yüklenmiş (data:) kapakları seans/favori kopyalarına taşımamak için — belge boyutunu küçük tutar. */
export function remoteUrl(url) {
  return url && !url.startsWith('data:') ? url : ''
}

/** Kapak fotoğrafını 2:3 oranında kırpıp sıkıştırır (≈40–80 KB). */
export function compressCover(file, width = 420, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Dosya okunamadı'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Görsel açılamadı'))
      img.onload = () => {
        const target = 2 / 3
        let sw = img.width
        let sh = img.height
        if (sw / sh > target) sw = sh * target
        else sh = sw / target
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = Math.round(width / target)
        canvas
          .getContext('2d')
          .drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

/** Basit, kriptografik olmayan hash — yalnızca yerel mod hesapları için. */
export function weakHash(str) {
  let h1 = 0xdeadbeef ^ str.length
  let h2 = 0x41c6ce57 ^ str.length
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)
}

/** undefined alanları temizler (Firestore uyumu). */
export function clean(obj) {
  const out = {}
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v
  return out
}

/** Görseli kare kırpıp sıkıştırarak dataURL'e çevirir (profil fotoğrafı). */
export function compressImage(file, size = 320, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Dosya okunamadı'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Görsel açılamadı'))
      img.onload = () => {
        const s = Math.min(img.width, img.height)
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

export function haptic(ms = 8) {
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* iOS desteklemez */
  }
}

export async function shareOrCopy({ title, text, url }) {
  try {
    if (navigator.share) {
      await navigator.share({ title, text, url })
      return 'shared'
    }
  } catch (e) {
    if (e?.name === 'AbortError') return 'cancelled'
  }
  try {
    await navigator.clipboard.writeText([text, url].filter(Boolean).join('\n'))
    return 'copied'
  } catch {
    return 'failed'
  }
}
