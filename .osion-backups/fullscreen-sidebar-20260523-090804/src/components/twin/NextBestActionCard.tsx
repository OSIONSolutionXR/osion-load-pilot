import { motion, useReducedMotion } from 'motion/react'
import { Target, Zap, Clock, ArrowRight, ChevronRight } from 'lucide-react'
import { Button } from '../ui/Button'
import type { ProjectTwinAnalysis } from '../../types/projectTwin'
import { FadeIn, HoverScale } from '../animations/MicroAnimations'

interface NextBestActionCardProps {
  nextMove: ProjectTwinAnalysis['nextMove']
  isBlocked?: boolean
  onAction?: () => void
  onShowDetails?: () => void
}

export default function NextBestActionCard({
  nextMove,
  isBlocked = false,
  onAction,
  onShowDetails
}: NextBestActionCardProps) {
  const prefersReducedMotion = useReducedMotion()
  
  const borderColor = isBlocked ? 'border-rose-500/40' : 'border-[var(--lp-accent)]/40'
  const bgGradient = isBlocked 
    ? 'from-rose-500/8 via-rose-500/4 to-transparent'
    : 'from-[var(--lp-accent)]/8 via-[var(--lp-info)]/4 to-transparent'
  
  return (
    <FadeIn delay={0.1} direction="up">
      <motion.section
        className={`relative lp-card lp-card--padded border-l-4 ${borderColor} overflow-hidden`}
      >
        {/* Animated Background */}
        <motion.div 
          className={`absolute inset-0 bg-gradient-to-br ${bgGradient}`}
          initial={prefersReducedMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        />
        
        {/* Subtle pulse for blocked state */}
        {isBlocked && !prefersReducedMotion && (
          <motion.div
            className="absolute inset-0 border-2 border-rose-500/20 rounded-2xl"
            animate={{ 
              scale: [1, 1.02, 1],
              opacity: [0.2, 0.35, 0.2]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
        
        {/* Content */}
        <div className="relative">
          <div className="flex items-center gap-3 mb-5">
            <motion.div 
              className={`w-12 h-12 rounded-xl ${isBlocked ? 'bg-rose-500/10 border-rose-500/25' : 'bg-[var(--lp-accent)]/10 border-[var(--lp-accent)]/25'} flex items-center justify-center border`}
              whileHover={prefersReducedMotion ? {} : { scale: 1.05, rotate: 5 }}
              transition={{ duration: 0.2 }}
            >
              <Target className={`w-6 h-6 ${isBlocked ? 'text-rose-500' : 'text-[var(--lp-accent)]'}`} />
            </motion.div>
            <div>
              <div className="text-xs text-[var(--lp-muted)] uppercase tracking-wider">Nächster wirksamster Schritt</div>
              <motion.h2 
                className="text-xl md:text-2xl font-bold text-[var(--lp-text-strong)] mt-0.5"
                initial={prefersReducedMotion ? {} : { opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                {nextMove.title}
              </motion.h2>
            </div>
          </div>

          <motion.p 
            className="text-[var(--lp-muted)] text-base leading-relaxed mb-6 max-w-3xl"
            initial={prefersReducedMotion ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            {nextMove.reason}
          </motion.p>

          <div className="flex flex-wrap gap-6 mb-6">
            <motion.div 
              className="flex items-center gap-3"
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <motion.div 
                className="w-10 h-10 rounded-lg bg-[var(--lp-success)]/10 flex items-center justify-center border border-[var(--lp-success)]/20"
                whileHover={prefersReducedMotion ? {} : { scale: 1.1 }}
              >
                <Clock className="w-5 h-5 text-[var(--lp-success)]" />
              </motion.div>
              <div>
                <div className="text-xs text-[var(--lp-muted)] uppercase">Aufwand</div>
                <div className="font-medium text-[var(--lp-success)] capitalize">{nextMove.effort}</div>
              </div>
            </motion.div>

            <motion.div 
              className="flex items-center gap-3"
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <motion.div 
                className="w-10 h-10 rounded-lg bg-[var(--lp-accent)]/10 flex items-center justify-center border border-[var(--lp-accent)]/20"
                whileHover={prefersReducedMotion ? {} : { scale: 1.1 }}
              >
                <Zap className="w-5 h-5 text-[var(--lp-accent)]" />
              </motion.div>
              <div>
                <div className="text-xs text-[var(--lp-muted)] uppercase">Impact</div>
                <div className="font-medium text-[var(--lp-accent)] capitalize">{nextMove.impact}</div>
              </div>
            </motion.div>

            {nextMove.deadline && (
              <motion.div 
                className="flex items-center gap-3"
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.4 }}
              >
                <motion.div 
                  className="w-10 h-10 rounded-lg bg-[var(--lp-warning)]/10 flex items-center justify-center border border-[var(--lp-warning)]/20"
                  whileHover={prefersReducedMotion ? {} : { scale: 1.1 }}
                >
                  <Clock className="w-5 h-5 text-[var(--lp-warning)]" />
                </motion.div>
                <div>
                  <div className="text-xs text-[var(--lp-muted)] uppercase">Deadline</div>
                  <div className="font-medium text-[var(--lp-warning)]">{nextMove.deadline}</div>
                </div>
              </motion.div>
            )}
          </div>

          <motion.div 
            className="flex flex-wrap gap-3"
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.4 }}
          >
            <HoverScale scale={1.02}>
              <Button 
                variant="primary" 
                onClick={onAction}
                className="lp-button-primary"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Jetzt starten
              </Button>
            </HoverScale>
            
            <Button 
              variant="ghost" 
              onClick={onShowDetails}
              className="text-[var(--lp-muted)] hover:text-[var(--lp-text)]"
            >
              Details anzeigen
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        </div>
      </motion.section>
    </FadeIn>
  )
}
