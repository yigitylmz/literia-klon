import { motion } from 'framer-motion'
import { Check, BookOpen } from 'lucide-react'
import BookCover from '../BookCover'
import { Stars } from '../ui/primitives'

export function BookTile({ book, onClick, index = 0 }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 12) * 0.025, duration: 0.25 }}
      whileTap={{ scale: 0.96 }}
      className="min-w-0 text-left"
    >
      <BookCover book={book} className="aspect-[2/3] w-full shadow-lg" rounded="rounded-[14px]">
        {book.status === 'completed' && (
          <>
            <span className="absolute right-2 top-2 flex h-[26px] w-[26px] items-center justify-center rounded-full bg-ok ring-2 ring-black/30">
              <Check size={16} strokeWidth={3.2} className="text-[#0B2A18]" />
            </span>
            {book.rating ? (
              <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/80 via-black/40 to-transparent pb-2 pt-8">
                <Stars value={book.rating} size={14} gap="gap-[2px]" />
              </div>
            ) : null}
          </>
        )}
        {book.status === 'reading' && (
          <span className="absolute right-2 top-2 flex h-[30px] w-[30px] items-center justify-center rounded-[10px] bg-black/45 backdrop-blur-md">
            <BookOpen size={17} className="fill-accent/30 text-accent" />
          </span>
        )}
      </BookCover>
      <div className="mt-2 truncate text-[14.5px] font-medium text-white/95">{book.title}</div>
      <div className="truncate text-[13px] text-mute">{book.author}</div>
    </motion.button>
  )
}

export default function BookGrid({ books, onSelect }) {
  return (
    <div className="grid grid-cols-3 gap-x-3 gap-y-6">
      {books.map((b, i) => (
        <BookTile key={b.id} book={b} index={i} onClick={() => onSelect(b)} />
      ))}
    </div>
  )
}
