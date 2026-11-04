/**
 * Firebase yapılandırması.
 *
 * İki yol var:
 *  1) Proje köküne `.env.local` dosyası koyup VITE_FIREBASE_* değişkenlerini doldurun (önerilen).
 *  2) Aşağıdaki boş string'leri doğrudan kendi değerlerinizle değiştirin.
 *
 * apiKey ve projectId boşsa uygulama otomatik olarak "Yerel mod"da çalışır:
 * tüm veriler yalnızca tarayıcının LocalStorage'ında tutulur.
 */
const env = import.meta.env

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.VITE_FIREBASE_APP_ID || '',
}

/** İsteğe bağlı: Google Books API anahtarı (anahtarsız da çalışır, ancak kota düşüktür). */
export const googleBooksApiKey = env.VITE_GOOGLE_BOOKS_API_KEY || ''

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)
