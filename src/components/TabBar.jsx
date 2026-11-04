import { NavLink, useLocation } from 'react-router-dom'
import { Home, Library, CalendarDays, User } from 'lucide-react'
import { motion } from 'framer-motion'

const TABS = [
  { to: '/', label: 'Ana Sayfa', icon: Home, match: (p) => p === '/' },
  { to: '/library', label: 'Kitaplar', icon: Library, match: (p) => p.startsWith('/library') },
  { to: '/stats', label: 'İstatistik', icon: CalendarDays, match: (p) => p.startsWith('/stats') },
  { to: '/profile', label: 'Profil', icon: User, match: (p) => p.startsWith('/profile') || p.startsWith('/settings') || p.startsWith('/friends') },
]

export default function TabBar() {
  const { pathname } = useLocation()
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.06] bg-ink/85 backdrop-blur-xl"
      style={{ paddingBottom: 'max(var(--sab), 8px)' }}
    >
      <div className="mx-auto grid h-[var(--tabbar-h)] max-w-[560px] grid-cols-4 px-3">
        {TABS.map((t) => {
          const active = t.match(pathname)
          const Icon = t.icon
          return (
            <NavLink
              key={t.to}
              to={t.to}
              replace
              className="relative flex flex-col items-center justify-center gap-1"
              aria-label={t.label}
            >
              <div className="relative flex h-[34px] w-[62px] items-center justify-center">
                {active && (
                  <motion.span
                    layoutId="tab-pill"
                    className="absolute inset-0 rounded-full bg-accent/[0.14] ring-1 ring-accent/30"
                    transition={{ type: 'spring', damping: 30, stiffness: 420 }}
                  />
                )}
                <Icon
                  size={22}
                  strokeWidth={active ? 2.2 : 1.8}
                  className={`relative transition-colors ${active ? 'text-accent' : 'text-mute'}`}
                />
              </div>
              <span className={`text-[11px] font-medium ${active ? 'text-accent' : 'text-mute'}`}>{t.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
