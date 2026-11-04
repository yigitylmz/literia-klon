import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import BottomSheet from './ui/BottomSheet'
import { Avatar, Spinner } from './ui/primitives'
import { repo } from '../data/repo'
import { useData } from '../context/DataContext'

/** Bildirimler: seni takip edenler (geri takip butonuyla). */
export default function NotificationsSheet({ open, onClose, profile }) {
  const navigate = useNavigate()
  const { follow } = useData()
  const [users, setUsers] = useState(null)

  useEffect(() => {
    if (!open) return
    setUsers(null)
    repo.getUsers(profile?.followers || []).then(setUsers).catch(() => setUsers([]))
  }, [open, profile?.followers?.join(',')]) // eslint-disable-line react-hooks/exhaustive-deps

  const following = new Set(profile?.following || [])

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="pb-4">
        <h2 className="font-serif text-[23px]">Bildirimler</h2>
        {users === null ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <Bell size={30} className="text-mute" />
            <p className="mt-3 text-[15px] text-mute">Henüz bildirimin yok.</p>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-white/[0.06]">
            {users.map((u) => (
              <div key={u.uid} className="flex items-center gap-3 py-3">
                <button
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  onClick={() => {
                    onClose()
                    navigate(`/u/${u.nickname}`)
                  }}
                >
                  <Avatar user={u} size={44} />
                  <div className="min-w-0">
                    <div className="truncate text-[16px]">
                      <span className="font-semibold">@{u.nickname}</span> seni takip etti
                    </div>
                    <div className="text-[14px] text-mute">{u.displayName}</div>
                  </div>
                </button>
                {!following.has(u.uid) && (
                  <button onClick={() => follow(u.uid)} className="btn-primary h-9 px-4 text-[14px]">
                    Geri takip et
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </BottomSheet>
  )
}
