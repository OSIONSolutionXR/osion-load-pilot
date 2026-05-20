import { motion } from 'motion/react'
import { Folder, Plus, ArrowRight } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Panel } from '../components/ui/Panel'
import type { StoredProjectTwin } from '../lib/projectTwinStore'

interface ProjectsScreenProps {
  twins: StoredProjectTwin[]
  onOpenTwin: (id: string) => void
  onNewProject: () => void
}

function formatRelativeLabel(dateString: string) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

export default function ProjectsScreen({ twins, onOpenTwin, onNewProject }: ProjectsScreenProps) {
  const projects = twins
  const hasProjects = projects.length > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-6"
    >
      <Panel variant="compact">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Folder className="w-4 h-4 text-zinc-500" />
              <Badge variant="violet">Projekte</Badge>
            </div>
            <h1 className="text-headline">Projektübersicht</h1>
          </div>
          
          <Button icon={Plus} onClick={onNewProject}>
            Neues Projekt
          </Button>
        </div>

        {hasProjects ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <motion.div
                key={project.id}
                whileHover={{ y: -4 }}
                className="panel-card p-5 cursor-pointer group"
                onClick={() => onOpenTwin(project.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-[#ff006e] flex items-center justify-center">
                      <Folder className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold">{project.analysis.project.title}</div>
                      <div className="text-xs text-zinc-500">{project.analysis.nextMove.title}</div>
                    </div>
                  </div>
                  
                  <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={project.analysis.project.status === 'blocked' ? 'rose' : 'blue'}>
                    {project.analysis.project.status}
                  </Badge>
                  <Badge variant="neutral">{formatRelativeLabel(project.updatedAt)}</Badge>
                  <Badge variant="neutral">{project.analysis.risks.length} Risiken</Badge>
                </div>
              </motion.div>
            ))}

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="panel-card p-5 border-dashed border-2 border-white/10 flex flex-col items-center justify-center text-center cursor-pointer min-h-[160px]"
              onClick={onNewProject}
            >
              <Plus className="w-8 h-8 text-zinc-600 mb-3" />
              <div className="text-zinc-500 font-medium">Neues Projekt</div>
              <div className="text-xs text-zinc-600 mt-1">Füge eine neue Projektlage hinzu</div>
            </motion.div>
          </div>
        ) : (
          <div className="panel-card border border-white/10 p-8 md:p-10 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-[#ff006e]/20 border border-white/10">
              <Folder className="w-7 h-7 text-violet-300" />
            </div>
            <h2 className="text-title mb-3">Noch keine Project Twins</h2>
            <p className="text-sm text-zinc-400 max-w-xl mx-auto mb-8">
              Erfasse deinen ersten Input, damit Load Pilot einen echten Project Twin anlegt und hier in der Projektübersicht anzeigt.
            </p>
            <Button icon={Plus} onClick={onNewProject}>
              Ersten Input erfassen
            </Button>
          </div>
        )}
      </Panel>
    </motion.div>
  )
}
