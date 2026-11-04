import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { repo, isLocalMode } from '../data/repo'

const AuthContext = createContext(null)

const MESSAGES = {
  'auth/invalid-credential': 'E-posta veya şifre hatalı',
  'auth/wrong-password': 'E-posta veya şifre hatalı',
  'auth/user-not-found': 'Bu e-postayla kayıtlı hesap yok',
  'auth/email-already-in-use': 'Bu e-posta zaten kayıtlı',
  'auth/invalid-email': 'Geçerli bir e-posta gir',
  'auth/weak-password': 'Şifre en az 6 karakter olmalı',
  'auth/too-many-requests': 'Çok fazla deneme yapıldı, biraz sonra tekrar dene',
  'auth/network-request-failed': 'İnternet bağlantını kontrol et',
  'nickname-taken': 'Bu kullanıcı adı alınmış',
}

export function authErrorMessage(e) {
  return MESSAGES[e?.code] || e?.message || 'Bir şeyler ters gitti'
}

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(undefined) // undefined = yükleniyor
  const [profile, setProfile] = useState(undefined)
  const [busy, setBusy] = useState(false)

  useEffect(() => repo.onAuth((u) => setAuthUser(u || null)), [])

  useEffect(() => {
    if (!authUser) {
      setProfile(authUser === null ? null : undefined)
      return
    }
    setProfile(undefined)
    return repo.watchUser(authUser.uid, setProfile)
  }, [authUser?.uid]) // eslint-disable-line react-hooks/exhaustive-deps

  const run = useCallback(async (fn) => {
    setBusy(true)
    try {
      return await fn()
    } finally {
      setBusy(false)
    }
  }, [])

  const value = useMemo(
    () => ({
      isLocalMode,
      authUser,
      profile,
      uid: authUser?.uid || null,
      busy,
      loading: authUser === undefined || (authUser && profile === undefined),
      signIn: (email, password) => run(() => repo.signIn(email, password)),
      signUp: (data) => run(() => repo.signUp(data)),
      signOut: () => repo.signOut(),
      resetPassword: (email) => repo.resetPassword(email),
      createProfile: (data) => run(() => repo.createProfile(authUser.uid, data)),
    }),
    [authUser, profile, busy, run],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
