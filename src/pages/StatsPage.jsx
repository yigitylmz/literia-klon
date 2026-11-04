import Page from '../components/Page'
import CalendarView from '../components/calendar/CalendarView'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'

/** İstatistik sekmesi: kendi okuma takvimimiz */
export default function StatsPage() {
  const { sessions, books } = useData()
  const { profile } = useAuth()
  return (
    <Page>
      <CalendarView sessions={sessions} books={books} isOwn ownerName={profile?.displayName} showBack />
    </Page>
  )
}
