/**
 * Firestore deposu. Şema:
 *  users/{uid}                — profil (nickname benzersiz; nicknames/{nick} → { uid } ile garanti edilir)
 *  users/{uid}/books/{bookId} — kitaplar
 *  users/{uid}/sessions/{id}  — okuma seansları
 */
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile as fbUpdateProfile,
  deleteUser,
  sendPasswordResetEmail,
} from 'firebase/auth'
import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  startAt,
  endAt,
  limit,
  runTransaction,
  writeBatch,
  arrayUnion,
  arrayRemove,
  documentId,
} from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { normalizeNickname, clean, uid as makeId } from '../utils/helpers'

const err = (code, message) => Object.assign(new Error(message), { code })
const now = () => new Date().toISOString()

const userRef = (id) => doc(db, 'users', id)
const booksCol = (id) => collection(db, 'users', id, 'books')
const sessionsCol = (id) => collection(db, 'users', id, 'sessions')
const nickRef = (nick) => doc(db, 'nicknames', nick)

const withId = (snap) => ({ id: snap.id, ...snap.data() })

export const firestoreRepo = {
  mode: 'firebase',

  /* ---------- AUTH ---------- */
  onAuth(cb) {
    return onAuthStateChanged(auth, (u) => cb(u ? { uid: u.uid, email: u.email } : null))
  },

  async signIn(email, password) {
    await signInWithEmailAndPassword(auth, email.trim(), password)
  },

  async signUp({ email, password, nickname, displayName, photoURL, yearlyGoal, dailyPageGoal }) {
    const nick = normalizeNickname(nickname)
    if (!(await this.isNicknameAvailable(nick))) throw err('nickname-taken', 'Bu kullanıcı adı alınmış')

    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
    const id = cred.user.uid
    try {
      await runTransaction(db, async (tx) => {
        const n = await tx.get(nickRef(nick))
        if (n.exists()) throw err('nickname-taken', 'Bu kullanıcı adı alınmış')
        tx.set(nickRef(nick), { uid: id })
        tx.set(userRef(id), {
          uid: id,
          nickname: nick,
          displayName: displayName || nick,
          photoURL: photoURL || '',
          yearlyGoal: Number(yearlyGoal) || 12,
          dailyPageGoal: Number(dailyPageGoal) || 30,
          favorites: [],
          followers: [],
          following: [],
          createdAt: now(),
        })
      })
      await fbUpdateProfile(cred.user, { displayName: displayName || nick }).catch(() => {})
    } catch (e) {
      await deleteUser(cred.user).catch(() => {})
      throw e
    }
    return id
  },

  /** Oturum açık ama profil belgesi yoksa (yarım kalan kayıt) tamamlamak için. */
  async createProfile(id, data) {
    const nick = normalizeNickname(data.nickname)
    await runTransaction(db, async (tx) => {
      const n = await tx.get(nickRef(nick))
      if (n.exists() && n.data().uid !== id) throw err('nickname-taken', 'Bu kullanıcı adı alınmış')
      tx.set(nickRef(nick), { uid: id })
      tx.set(userRef(id), {
        uid: id,
        nickname: nick,
        displayName: data.displayName || nick,
        photoURL: data.photoURL || '',
        yearlyGoal: Number(data.yearlyGoal) || 12,
        dailyPageGoal: Number(data.dailyPageGoal) || 30,
        favorites: [],
        followers: [],
        following: [],
        createdAt: now(),
      })
    })
  },

  async signOut() {
    await fbSignOut(auth)
  },

  async resetPassword(email) {
    await sendPasswordResetEmail(auth, email.trim())
  },

  /* ---------- USERS ---------- */
  async isNicknameAvailable(nick, exceptUid) {
    if (!nick) return false
    const snap = await getDoc(nickRef(nick))
    return !snap.exists() || snap.data().uid === exceptUid
  },

  watchUser(id, cb) {
    return onSnapshot(
      userRef(id),
      (snap) => cb(snap.exists() ? { uid: snap.id, ...snap.data() } : null),
      () => cb(null),
    )
  },

  async getUserByNickname(nick) {
    const n = normalizeNickname(nick)
    if (!n) return null
    const m = await getDoc(nickRef(n))
    if (!m.exists()) return null
    const u = await getDoc(userRef(m.data().uid))
    return u.exists() ? { uid: u.id, ...u.data() } : null
  },

  async getUsers(ids = []) {
    const out = []
    for (let i = 0; i < ids.length; i += 30) {
      const chunk = ids.slice(i, i + 30)
      if (!chunk.length) continue
      const snap = await getDocs(query(collection(db, 'users'), where(documentId(), 'in', chunk)))
      snap.forEach((d) => out.push({ uid: d.id, ...d.data() }))
    }
    return out
  },

  async searchUsers(q, excludeUid) {
    const n = normalizeNickname(q)
    if (!n) return []
    const snap = await getDocs(
      query(collection(db, 'users'), orderBy('nickname'), startAt(n), endAt(`${n}`), limit(20)),
    )
    return snap.docs.map((d) => ({ uid: d.id, ...d.data() })).filter((u) => u.uid !== excludeUid)
  },

  async updateUser(id, data) {
    const payload = clean(data)
    if (payload.nickname) {
      const nick = normalizeNickname(payload.nickname)
      payload.nickname = nick
      await runTransaction(db, async (tx) => {
        const meSnap = await tx.get(userRef(id))
        const oldNick = meSnap.data()?.nickname
        if (oldNick !== nick) {
          const n = await tx.get(nickRef(nick))
          if (n.exists() && n.data().uid !== id) throw err('nickname-taken', 'Bu kullanıcı adı alınmış')
          tx.set(nickRef(nick), { uid: id })
          if (oldNick) tx.delete(nickRef(oldNick))
        }
        tx.update(userRef(id), payload)
      })
      return
    }
    await updateDoc(userRef(id), payload)
  },

  async follow(me, target) {
    if (me === target) return
    const b = writeBatch(db)
    b.update(userRef(me), { following: arrayUnion(target) })
    b.update(userRef(target), { followers: arrayUnion(me) })
    await b.commit()
  },

  async unfollow(me, target) {
    const b = writeBatch(db)
    b.update(userRef(me), { following: arrayRemove(target) })
    b.update(userRef(target), { followers: arrayRemove(me) })
    await b.commit()
  },

  /* ---------- BOOKS ---------- */
  watchBooks(id, cb) {
    return onSnapshot(
      booksCol(id),
      (snap) => cb(snap.docs.map(withId)),
      () => cb([]),
    )
  },

  async addBook(id, data) {
    const bookId = data.id || makeId('b_')
    await setDoc(doc(booksCol(id), bookId), clean({ ...data, id: bookId, createdAt: now(), updatedAt: now() }))
    return bookId
  },

  async updateBook(id, bookId, data) {
    await updateDoc(doc(booksCol(id), bookId), clean({ ...data, updatedAt: now() }))
  },

  async deleteBook(id, bookId) {
    await deleteDoc(doc(booksCol(id), bookId))
  },

  /* ---------- SESSIONS ---------- */
  watchSessions(id, cb) {
    return onSnapshot(
      sessionsCol(id),
      (snap) => cb(snap.docs.map(withId)),
      () => cb([]),
    )
  },

  async addSession(id, data) {
    const sid = data.id || makeId('s_')
    await setDoc(doc(sessionsCol(id), sid), clean({ ...data, id: sid, createdAt: data.createdAt || now() }))
    return sid
  },

  async updateSession(id, sid, data) {
    await updateDoc(doc(sessionsCol(id), sid), clean(data))
  },

  async deleteSession(id, sid) {
    await deleteDoc(doc(sessionsCol(id), sid))
  },

  async clearUserData(id) {
    const [bs, ss] = await Promise.all([getDocs(booksCol(id)), getDocs(sessionsCol(id))])
    const refs = [...bs.docs, ...ss.docs].map((d) => d.ref)
    for (let i = 0; i < refs.length; i += 400) {
      const batch = writeBatch(db)
      refs.slice(i, i + 400).forEach((r) => batch.delete(r))
      await batch.commit()
    }
    await updateDoc(userRef(id), { favorites: [] })
  },
}
