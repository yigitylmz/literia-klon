/**
 * Yerel depo (Firebase yapılandırılmadığında): Firestore repo'su ile birebir aynı arayüz, LocalStorage üzerinde.
 * Abonelikler (watch*) değişiklikte tetiklenir; sekmeler arası `storage` olayı ile senkron kalır.
 */
import { uid as makeId, normalizeNickname, weakHash, clean } from '../utils/helpers'

const DB_KEY = 'satir:db:v1'
const AUTH_KEY = 'satir:auth:v1'

// Eski sürümden (Okur, demo verili) kalan tüm yerel verileri bir kez temizle
try {
  Object.keys(localStorage)
    .filter((k) => k.startsWith('okur:'))
    .forEach((k) => localStorage.removeItem(k))
} catch {
  /* yoksay */
}

const empty = () => ({ users: {}, books: {}, sessions: {}, accounts: {} })

function load() {
  try {
    const raw = localStorage.getItem(DB_KEY)
    return raw ? { ...empty(), ...JSON.parse(raw) } : empty()
  } catch {
    return empty()
  }
}

let state = load()
const listeners = new Set()
const authListeners = new Set()

function emit() {
  for (const fn of listeners) fn()
}

function commit() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(state))
  } catch (e) {
    console.warn('LocalStorage yazılamadı', e)
  }
  emit()
}

function currentAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function setAuth(value) {
  try {
    if (value) localStorage.setItem(AUTH_KEY, JSON.stringify(value))
    else localStorage.removeItem(AUTH_KEY)
  } catch {
    /* yoksay */
  }
  for (const fn of authListeners) fn(value)
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === DB_KEY) {
      state = load()
      emit()
    }
    if (e.key === AUTH_KEY) for (const fn of authListeners) fn(currentAuth())
  })
}

/** selector sonucu değiştiğinde (JSON karşılaştırması) cb çağrılır. */
function watch(selector, cb) {
  let last
  const run = () => {
    const json = JSON.stringify(selector() ?? null)
    if (json !== last) {
      last = json
      cb(JSON.parse(json))
    }
  }
  listeners.add(run)
  queueMicrotask(run)
  return () => listeners.delete(run)
}

const err = (code, message) => Object.assign(new Error(message), { code })
const now = () => new Date().toISOString()

export const localRepo = {
  mode: 'local',

  /* ---------- AUTH ---------- */
  onAuth(cb) {
    authListeners.add(cb)
    queueMicrotask(() => cb(currentAuth()))
    return () => authListeners.delete(cb)
  },

  async signIn(email, password) {
    const acc = state.accounts[email.trim().toLowerCase()]
    if (!acc || acc.hash !== weakHash(password)) throw err('auth/invalid-credential', 'E-posta veya şifre hatalı')
    setAuth({ uid: acc.uid, email: email.trim().toLowerCase() })
  },

  async signUp({ email, password, nickname, displayName, photoURL, yearlyGoal, dailyPageGoal }) {
    const mail = email.trim().toLowerCase()
    if (state.accounts[mail]) throw err('auth/email-already-in-use', 'Bu e-posta zaten kayıtlı')
    if (password.length < 6) throw err('auth/weak-password', 'Şifre en az 6 karakter olmalı')
    const nick = normalizeNickname(nickname)
    if (!(await this.isNicknameAvailable(nick))) throw err('nickname-taken', 'Bu kullanıcı adı alınmış')
    const id = makeId('u_')
    state.accounts[mail] = { uid: id, hash: weakHash(password) }
    state.users[id] = this._profile(id, { nickname: nick, displayName, photoURL, yearlyGoal, dailyPageGoal })
    state.books[id] = {}
    state.sessions[id] = {}
    commit()
    setAuth({ uid: id, email: mail })
    return id
  },

  async createProfile(id, data) {
    const nick = normalizeNickname(data.nickname)
    if (!(await this.isNicknameAvailable(nick, id))) throw err('nickname-taken', 'Bu kullanıcı adı alınmış')
    state.users[id] = this._profile(id, { ...data, nickname: nick })
    commit()
  },

  _profile(id, { nickname, displayName, photoURL = '', yearlyGoal = 12, dailyPageGoal = 30 }) {
    return {
      uid: id,
      nickname,
      displayName: displayName || nickname,
      photoURL: photoURL || '',
      yearlyGoal: Number(yearlyGoal) || 12,
      dailyPageGoal: Number(dailyPageGoal) || 30,
      favorites: [],
      followers: [],
      following: [],
      createdAt: now(),
    }
  },

  async signOut() {
    setAuth(null)
  },

  async resetPassword() {
    throw err('unsupported', 'Yerel modda şifre sıfırlama yok')
  },

  /* ---------- USERS ---------- */
  async isNicknameAvailable(nick, exceptUid) {
    return !Object.values(state.users).some((u) => u.nickname === nick && u.uid !== exceptUid)
  },

  watchUser(id, cb) {
    return watch(() => state.users[id] || null, cb)
  },

  async getUserByNickname(nick) {
    const n = normalizeNickname(nick)
    return Object.values(state.users).find((u) => u.nickname === n) || null
  },

  async getUsers(ids = []) {
    return ids.map((id) => state.users[id]).filter(Boolean)
  },

  async searchUsers(q, excludeUid) {
    const n = normalizeNickname(q)
    const term = q.trim().toLocaleLowerCase('tr')
    return Object.values(state.users)
      .filter((u) => u.uid !== excludeUid)
      .filter((u) => (n && u.nickname.startsWith(n)) || u.displayName?.toLocaleLowerCase('tr').includes(term))
      .slice(0, 20)
  },

  async updateUser(id, data) {
    if (!state.users[id]) throw err('not-found', 'Kullanıcı bulunamadı')
    if (data.nickname) {
      const nick = normalizeNickname(data.nickname)
      if (!(await this.isNicknameAvailable(nick, id))) throw err('nickname-taken', 'Bu kullanıcı adı alınmış')
      data = { ...data, nickname: nick }
    }
    state.users[id] = { ...state.users[id], ...clean(data) }
    commit()
  },

  async follow(me, target) {
    const a = state.users[me]
    const b = state.users[target]
    if (!a || !b || me === target) return
    a.following = [...new Set([...(a.following || []), target])]
    b.followers = [...new Set([...(b.followers || []), me])]
    commit()
  },

  async unfollow(me, target) {
    const a = state.users[me]
    const b = state.users[target]
    if (a) a.following = (a.following || []).filter((x) => x !== target)
    if (b) b.followers = (b.followers || []).filter((x) => x !== me)
    commit()
  },

  /* ---------- BOOKS ---------- */
  watchBooks(id, cb) {
    return watch(() => Object.values(state.books[id] || {}), cb)
  },

  async addBook(id, data) {
    const bookId = data.id || makeId('b_')
    state.books[id] = state.books[id] || {}
    state.books[id][bookId] = clean({ ...data, id: bookId, updatedAt: now(), createdAt: data.createdAt || now() })
    commit()
    return bookId
  },

  async updateBook(id, bookId, data) {
    const b = state.books[id]?.[bookId]
    if (!b) throw err('not-found', 'Kitap bulunamadı')
    state.books[id][bookId] = { ...b, ...clean(data), updatedAt: now() }
    commit()
  },

  async deleteBook(id, bookId) {
    if (state.books[id]) delete state.books[id][bookId]
    commit()
  },

  /* ---------- SESSIONS ---------- */
  watchSessions(id, cb) {
    return watch(() => Object.values(state.sessions[id] || {}), cb)
  },

  async addSession(id, data) {
    const sid = data.id || makeId('s_')
    state.sessions[id] = state.sessions[id] || {}
    state.sessions[id][sid] = clean({ ...data, id: sid, createdAt: data.createdAt || now() })
    commit()
    return sid
  },

  async updateSession(id, sid, data) {
    const s = state.sessions[id]?.[sid]
    if (!s) throw err('not-found', 'Seans bulunamadı')
    state.sessions[id][sid] = { ...s, ...clean(data) }
    commit()
  },

  async deleteSession(id, sid) {
    if (state.sessions[id]) delete state.sessions[id][sid]
    commit()
  },

  async clearUserData(id) {
    state.books[id] = {}
    state.sessions[id] = {}
    if (state.users[id]) state.users[id].favorites = []
    commit()
  },

  async wipeEverything() {
    state = empty()
    commit()
    setAuth(null)
  },
}
