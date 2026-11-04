import { BookOpen, ChevronRight } from 'lucide-react'
import { ProgressBar } from './ui/primitives'

export default function GoalCard({ progress, onClick, chevron = false }) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp type={onClick ? 'button' : undefined} onClick={onClick} className="card press block w-full p-4 text-left">
      <div className="flex items-center gap-3.5">
        <BookOpen size={24} strokeWidth={1.5} className={chevron ? 'text-accent' : 'text-accent-soft'} />
        <div className="min-w-0 flex-1 truncate font-serif text-[clamp(16px,4.6vw,18px)]">{progress.year} okuma hedefi</div>
        <div className="shrink-0 font-serif text-[clamp(18px,5.2vw,21px)] tabular">
          {progress.done} / {progress.goal}
        </div>
        {chevron && <ChevronRight size={22} className="-mr-1 text-mute" />}
      </div>
      <ProgressBar value={progress.percent} className="mt-4" height="h-[9px]" />
      <div className="mt-3 text-[15.5px] text-mute">
        {progress.remaining > 0 ? `Hedefe ${progress.remaining} kitap kaldı` : 'Hedefe ulaşıldı 🎉'} · %{progress.percent}
      </div>
    </Comp>
  )
}
