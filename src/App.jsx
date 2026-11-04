import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { AuthProvider, useAuth, authErrorMessage } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { UIProvider, useUI } from './context/UIContext'
import { TimerProvider } from './context/TimerContext'
import TabBar from './components/TabBar'
import FocusTimer from './components/timer/FocusTimer'
import { Spinner } from './components/ui/primitives'
import HomePage from './pages/HomePage'
import LibraryPage from './pages/LibraryPage'
import StatsPage from './pages/StatsPage'
import SettingsPage from './pages/SettingsPage'
import FriendSearchPage from './pages/FriendSearchPage'
import AuthPage, { ProfileStep } from './pages/AuthPage'
import { ProfilePage, UserProfilePage, UserCalendarPage, UserLibraryPage, ReviewsPage } from './pages/UserPages'

function Splash() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-ink">
      <img src="icons/icon-192.png" alt="" className="h-16 w-16 rounded-[18px] opacity-90" />
      <Spinner size={24} />
    </div>
  )
}

function Shell() {
  const location = useLocation()
  return (
    <>
      <main className="absolute inset-0">
        <Routes location={location}>
          <Route path="/" element={<HomePage key="home" />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/friends" element={<FriendSearchPage />} />
          <Route path="/u/:nickname" element={<UserProfilePage />} />
          <Route path="/u/:nickname/calendar" element={<UserCalendarPage />} />
          <Route path="/u/:nickname/library" element={<UserLibraryPage />} />
          <Route path="/u/:nickname/reviews" element={<ReviewsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <TabBar />
      <FocusTimer />
    </>
  )
}

/** Oturum açık ama profil belgesi yok (yarım kalmış Firebase kaydı) */
function CompleteProfile() {
  const { createProfile, busy, signOut } = useAuth()
  const { toast } = useUI()
  return (
    <div className="no-scrollbar absolute inset-0 overflow-y-auto bg-ink">
      <div className="mx-auto max-w-[460px] px-6 py-10 pt-safe">
        <ProfileStep
          busy={busy}
          submitLabel="Devam et"
          onSubmit={(p) => createProfile({ ...p, dailyPageGoal: 30 }).catch((e) => toast(authErrorMessage(e), 'error'))}
        />
        <button onClick={signOut} className="press mx-auto mt-6 block text-[15px] text-mute">
          Çıkış yap
        </button>
      </div>
    </div>
  )
}

function Gate() {
  const { authUser, profile, loading } = useAuth()
  if (loading) return <Splash />
  if (!authUser) {
    return (
      <DataProvider>
        <UIProvider>
          <AuthPage />
        </UIProvider>
      </DataProvider>
    )
  }
  return (
    <DataProvider>
      <UIProvider>
        {profile ? (
          <TimerProvider>
            <HashRouter>
              <Shell />
            </HashRouter>
          </TimerProvider>
        ) : (
          <CompleteProfile />
        )}
      </UIProvider>
    </DataProvider>
  )
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </MotionConfig>
  )
}
