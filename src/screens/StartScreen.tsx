import type { StoredProjectTwin } from '../lib/projectTwinStore'
import { 
  FolderKanban, 
  PlusCircle, 
  Command, 
  MessageCircle,
  CheckSquare,
  CalendarDays,
  BrainCircuit,
  Bot,
  Database,
  AlertCircle,
  ArrowRight,
  Zap,
  Activity,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react'

interface StartScreenProps {
  twins: StoredProjectTwin[]
  onOpenTwin: (id: string) => void
  onNewInput: () => void
  onOpenCommand: () => void
  onOpenChat: () => void
  onOpenProjects: () => void
}

export default function StartScreen({ 
  twins, 
  onOpenTwin, 
  onNewInput, 
  onOpenCommand, 
  onOpenChat,
  onOpenProjects 
}: StartScreenProps) {
  // System-Statistiken
  const projectCount = twins.length
  const measureCount = twins.reduce((acc, t) => acc + (t.measures?.length || 0), 0)
  const riskCount = twins.reduce((acc, t) => acc + (t.analysis?.risks?.length || 0), 0)
  
  // Aufmerksamkeitsliste
  const criticalItems = twins.filter(t => 
    t.analysis?.risks?.some(r => r.severity === 'high') ||
    t.progress?.stage === 'blocked'
  )
  
  const attentionCount = criticalItems.length
  const hasTwins = projectCount > 0

  // Formatierung für Zahlen
  const formatNumber = (n: number) => n.toString()

  return (
    <div className="start-cockpit">
      {/* HERO-BEREICH: Tagescockpit */}
      <section className="cockpit-hero">
        <div className="cockpit-hero__main">
          <div className="cockpit-hero__greeting">
            <Zap className="cockpit-hero__icon" />
            <h1 className="cockpit-hero__title">
              Was möchtest Du heute steuern?
            </h1>
          </div>
          <p className="cockpit-hero__subtitle">
            Dein OSION Load Pilot hat {projectCount} {projectCount === 1 ? 'Projekt' : 'Projekte'}, {measureCount} Maßnahmen
            {attentionCount > 0 && (
              <span> und <strong>{attentionCount} {attentionCount === 1 ? 'Punkt' : 'Punkte'}</strong>, die Deine Aufmerksamkeit brauchen</span>
            )}
            {attentionCount === 0 && ' und keine dringenden Punkte'}
          </p>
        </div>

        {/* System-Status-Chips */}
        <div className="cockpit-hero__status">
          <div className="status-chip status-chip--active">
            <Activity className="w-3 h-3" />
            <span>OpenClaw aktiv</span>
          </div>
          <div className="status-chip">
            <FolderKanban className="w-3 h-3" />
            <span>{projectCount} Projekte</span>
          </div>
          {attentionCount > 0 ? (
            <div className="status-chip status-chip--alert">
              <AlertCircle className="w-3 h-3" />
              <span>{attentionCount} offen</span>
            </div>
          ) : (
            <div className="status-chip status-chip--success">
              <TrendingUp className="w-3 h-3" />
              <span>Heute fokussieren</span>
            </div>
          )}
        </div>
      </section>

      {/* ASYMMETRISCHE HAUPTAKTIONEN */}
      <section className="cockpit-actions">
        {/* Große Hauptkarte: Projekt weiterbearbeiten */}
        <button 
          className="action-card action-card--hero"
          onClick={onOpenProjects}
        >
          <div className="action-card__hero-content">
            <div className="action-card__hero-badge">
              <FolderKanban className="w-5 h-5" />
              <span>Hauptweg</span>
            </div>
            <h2 className="action-card__hero-title">
              Projekt weiterbearbeiten
            </h2>
            <p className="action-card__hero-desc">
              {hasTwins 
                ? `${projectCount} ${projectCount === 1 ? 'Projekt bereit' : 'Projekte bereit'} – öffne Deinen Project Twin und setze den nächsten Schritt`
                : 'Noch keine Projekte – starte mit einem neuen Input'
              }
            </p>
            <div className="action-card__hero-cta">
              <span>{hasTwins ? 'Projekte öffnen' : 'Erstes Projekt starten'}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
          <div className="action-card__hero-visual">
            <div className="hero-visual__glow hero-visual__glow--blue" />
          </div>
        </button>

        {/* Sekundäre Aktionen als Stack */}
        <div className="action-card-stack">
          <button 
            className="action-card action-card--secondary"
            onClick={onNewInput}
          >
            <div className="action-card__secondary-icon action-card__secondary-icon--green">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div className="action-card__secondary-content">
              <h3>Neues Projekt starten</h3>
              <p>Neue Analyse oder Project Twin erstellen</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>

          <button 
            className="action-card action-card--secondary"
            onClick={onOpenCommand}
          >
            <div className="action-card__secondary-icon action-card__secondary-icon--amber">
              <Command className="w-5 h-5" />
            </div>
            <div className="action-card__secondary-content">
              <h3>Command prüfen</h3>
              <p>Projektübergreifende Steuerzentrale</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>

          <button 
            className="action-card action-card--secondary"
            onClick={onOpenChat}
          >
            <div className="action-card__secondary-icon action-card__secondary-icon--purple">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div className="action-card__secondary-content">
              <h3>Mit OSION sprechen</h3>
              <p>Chat für Fragen und Steuerung</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </section>

      {/* HEUTE WICHTIG: Hochwertige Aufmerksamkeitsliste */}
      {attentionCount > 0 && (
        <section className="cockpit-attention">
          <div className="cockpit-section-header">
            <div className="cockpit-section-header__title-group">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              <h2 className="cockpit-section-header__title">Heute wichtig</h2>
            </div>
            <span className="cockpit-badge cockpit-badge--alert">
              {attentionCount} {attentionCount === 1 ? 'Punkt' : 'Punkte'}
            </span>
          </div>
          
          <div className="attention-cards">
            {criticalItems.slice(0, 2).map(twin => {
              const criticalRisk = twin.analysis?.risks?.find(r => r.severity === 'high')
              const isBlocked = twin.progress?.stage === 'blocked'
              
              return (
                <div 
                  key={twin.id} 
                  className="attention-card"
                  onClick={() => onOpenTwin(twin.id)}
                >
                  <div className="attention-card__header">
                    <span className="attention-card__project">{twin.title}</span>
                    <span className={`attention-card__priority attention-card__priority--${isBlocked ? 'critical' : 'high'}`}>
                      {isBlocked ? 'Blockiert' : 'Kritisch'}
                    </span>
                  </div>
                  
                  <p className="attention-card__issue">
                    {isBlocked 
                      ? 'Projektfortschritt blockiert – sofortige Klärung nötig'
                      : criticalRisk?.title || 'Hohes Risiko identifiziert'
                    }
                  </p>
                  
                  <div className="attention-card__footer">
                    <span className="attention-card__type">
                      {isBlocked ? 'Blocker' : 'Risiko'}
                    </span>
                    <div className="attention-card__actions">
                      <button className="attention-card__btn attention-card__btn--secondary">
                        Mit KI prüfen
                      </button>
                      <button className="attention-card__btn attention-card__btn--primary">
                        Öffnen
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
            
            {attentionCount > 2 && (
              <button 
                className="attention-card attention-card--more"
                onClick={onOpenCommand}
              >
                <span>+ {attentionCount - 2} weitere Punkte in Command</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </section>
      )}

      {/* DIREKT WEITERARBEITEN: Module mit Zahlen */}
      <section className="cockpit-modules">
        <h2 className="cockpit-modules__title">Direkt weiterarbeiten</h2>
        
        <div className="module-grid">
          <button className="module-card">
            <div className="module-card__icon module-card__icon--blue">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div className="module-card__content">
              <span className="module-card__label">Maßnahmen</span>
              <span className="module-card__count">{formatNumber(measureCount)}</span>
            </div>
          </button>
          
          <button className="module-card">
            <div className="module-card__icon module-card__icon--amber">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div className="module-card__content">
              <span className="module-card__label">Fristen</span>
              <span className="module-card__count module-card__count--soon">3</span>
            </div>
          </button>
          
          <button className="module-card">
            <div className="module-card__icon module-card__icon--purple">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div className="module-card__content">
              <span className="module-card__label">Simulation</span>
              <span className="module-card__status">Bereit</span>
            </div>
          </button>
          
          <button className="module-card">
            <div className="module-card__icon module-card__icon--green">
              <Bot className="w-5 h-5" />
            </div>
            <div className="module-card__content">
              <span className="module-card__label">Agenten</span>
              <span className="module-card__count">0</span>
            </div>
          </button>
          
          <button className="module-card">
            <div className="module-card__icon module-card__icon--slate">
              <Database className="w-5 h-5" />
            </div>
            <div className="module-card__content">
              <span className="module-card__label">Memory</span>
              <span className="module-card__status">Aktuell</span>
            </div>
          </button>
        </div>
      </section>

      {/* SYSTEM-STATUS-LEISTE */}
      <footer className="cockpit-footer">
        <div className="system-status">
          <div className="system-status__item">
            <FolderKanban className="w-4 h-4" />
            <span>{projectCount} {projectCount === 1 ? 'Projekt' : 'Projekte'}</span>
          </div>
          <span className="system-status__dot">·</span>
          <div className="system-status__item">
            <CheckSquare className="w-4 h-4" />
            <span>{measureCount} Maßnahmen</span>
          </div>
          <span className="system-status__dot">·</span>
          <div className="system-status__item">
            <ShieldAlert className="w-4 h-4" />
            <span>{riskCount} Risiken</span>
          </div>
          {attentionCount > 0 && (
            <>
              <span className="system-status__dot">·</span>
              <div className="system-status__item system-status__item--alert">
                <AlertCircle className="w-4 h-4" />
                <span>{attentionCount} {attentionCount === 1 ? 'Punkt' : 'Punkte'} Aufmerksamkeit</span>
              </div>
            </>
          )}
        </div>
      </footer>
    </div>
  )
}
