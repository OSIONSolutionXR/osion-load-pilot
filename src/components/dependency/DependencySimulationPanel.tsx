import { motion } from 'motion/react'
import { GitBranch, X } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Panel } from '../ui/Panel'
import { DependencyNode } from './DependencyNode'
import { RiskCallout } from './RiskCallout'
import { demoProject } from '../../data/demoProject'
import { deriveDependencyNodes, deriveRiskText } from '../../lib/projectTwinDerived'
import type { ProjectTwinAnalysis } from '../../types/projectTwin'

interface DependencySimulationPanelProps {
  variant?: 'full' | 'compact'
  analysis?: ProjectTwinAnalysis | null
}

export function DependencySimulationPanel({ variant = 'full', analysis = null }: DependencySimulationPanelProps) {
  const nodes = analysis ? deriveDependencyNodes(analysis) : demoProject.nodes
  const riskText = analysis ? deriveRiskText(analysis) : demoProject.riskText
  const isCompact = variant === 'compact'

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <Panel variant={isCompact ? 'compact' : 'default'}>
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-title">Erkannte Abhängigkeit</h2>
              <p className="text-sm text-zinc-500 mt-0.5">{analysis?.project.title ?? 'Finanzierungsrunde'}</p>
            </div>
          </div>
          <Badge variant="simulation">Simulation</Badge>
        </div>

        {/* Desktop Flow: 4 Columns mit CSS Connectors */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-4 gap-4 relative">
            {/* Node 1: Steuerberater */}
            <div className="relative">
              <DependencyNode node={nodes[0]} index={0} />
              
              {/* Connector zu Node 2 */}
              <div className="absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-violet-500 to-blue-500 -translate-y-1/2 z-0"></div>
              <div className="absolute top-1/2 -right-5 w-0 h-0 border-t-[4px] border-b-[4px] border-l-[6px] border-t-transparent border-b-transparent border-l-violet-500 -translate-y-1/2 z-0"></div>
            </div>

            {/* Node 2: BWA */}
            <div className="relative">
              <DependencyNode node={nodes[1]} index={1} />
              
              {/* Blocked Connector zu Node 3 */}
              <div className="absolute top-1/2 -right-4 w-8 h-0.5 border-t-2 border-dashed border-[#fb7185] -translate-y-1/2 z-0"></div>
              
              {/* X Blocker Marker */}
              <div className="absolute top-1/2 -right-5 w-5 h-5 rounded-full bg-[#07070b] border-2 border-[#fb7185] flex items-center justify-center -translate-y-1/2 z-10">
                <X className="w-3 h-3 text-[#fb7185]" />
              </div>
            </div>

            {/* Node 3: Bank */}
            <div className="relative">
              <DependencyNode node={nodes[2]} index={2} />
              
              {/* Connector zu Node 4 (subtil) */}
              <div className="absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-violet-500/30 to-blue-500/30 -translate-y-1/2 z-0"></div>
            </div>

            {/* Node 4: Zusage */}
            <div>
              <DependencyNode node={nodes[3]} index={3} />
            </div>
          </div>
        </div>

        {/* Mobile Flow: Vertical Stack */}
        <div className="lg:hidden space-y-4">
          {nodes.map((node, idx) => (
            <div key={node.id}>
              <DependencyNode
                node={node}
                index={idx}
              />
              {idx === 1 && (
                <div className="flex justify-center py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-0.5 border-t-2 border-dashed border-[#fb7185]"></div>
                    <div className="w-5 h-5 rounded-full bg-[#07070b] border-2 border-[#fb7185] flex items-center justify-center">
                      <X className="w-3 h-3 text-[#fb7185]" />
                    </div>
                    <div className="w-8 h-0.5 border-t-2 border-dashed border-[#fb7185]"></div>
                  </div>
                </div>
              )}
              {(idx === 0 || idx === 2) && idx < nodes.length - 1 && (
                <div className="flex justify-center py-3">
                  <div className="w-0.5 h-8 bg-gradient-to-b from-violet-500 to-blue-500"></div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Risk Callout */}
        <RiskCallout 
          title="Wenn heute nichts passiert"
          body={riskText}
        />
      </Panel>
    </motion.section>
  )
}
