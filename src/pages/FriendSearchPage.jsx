import { useEffect, useState } from 'react'
import { AtSign, X, Users } from 'lucide-react'
import Page from '../components/Page'
import { Avatar, Spinner, TopBar, EmptyState } from '../components/ui/primitives'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useUI } from '../context/UIContext'
import { repo } from '../data/repo'
import { useGoToUser } from './UserPages'

function UserRow({ user, me, onOpen }) {
  const { follow } = useData()
  const { toast } = useUI()
  const iFollow = (me.following || []).includes(user.uid)
  const followsMe = (me.followers || []).includes(user.uid)
  return (
    <div className="flex items-center gap-3 py-3">
      <button onClick={() => onOpen(user)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <Avatar user={user} size={50} />
        <div className="min-w-0">
          <div className="truncate text-[16px] font-medium">{user.displayName}</div>
          <div className="truncate text-[14.5px] text-mute">@{user.nickname}</div>
        </div>
      </button>
      {user.uid !== me.uid &&
        (iFollow ? (
          <span className="rounded-full px-3 py-1.5 text-[13.5px] text-mute ring-1 ring-white/12">
            {followsMe ? 'Arkadaş' : 'Takip ediliyor'}
          </span>
        ) : (
          <button
            onClick={async () => {
              await follow(user.uid)
              toast(`@${user.nickname} takip ediliyor`)
            }}
            className="btn-primary h-9 px-4 text-[14px]"
          >
            {followsMe ? 'Geri takip et' : 'Takip et'}
          </button>
        ))}
    </div>
  )
}

export default function FriendSearchPage() {
  const { profile } = useAuth()
  const goTo = useGoToUser()
  const [q, setQ] = useState('')
  const [results, setResults] = useState(null)
  const [following, setFollowing] = useState(null)

  useEffect(() => {
    repo.getUsers(profile.following || []).then(setFollowing).catch(() => setFollowing([]))
  }, [profile.following?.join(',')]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const term = q.trim().replace(/^@/, '')
    if (!term) return setResults(null)
    setResults(undefined)
    const t = setTimeout(async () => {
      try {
        setResults(await repo.searchUsers(term, profile.uid))
      } catch {
        setResults([])
      }
    }, 300)
    return () => clearTimeout(t)
  }, [q, profile.uid])

  return (
    <Page>
      <TopBar back title="Arkadaş ara" className="pt-2" />
      <div className="mt-3 flex h-[52px] items-center gap-2.5 rounded-2xl bg-card px-4 hairline focus-within:border-accent/50">
        <AtSign size={19} className="text-mute" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="kullanıcı adı ile ara"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-mute-2"
        />
        {q && (
          <button onClick={() => setQ('')} className="press text-mute" aria-label="Temizle">
            <X size={18} />
          </button>
        )}
      </div>

      {results === undefined && (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      )}
      {Array.isArray(results) &&
        (results.length ? (
          <div className="mt-3 divide-y divide-white/[0.06]">
            {results.map((u) => (
              <UserRow key={u.uid} user={u} me={profile} onOpen={goTo} />
            ))}
          </div>
        ) : (
          <p className="py-10 text-center text-[15px] text-mute">“@{q.replace(/^@/, '')}” bulunamadı.</p>
        ))}

      {results === null && (
        <>
          <div className="section-label mb-1 mt-8">Takip ettiklerin</div>
          {following === null ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : following.length ? (
            <div className="divide-y divide-white/[0.06]">
              {following.map((u) => (
                <UserRow key={u.uid} user={u} me={profile} onOpen={goTo} />
              ))}
            </div>
          ) : (
            <EmptyState icon={Users} title="Henüz kimseyi takip etmiyorsun" text="Arkadaşlarını @kullanıcıadı ile bul ve okuma takvimlerini birlikte takip edin." />
          )}
        </>
      )}
    </Page>
  )
}
