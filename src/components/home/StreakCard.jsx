import { Flame, Check } from 'lucide-react'
import { motion } from 'framer-motion'

export default function StreakCard({ streak, week, todayPages, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.985 }}
      className="card w-full p-4 text-left"
    >
      <div className="flex items-start gap-3.5">
        <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[14px] bg-streak-bg">
          <Flame
            size={23}
            className={streak.current > 0 ? 'fill-streak-soft text-streak-soft' : 'text-mute'}
            strokeWidth={2}
          />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="text-[20px] font-bold leading-none tracking-tight">{streak.current} gün</div>
          <div className="mt-1.5 text-[14.5px] text-mute">okuma serisi</div>
        </div>
        <div className="pt-0.5 text-right">
          <div className={`text-[16px] font-semibold leading-none ${todayPages > 0 ? 'text-accent' : 'text-mute'}`}>
            +{todayPages} sf
          </div>
          <div className="mt-1.5 text-[14px] text-mute">bugün</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1">
        {week.map((d) => (
          <div key={d.dateStr} className="flex flex-col items-center gap-1.5">
            <div
              className={`flex aspect-square w-full max-w-[36px] items-center justify-center rounded-full transition-colors ${
                d.active
                  ? 'bg-streak-soft text-white'
                  : d.isToday
                    ? 'border-2 border-dashed border-streak-soft/50'
                    : 'border-2 border-white/[0.08]'
              }`}
            >
              {d.active && <Check size={18} strokeWidth={2.8} />}
            </div>
            <span
              className={`text-[13px] ${
                d.active ? 'text-streak-soft' : d.isToday ? 'text-white/80' : 'text-mute-2'
              } ${d.isToday ? 'font-semibold' : ''}`}
            >
              {d.label}
            </span>
          </div>
        ))}
      </div>
    </motion.button>
  )
}
