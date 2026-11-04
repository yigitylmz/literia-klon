import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import { CheckCircle2, AlertCircle, Info } from 'lucide-react'
import CenterModal from '../components/ui/CenterModal'
import RatingSheet from '../components/RatingSheet'

const UIContext = createContext(null)

export function UIProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [confirmState, setConfirmState] = useState(null)
  const [ratingBook, setRatingBook] = useState(null)
  const resolver = useRef(null)

  const toast = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t.slice(-2), { id, message, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600)
  }, [])

  const confirm = useCallback(
    (opts) =>
      new Promise((resolve) => {
        resolver.current = resolve
        setConfirmState(opts)
      }),
    [],
  )

  const closeConfirm = (result) => {
    resolver.current?.(result)
    resolver.current = null
    setConfirmState(null)
  }

  const value = useMemo(() => ({ toast, confirm, openRating: setRatingBook }), [toast, confirm])

  return (
    <UIContext.Provider value={value}>
      {children}

      <RatingSheet book={ratingBook} onClose={() => setRatingBook(null)} />

      <CenterModal open={Boolean(confirmState)} onClose={() => closeConfirm(false)} zIndex={90}>
        {confirmState && (
          <div className="p-6">
            <div className="font-serif text-[18px] leading-tight">{confirmState.title}</div>
            {confirmState.message && <p className="mt-2 text-[15px] leading-relaxed text-mute">{confirmState.message}</p>}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button className="btn-dark h-12 text-[16px]" onClick={() => closeConfirm(false)}>
                {confirmState.cancelText || 'Vazgeç'}
              </button>
              <button
                className={`press h-12 rounded-full text-[16px] font-semibold ${
                  confirmState.destructive ? 'bg-[#E5484D] text-white' : 'bg-accent text-ink'
                }`}
                onClick={() => closeConfirm(true)}
              >
                {confirmState.confirmText || 'Onayla'}
              </button>
            </div>
          </div>
        )}
      </CenterModal>

      {createPortal(
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-4 pt-safe">
          <AnimatePresence>
            {toasts.map((t) => {
              const Icon = t.type === 'error' ? AlertCircle : t.type === 'info' ? Info : CheckCircle2
              return (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: -24, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -16, scale: 0.95 }}
                  className="glass-strong mt-2 flex max-w-[92vw] items-center gap-2.5 rounded-full px-4 py-2.5 text-[15px] shadow-glass hairline"
                >
                  <Icon
                    size={18}
                    className={t.type === 'error' ? 'text-[#FF6B6B]' : t.type === 'info' ? 'text-accent' : 'text-ok'}
                  />
                  <span className="text-white/95">{t.message}</span>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </UIContext.Provider>
  )
}

export const useUI = () => useContext(UIContext)
