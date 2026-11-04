import { AnimatePresence, motion, useDragControls } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useEffect } from 'react'

const spring = { type: 'spring', damping: 32, stiffness: 340, mass: 0.9 }

/**
 * iOS tarzı alt panel. Tutamaçtan veya başlıktan aşağı sürükleyerek kapatılır.
 */
export default function BottomSheet({ open, onClose, children, className = '', zIndex = 60, dismissible = true }) {
  const controls = useDragControls()

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && dismissible && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, dismissible])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0" style={{ zIndex }}>
          <motion.div
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => dismissible && onClose?.()}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className={`absolute inset-x-0 bottom-0 mx-auto flex max-h-[92dvh] w-full max-w-[560px] flex-col rounded-t-[30px] border-t border-white/[0.07] bg-card-2/95 shadow-glass backdrop-blur-2xl ${className}`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={spring}
            drag={dismissible ? 'y' : false}
            dragListener={false}
            dragControls={controls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 600) onClose?.()
            }}
          >
            <div
              className="flex shrink-0 cursor-grab touch-none justify-center pb-2 pt-3"
              onPointerDown={(e) => dismissible && controls.start(e)}
            >
              <div className="h-[5px] w-10 rounded-full bg-white/25" />
            </div>
            <div className="no-scrollbar scroll-touch min-h-0 flex-1 overflow-y-auto px-5 pb-safe">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
