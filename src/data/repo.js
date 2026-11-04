/**
 * Uygulamanın tek veri giriş noktası.
 * Firebase yapılandırıldıysa Firestore, değilse LocalStorage tabanlı yerel depo kullanılır.
 * Her iki depo da aynı arayüzü sunar; bileşenler hangisinin aktif olduğunu bilmek zorunda değildir.
 */
import { isFirebaseConfigured } from '../config/firebaseConfig'
import { localRepo } from './localRepo'
import { firestoreRepo } from './firestoreRepo'

export const repo = isFirebaseConfigured ? firestoreRepo : localRepo
export const isLocalMode = !isFirebaseConfigured
