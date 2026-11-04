import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal, Check, Library } from 'lucide-react'
import Page from '../components/Page'
import BookGrid from '../components/library/BookGrid'
import BookDetailSheet from '../components/library/BookDetailSheet'
import SearchModal from '../components/library/SearchModal'
import ProgressSheet from '../components/ProgressSheet'
import BottomSheet from '../components/ui/BottomSheet'
import { EmptyState } from '../components/ui/primitives'
import { useData } from '../context/DataContext'
import { toMillis } from '../utils/date'
import { bookPercent } from '../utils/statsCalculator'

export const FILTERS = [
  { value: 'all', label: 'Tümü' },
  { value: 'reading', label: 'Okuyorum' },
  { value: 'completed', label: 'Okudum' },
  { value: 'want_to_read', label: 'Okuyacağım' },
]

export const SORTS = [
  { value: 'recent', label: 'Son güncellenen' },
  { value: 'added', label: 'Eklenme tarihi' },
  { value: 'title', label: 'Kitap adı (A–Z)' },
  { value: 'author', label: 'Yazar (A–Z)' },
  { value: 'rating', label: 'Puan' },
  { value: 'progress', label: 'İlerleme' },
]

export function sortBooks(list, sort) {
  const arr = [...list]
  const tr = (s) => (s || '').toLocaleLowerCase('tr')
  switch (sort) {
    case 'title':
      return arr.sort((a, b) => tr(a.title).localeCompare(tr(b.title), 'tr'))
    case 'author':
      return arr.sort((a, b) => tr(a.author).localeCompare(tr(b.author), 'tr'))
    case 'rating':
      return arr.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    case 'progress':
      return arr.sort((a, b) => bookPercent(b) - bookPercent(a))
    case 'added':
      return arr.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
    default:
      return arr.sort((a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt))
  }
}

const load = (k, d) => {
  try {
    return localStorage.getItem(k) || d
  } catch {
    return d
  }
}
const save = (k, v) => {
  try {
    localStorage.setItem(k, v)
  } catch {
    /* yoksay */
  }
}

export function FilterPills({ filter, setFilter, onSort }) {
  return (
    <div className="relative -mx-5">
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 py-1 pr-16">
        {FILTERS.map((f) => {
          const active = filter === f.value
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`press flex h-[30px] shrink-0 items-center gap-1 rounded-full border-[1.5px] px-3 text-[13px] font-medium transition-colors ${
                active ? 'border-accent/85 bg-accent/[0.12] text-accent' : 'border-transparent bg-card-3/70 text-white/85'
              }`}
            >
              {active && <Check size={12} strokeWidth={2.8} />}
              {f.label}
            </button>
          )
        })}
      </div>
      {onSort && (
        <div className="absolute inset-y-0 right-0 flex items-center bg-gradient-to-l from-ink via-ink to-transparent pl-6 pr-5">
          <button onClick={onSort} className="press flex h-[30px] w-8 items-center justify-center text-white" aria-label="Sırala">
            <SlidersHorizontal size={18} />
          </button>
        </div>
      )}
    </div>
  )
}

export function SortSheet({ open, onClose, sort, setSort }) {
  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="pb-4">
        <h2 className="font-serif text-[22px]">Sırala</h2>
        <div className="mt-3 divide-y divide-white/[0.06]">
          {SORTS.map((s) => (
            <button
              key={s.value}
              onClick={() => {
                setSort(s.value)
                onClose()
              }}
              className="flex w-full items-center justify-between py-4 text-left text-[16px]"
            >
              {s.label}
              {sort === s.value && <Check size={20} className="text-accent" />}
            </button>
          ))}
        </div>
      </div>
    </BottomSheet>
  )
}

export default function LibraryPage() {
  const { books } = useData()
  const [filter, setFilterState] = useState(() => load('satir:libFilter', 'all'))
  const [sort, setSortState] = useState(() => load('satir:libSort', 'recent'))
  const [sortOpen, setSortOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [detail, setDetail] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [progressBook, setProgressBook] = useState(null)

  const setFilter = (v) => {
    setFilterState(v)
    save('satir:libFilter', v)
  }
  const setSort = (v) => {
    setSortState(v)
    save('satir:libSort', v)
  }

  const visible = useMemo(
    () => sortBooks(filter === 'all' ? books : books.filter((b) => b.status === filter), sort),
    [books, filter, sort],
  )
  const liveProgress = progressBook ? books.find((b) => b.id === progressBook.id) : null

  return (
    <Page>
      <header className="flex items-center justify-between pb-5 pt-4">
        <h1 className="font-serif text-[26px] font-medium leading-tight">Kitaplığım</h1>
        <button onClick={() => setSearchOpen(true)} className="press -mr-1 flex h-12 w-12 items-center justify-center" aria-label="Kitap ara">
          <Search size={23} strokeWidth={2} />
        </button>
      </header>

      <FilterPills filter={filter} setFilter={setFilter} onSort={() => setSortOpen(true)} />
      <div className="mb-5 mt-5 text-[16px] text-mute">{visible.length} kitap</div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Library}
          title={books.length ? 'Bu rafta kitap yok' : 'Kitaplığın boş'}
          text="Sağ üstteki büyüteçle dünyadaki tüm kitaplar arasında arama yapıp ekleyebilirsin."
          action={
            <button onClick={() => setSearchOpen(true)} className="btn-primary h-12 px-6 text-[16px]">
              <Search size={18} /> Kitap ara
            </button>
          }
        />
      ) : (
        <BookGrid
          books={visible}
          onSelect={(b) => {
            setDetail(b)
            setDetailOpen(true)
          }}
        />
      )}

      <SortSheet open={sortOpen} onClose={() => setSortOpen(false)} sort={sort} setSort={setSort} />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <BookDetailSheet book={detail} open={detailOpen} onClose={() => setDetailOpen(false)} onProgress={setProgressBook} />
      <ProgressSheet book={liveProgress} open={Boolean(progressBook)} onClose={() => setProgressBook(null)} />
    </Page>
  )
}
