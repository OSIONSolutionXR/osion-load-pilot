import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Home, 
  Target, 
  ListTodo, 
  History, 
  ArrowUp,
  ChevronUp
} from 'lucide-react'

interface MobileBottomNavProps {
  activeSection?: string
  onNavigate?: (section: string) => void
}

const navItems = [
  { id: 'overview', label: 'Übersicht', icon: Home },
  { id: 'next', label: 'Nächster Schritt', icon: Target },
  { id: 'actions', label: 'Aktionen', icon: ListTodo },
  { id: 'history', label: 'Verlauf', icon: History },
]

export default function MobileBottomNav({ 
  activeSection = 'overview',
  onNavigate 
}: MobileBottomNavProps) {
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  // Show scroll-to-top after scrolling
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', () => {
      setShowScrollTop(window.scrollY > 300)
    }, { passive: true })
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleNavClick = (sectionId: string) => {
    onNavigate?.(sectionId)
    
    // Scroll to section
    const section = document.getElementById(`section-${sectionId}`)
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <>
      {/* Scroll to top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-24 right-4 w-12 h-12 rounded-full bg-violet-600 text-white shadow-lg shadow-violet-500/30 flex items-center justify-center z-40 lg:hidden"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
        {/* Expanded Menu */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mx-4 mb-2 p-2 rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-white/10 shadow-xl"
            >
              <div className="grid grid-cols-2 gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = activeSection === item.id
                  
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => {
                        handleNavClick(item.id)
                        setIsExpanded(false)
                      }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                        isActive 
                          ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' 
                          : 'text-zinc-400 hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Bar */}
        <div className="bg-zinc-950/95 backdrop-blur-xl border-t border-white/10">
          <div className="flex items-center justify-around px-2 py-2">
            {navItems.slice(0, 4).map((item) => {
              const Icon = item.icon
              const isActive = activeSection === item.id
              
              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  whileTap={{ scale: 0.9 }}
                  className="relative flex flex-col items-center gap-1 py-2 px-3 min-w-[64px]"
                >
                  <motion.div
                    animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-violet-400' : 'text-zinc-500'}`} />
                  </motion.div>
                  
                  <span className={`text-[10px] ${isActive ? 'text-violet-400 font-medium' : 'text-zinc-500'}`}>
                    {item.label}
                  </span>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-violet-500 rounded-full"
                    />
                  )}
                </motion.button>
              )
            })}
            
            {/* Expand button */}
            <motion.button
              onClick={() => setIsExpanded(!isExpanded)}
              whileTap={{ scale: 0.9 }}
              className="flex flex-col items-center gap-1 py-2 px-3 min-w-[64px]"
            >
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronUp className={`w-5 h-5 ${isExpanded ? 'text-violet-400' : 'text-zinc-500'}`} />
              </motion.div>
              <span className={`text-[10px] ${isExpanded ? 'text-violet-400' : 'text-zinc-500'}`}>
                Mehr
              </span>
            </motion.button>
          </div>
          
          {/* Safe area padding for iOS */}
          <div className="h-safe-area-inset-bottom" />
        </div>
      </div>
    </>
  )
}
