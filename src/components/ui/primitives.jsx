import { Star, ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export function ProgressBar({ value = 0, className = '', height = 'h-[7px]', color = 'bg-accent' }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div className={`w-full overflow-hidden rounded-full bg-white/[0.07] ${height} ${className}`}>
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={false}
        animate={{ width: `${v}%` }}
        transition={{ type: 'spring', damping: 30, stiffness: 160 }}
      />
    </div>
  )
}

export function Segmented({ options, value, onChange, className = '' }) {
  return (
    <div className={`inline-flex rounded-full bg-ink-850 p-1 hairline ${className}`}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`relative min-w-[58px] rounded-full px-4 py-1.5 text-[15px] font-semibold transition-colors ${
              active ? 'text-ink' : 'text-white/80'
            }`}
          >
            {active && (
              <motion.span
                layoutId={`seg-${options.map((x) => x.value).join('-')}`}
                className="absolute inset-0 rounded-full bg-accent"
                transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export function Stars({ value = 0, size = 16, color = 'text-star', onChange, gap = 'gap-1', className = '' }) {
  return (
    <div className={`flex items-center ${gap} ${className}`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= (value || 0)
        const el = (
          <Star
            size={size}
            strokeWidth={1.6}
            className={filled ? `${color} fill-current` : 'text-white/20'}
          />
        )
        return onChange ? (
          <button key={n} type="button" className="press p-1" onClick={() => onChange(n === value ? 0 : n)}>
            {el}
          </button>
        ) : (
          <span key={n}>{el}</span>
        )
      })}
    </div>
  )
}

export function Avatar({ user, size = 48, className = '' }) {
  const initial = (user?.displayName || user?.nickname || '?').trim().charAt(0).toLocaleUpperCase('tr')
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1E2A3D] font-serif text-white ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {user?.photoURL ? (
        <img src={user.photoURL} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="leading-none">{initial}</span>
      )}
    </div>
  )
}

export function TopBar({ title, back = false, right, serif = true, className = '', onBack }) {
  const navigate = useNavigate()
  return (
    <div className={`flex min-h-[46px] items-center gap-3 ${className}`}>
      {back && (
        <button
          type="button"
          onClick={() => (onBack ? onBack() : window.history.length > 1 ? navigate(-1) : navigate('/'))}
          className="press -ml-2 flex h-11 w-11 items-center justify-center rounded-full text-white"
          aria-label="Geri"
        >
          <ChevronLeft size={30} strokeWidth={2} />
        </button>
      )}
      <h1 className={`min-w-0 flex-1 truncate text-[clamp(20px,6vw,23px)] leading-tight ${serif ? 'font-serif font-medium' : 'font-semibold'}`}>
        {title}
      </h1>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  )
}

export function Spinner({ size = 22, className = '' }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-white/15 border-t-accent ${className}`}
      style={{ width: size, height: size }}
    />
  )
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {Icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-card hairline">
          <Icon size={28} className="text-accent" strokeWidth={1.6} />
        </div>
      )}
      <div className="font-serif text-[18px]">{title}</div>
      {text && <p className="mt-2 max-w-[300px] text-[15px] leading-relaxed text-mute">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function Checkbox({ checked, onChange, label, description }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex w-full items-start gap-4 py-2 text-left">
      <span
        className={`mt-1 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[7px] border-2 transition-colors ${
          checked ? 'border-accent bg-accent' : 'border-white/30 bg-transparent'
        }`}
      >
        {checked && (
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-ink" fill="none" stroke="currentColor" strokeWidth="3.4">
            <path d="M5 12.5l4.2 4.2L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span>
        <span className="block text-[16px] text-white/95">{label}</span>
        {description && <span className="mt-1 block text-[14.5px] leading-snug text-mute">{description}</span>}
      </span>
    </button>
  )
}
