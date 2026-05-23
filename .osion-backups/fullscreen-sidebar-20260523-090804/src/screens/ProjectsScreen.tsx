import { motion } from 'motion/react'
import { Folder, Plus, ArrowRight, Clock, BarChart3, RotateCcw, Zap } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import type { StoredProjectTwin } from '../lib/projectTwinStore'
import { FadeIn } from '../components/animations/MicroAnimations'

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
    <FadeIn direction="up">
      <div className="projects-page">
        <section className="projects-header">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="violet">Projekte</Badge>
            </div>
            <h1 className="project-command-header__title">Projektübersicht</h1>
            <p className="project-command-header__description">
              Alle Project Twins, ihre aktuelle Lage und der nächste sinnvolle Schritt.
            </p>
          </div>
          
          <button className="lp-button-primary flex items-center gap-2" onClick={onNewProject}>
            <Plus className="w-4 h-4" />
            Neues Projekt
          </button>
        </section>

        {hasProjects ? (
          <section className="projects-grid">
            {projects.map((project) => (
              <motion.div
                key={project.id}
                whileHover={{ y: -4 }}
                className="lp-card lp-card--padded cursor-pointer group"
                onClick={() => onOpenTwin(project.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--lp-violet)] to-[var(--lp-magenta)] flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-[var(--lp-text)] truncate">{project.analysis.project.title}</div>
                      <div className="text-xs text-[var(--lp-muted)] truncate">{project.analysis.nextMove.title}</div>
                    </div>
                  </div>
                  
                  <ArrowRight className="w-5 h-5 text-[var(--lp-muted)] group-hover:text-[var(--lp-text)] transition-colors flex-shrink-0" />
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant={project.analysis.project.status === 'blocked' ? 'rose' : 'blue'}>
                    {project.analysis.project.status}
                  </Badge>
                  <Badge variant="neutral">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatRelativeLabel(project.updatedAt)}
                  </Badge>
                  <Badge variant="neutral">
                    <RotateCcw className="w-3 h-3 mr-1" />
                    {project.updates?.length || 0} Updates
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-[var(--lp-border)]">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-3.5 h-3.5 text-[var(--lp-muted)]" />
                    <span className="text-xs text-[var(--lp-muted)]">
                      {project.progress?.percent || 0}% Fortschritt
                    </span>
                  </div>
                  <div className="text-xs text-[var(--lp-muted)]">
                    {project.analysis.risks.length} Risiken
                  </div>
                </div>
              </motion.div>
            ))}

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="lp-card lp-card--padded border-dashed border-2 border-[var(--lp-border)] flex flex-col items-center justify-center text-center cursor-pointer min-h-[160px]"
              onClick={onNewProject}
            >
              <Plus className="w-8 h-8 text-[var(--lp-muted)] mb-3" />
              <div className="text-[var(--lp-text)] font-medium">Neues Projekt</div>
              <div className="text-xs text-[var(--lp-faint)] mt-1">Füge eine neue Projektlage hinzu</div>
            </motion.div>
          </section>
        ) : (
          <section className="lp-card lp-card--padded text-center py-12">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-rose-500/20 border border-[var(--lp-border)]">
              <Folder className="w-7 h-7 text-violet-300" />
            </div>
            <h2 className="text-2xl font-semibold text-[var(--lp-text)] mb-3">Noch keine Project Twins</h2>
            <p className="text-sm text-[var(--lp-muted)] max-w-xl mx-auto mb-8">
              Erfasse deinen ersten Input, damit Load Pilot einen echten Project Twin anlegt und hier in der Projektübersicht anzeigt.
            </p>
            <Button icon={Plus} onClick={onNewProject}>
              Ersten Input erfassen
            </Button>
          </section>
        )}
      </div>
    </FadeIn>
  )
}
