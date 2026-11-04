import { useEffect, useMemo, useState } from 'react'
import { Navigate, useParams, useNavigate } from 'react-router-dom'
import { UserX, Library, Star } from 'lucide-react'
import Page from '../components/Page'
import ProfileView, { ReviewRow, reviewedBooks } from '../components/profile/ProfileView'
import CalendarView from '../components/calendar/CalendarView'
import BookGrid from '../components/library/BookGrid'
import BookDetailSheet from '../components/library/BookDetailSheet'
import { FilterPills, SortSheet, sortBooks } from './LibraryPage'
import { EmptyState, Spinner, TopBar } from '../components/ui/primitives'
import { useAuth } from '../context/AuthContext'
import { useData, useUserBundle } from '../context/DataContext'
import { repo } from '../data/repo'

/** @nickname → uid çözümleme */
function useResolveUser(nickname) {
  const { profile: me } = useAuth()
  const [state, setState] = useState({ uid: null, notFound: false, loading: true })
  useEffect(() => {
    let alive = true
    if (me && nickname === me.nickname) {
      setState({ uid: me.uid, notFound: false, loading: false, isMe: true })
      return
    }
    setState({ uid: null, notFound: false, loading: true })
    repo
      .getUserByNickname(nickname)
      .then((u) => alive && setState({ uid: u?.uid || null, notFound: !u, loading: false }))
      .catch(() => alive && setState({ uid: null, notFound: true, loading: false }))
    return () => {
      alive = false
    }
  }, [nickname, me?.nickname]) // eslint-disable-line react-hooks/exhaustive-deps
  return state
}

function Loading() {
  return (
    <div className="flex justify-center pt-32">
      <Spinner size={28} />
    </div>
  )
}

function NotFound() {
  return (
    <>
      <TopBar back title="" />
      <EmptyState icon={UserX} title="Kullanıcı bulunamadı" text="Bu kullanıcı adıyla kayıtlı bir okur yok." />
    </>
  )
}

/** Belirli bir kullanıcının verisini çözen sarmalayıcı */
function WithUser({ children }) {
  const { nickname } = useParams()
  const { uid: myUid } = useAuth()
  const resolved = useResolveUser(nickname)
  const bundle = useUserBundle(resolved.uid)
  if (resolved.loading) return <Page><Loading /></Page>
  if (resolved.notFound) return <Page><NotFound /></Page>
  if (bundle.loading || !bundle.profile) return <Page>{bundle.profile === null ? <NotFound /> : <Loading />}</Page>
  return children({ ...bundle, isOwn: resolved.uid === myUid, nickname })
}

export function ProfilePage() {
  const { profile } = useAuth()
  const { books, sessions } = useData()
  return (
    <Page>
      <ProfileView profile={profile} books={books} sessions={sessions} isOwn />
    </Page>
  )
}

export function UserProfilePage() {
  const { nickname } = useParams()
  const { profile: me } = useAuth()
  if (me && nickname === me.nickname) return <Navigate to="/profile" replace />
  return (
    <WithUser>
      {({ profile, books, sessions }) => (
        <Page>
          <ProfileView profile={profile} books={books} sessions={sessions} isOwn={false} />
        </Page>
      )}
    </WithUser>
  )
}

export function UserCalendarPage() {
  return (
    <WithUser>
      {({ profile, books, sessions, isOwn }) => (
        <Page>
          <CalendarView sessions={sessions} books={books} isOwn={isOwn} ownerName={`@${profile.nickname}`} />
        </Page>
      )}
    </WithUser>
  )
}

function UserLibraryInner({ profile, books, isOwn }) {
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('recent')
  const [sortOpen, setSortOpen] = useState(false)
  const [detail, setDetail] = useState(null)
  const visible = useMemo(
    () => sortBooks(filter === 'all' ? books : books.filter((b) => b.status === filter), sort),
    [books, filter, sort],
  )
  return (
    <Page>
      <TopBar back title={`@${profile.nickname}`} className="pt-2" />
      <div className="mb-4 mt-1 font-serif text-[23px]">Kütüphane</div>
      <FilterPills filter={filter} setFilter={setFilter} onSort={() => setSortOpen(true)} />
      <div className="mb-5 mt-5 text-[16px] text-mute">{visible.length} kitap</div>
      {visible.length ? (
        <BookGrid books={visible} onSelect={setDetail} />
      ) : (
        <EmptyState icon={Library} title="Bu rafta kitap yok" />
      )}
      <SortSheet open={sortOpen} onClose={() => setSortOpen(false)} sort={sort} setSort={setSort} />
      <BookDetailSheet book={detail} open={Boolean(detail)} onClose={() => setDetail(null)} readOnly={!isOwn} />
    </Page>
  )
}

export function UserLibraryPage() {
  return <WithUser>{(b) => <UserLibraryInner {...b} />}</WithUser>
}

function ReviewsInner({ profile, books, isOwn }) {
  const [detail, setDetail] = useState(null)
  const list = reviewedBooks(books)
  return (
    <Page>
      <TopBar back title="İncelemeler" className="pt-2" />
      <div className="mb-5 text-[16px] text-mute">@{profile.nickname} · {list.length} inceleme</div>
      {list.length ? (
        <div className="space-y-3">
          {list.map((b) => (
            <ReviewRow key={b.id} book={b} onClick={() => setDetail(b)} />
          ))}
        </div>
      ) : (
        <EmptyState icon={Star} title="Henüz inceleme yok" />
      )}
      <BookDetailSheet book={detail} open={Boolean(detail)} onClose={() => setDetail(null)} readOnly={!isOwn} />
    </Page>
  )
}

export function ReviewsPage() {
  return <WithUser>{(b) => <ReviewsInner {...b} />}</WithUser>
}

export function useGoToUser() {
  const navigate = useNavigate()
  const { uid } = useAuth()
  return (u) => navigate(u.uid === uid ? '/profile' : `/u/${u.nickname}`)
}
