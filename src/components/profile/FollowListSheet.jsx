import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomSheet from '../ui/BottomSheet'
import { Avatar, Spinner } from '../ui/primitives'
import { repo } from '../../data/repo'
import { useAuth } from '../../context/AuthContext'

export default function FollowListSheet({ open, onClose, title, uids = [] }) {
  const navigate = useNavigate()
  const { uid: me } = useAuth()
  const [users, setUsers] = useState(null)

  useEffect(() => {
    if (!open) return
    setUsers(null)
    repo.getUsers(uids).then(setUsers).catch(() => setUsers([]))
  }, [open, uids.join(',')]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="pb-4">
        <h2 className="font-serif text-[22px]">{title}</h2>
        {users === null ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : users.length === 0 ? (
          <p className="py-10 text-center text-[15px] text-mute">Burada henüz kimse yok.</p>
        ) : (
          <div className="mt-3 divide-y divide-white/[0.06]">
            {users.map((u) => (
              <button
                key={u.uid}
                onClick={() => {
                  onClose()
                  navigate(u.uid === me ? '/profile' : `/u/${u.nickname}`)
                }}
                className="flex w-full items-center gap-3 py-3 text-left"
              >
                <Avatar user={u} size={46} />
                <div className="min-w-0">
                  <div className="truncate text-[16px] font-medium">{u.displayName}</div>
                  <div className="truncate text-[14px] text-mute">@{u.nickname}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </BottomSheet>
  )
}
