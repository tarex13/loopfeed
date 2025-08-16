import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCreateLoopStore } from './useCreateLoopStore'
import LoopCardPreview from '../../components/LoopCardPreview'

export default function StepPreview() {
  const { cards, autoplay, theme, font, bgColor, music } = useCreateLoopStore()
  const [index, setIndex] = useState(0)
  const current = cards[index]
  const [previewUrl, setPreviewUrl] = useState(null)

  // Autoplay
  useEffect(() => {
    if (!autoplay || cards.length === 0) return
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % cards.length)
    }, 3500)
    return () => clearInterval(timer)
  }, [autoplay, cards.length])

  // Create object URL safely
  useEffect(() => {
    if (!current) {
      setPreviewUrl(null)
      return
    }

    if (current.file) {
      const objectUrl = URL.createObjectURL(current.file)
      setPreviewUrl(objectUrl)

      return () => {
        URL.revokeObjectURL(objectUrl) // revoke previous URL on cleanup
      }
    }

    setPreviewUrl(current.content || null)
  }, [current])

  const fontClasses = {
    default: 'font-sans',
    serif: 'font-serif italic',
    typewriter: 'font-mono tracking-wider',
  }

  const themeClasses = {
    lofi: 'bg-[#fef3c7] text-gray-900 border-amber-300',
    bold: 'bg-black text-white border-white',
    minimal: 'bg-white text-gray-800 border-gray-300',
    soft: 'bg-gray-100 text-gray-700 border-gray-200',
  }

  const appliedFont = fontClasses[font?.toLowerCase()] || fontClasses.default
  const appliedTheme = themeClasses[theme] || themeClasses.minimal

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {music && (
        <audio autoPlay loop muted className="mb-4 w-full">
          <source src={music} />
        </audio>
      )}

      <div className="text-center mb-2">
        <h3 className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Previewing card {index + 1} of {cards.length}
        </h3>
      </div>

      {current ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.4 }}
            className={`rounded-xl border aspect-[4/5] overflow-hidden shadow-md flex items-center justify-center transition-all duration-300 ${appliedTheme} ${appliedFont}`}
            style={{ backgroundColor: bgColor || undefined }}
          >
            <div className="w-full h-full p-4 flex flex-col items-center justify-center text-center">
              <div className="text-[10px] uppercase mb-2 tracking-widest opacity-50">
                {current.type}
              </div>

              {current.type === 'text' ? (
                <blockquote className="text-lg sm:text-2xl leading-relaxed font-medium px-4 py-2 whitespace-pre-wrap break-words">
                  “{current.content.trim()}”
                </blockquote>
              ) : previewUrl ? (
                <LoopCardPreview
                  type={current.type}
                  url={previewUrl}
                  metadata={current.metadata}
                  backgroundColor={bgColor}
                />
              ) : (
                <div>Loading preview…</div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="text-center text-gray-400">No cards yet. Go back and add some.</div>
      )}

      {cards.length > 1 && (
        <div className="mt-6 flex justify-center gap-6">
          <button
            onClick={() => setIndex((index - 1 + cards.length) % cards.length)}
            className="px-4 py-1 rounded-full text-sm text-blue-500 bg-white dark:bg-gray-800 border"
          >
            ← Previous
          </button>
          <button
            onClick={() => setIndex((index + 1) % cards.length)}
            className="px-4 py-1 rounded-full text-sm text-blue-500 bg-white dark:bg-gray-800 border"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
