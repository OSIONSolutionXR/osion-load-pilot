import { motion } from 'motion/react'
import { AlertTriangle } from 'lucide-react'

interface RiskCalloutProps {
  title: string
  body: string
}

export function RiskCallout({ title, body }: RiskCalloutProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="risk-bar p-5 md:p-6 mt-8"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#fb7185]/10 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-[#fb7185]" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-subhead font-semibold text-zinc-200 mb-1">{title}</h4>
          <p className="text-body">{body}</p>
        </div>
      </div>
    </motion.div>
  )
}
