# Satır — Kitap Takibi & Sosyal Kütüphane (PWA)

iOS hissiyatlı, karanlık mod odaklı kitap takip uygulaması. React + Vite + Tailwind + Framer Motion + Firebase.

## Hızlı başlangıç

```bash
npm install        # node_modules/ klasörünü package-lock.json'a göre birebir kurar
npm run dev        # http://localhost:5173  (aynı ağdaki telefondan: http://<bilgisayar-ip>:5173)
npm run build      # dist/ klasörü — herhangi bir statik sunucuya yüklenebilir
```

## GitHub'a yükleme

Depoda yalnızca kaynak dosyalar (~70 dosya) bulunur. `node_modules/` ve `dist/` yeniden üretilebildiği için
`.gitignore` ile dışarıda tutulur. **`.env.local` gizli anahtarlar içerir, asla yüklenmez.**

- **Git / GitHub Desktop ile (önerilen):** `.gitignore` otomatik uygulanır, klasörün tamamını seçebilirsin.
- **github.com'da "Upload files" ile:** Bu yöntem `.gitignore`'u dikkate almaz. `.env.local` ve `.claude/`
  dışındaki her şeyi sürükle. Projeyi başka bir bilgisayarda kurmak için `.env.example` dosyasını `.env.local`
  olarak kopyalayıp anahtarları doldur.

Ayarlar `.env.local` dosyasında (`.env.example` şablondur). Firebase alanları boşsa uygulama **yerel mod**da
çalışır: hesaplar ve veriler yalnızca o cihazın tarayıcısında tutulur.

## Firebase'e bağlama

1. [Firebase Console](https://console.firebase.google.com) → proje oluştur → Web uygulaması ekle.
2. **Authentication → Sign-in method → E-posta/Şifre**'yi aç.
3. **Firestore Database** oluştur, **Rules** sekmesine `firestore.rules` içeriğinin tamamını yapıştırıp **Publish**'e bas.
4. `.env.local` içindeki `VITE_FIREBASE_*` değerlerini doldur ve `npm run dev`'i yeniden başlat.

## Google Books API

Kitap arama ve kapaklar yalnızca Google Books API ile çalışır; anahtar `VITE_GOOGLE_BOOKS_API_KEY` olarak
`.env.local` içindedir. Anahtar istemci paketine gömüldüğü için Google Cloud Console → **Credentials** bölümünden
anahtarı **HTTP referrer** (kendi alan adın) ve **Books API** ile sınırla.

## iPhone'a kurulum

Uygulamayı HTTPS üzerinden yayınla (Firebase Hosting, Netlify, Vercel…) → Safari'de aç → **Paylaş → Ana Ekrana Ekle**.

## Mimari

```
src/
  config/firebaseConfig.js     Firebase + Google Books anahtarları (env)
  lib/firebase.js              Firebase init, kalıcı çevrimdışı Firestore önbelleği
  data/
    repo.js                    Tek giriş noktası: Firestore veya yerel depo
    firestoreRepo.js           users / books / sessions / nicknames
    localRepo.js               Aynı arayüz, LocalStorage + sekmeler arası senkron
  services/booksApi.js         Google Books arama, hi-res kapak, önbellekli eksik kapak çözümleyici
  utils/statsCalculator.js     Seri, haftalık Pzt–Paz, gün/ay toplamları, yıllık hedef
  context/                     Auth, Data (aksiyonlar), Timer (canlı sayaç), UI (toast/onay/puanlama)
  components/                  Sheet'ler, kapak, sayaç + mini-player, takvim, profil…
  pages/                       Ana Sayfa, Kitaplığım, İstatistik, Profil, Arkadaş profili/takvimi, Ayarlar, Giriş
```

### Önemli davranışlar
- **İstatistiklere ekleme**: işaretlenirse `currentPage` güncellenir, seans `excludeFromStats: true` olarak yazılır;
  seri, takvim ve günlük sayfaya sayılmaz.
- **Canlı sayaç** süreyi `Date.now() - başlangıç` farkından hesaplar ve durumu LocalStorage'da tutar.
- **Seri**: bugün okuma yoksa dünden geriye sayılır.
- **Arkadaş takvimi**: arkadaş profilindeki takvim ikonu → salt-okunur takvim.
- **Firestore kuralları**: herkes yalnızca kendi verisini yazar; başkası sadece kendi uid'sini `followers` dizisine ekleyip çıkarabilir.
