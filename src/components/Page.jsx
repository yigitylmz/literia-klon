import { motion } from 'framer-motion'

/** Her sayfanın kendi kaydırma alanı (iOS'ta gövde kaydırması kapalı). */
export default function Page({ children, className = '', padded = true }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="no-scrollbar scroll-touch absolute inset-0 overflow-y-auto overflow-x-hidden"
    >
      <div className={`mx-auto w-full max-w-[560px] pt-safe pb-tabbar ${padded ? 'px-5' : ''} ${className}`}>
        {children}
      </div>
    </motion.div>
  )
}
