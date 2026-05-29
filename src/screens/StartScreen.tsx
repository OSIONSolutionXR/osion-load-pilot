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
  Sparkles,
  Zap
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
  // Berechnungen
  const projectCount = twins.length
  const openMeasures = twins.reduce((acc, t) => acc + (t.measures?.filter(m => m.status === 'open').length || 0), 0)
  const criticalRisks = twins.reduce((acc, t) => acc + (t.analysis?.risks?.filter(r => r.severity === 'high').length || 0), 0)
  
  const criticalItems = twins.filter(t => 
    t.analysis?.risks?.some(r => r.severity === 'high') ||
    t.progress?.stage === 'blocked'
  )

  return (
    <div className="start-screen">
      {/* A) HERO / HAUPTBEREICH */}
      <section className="hero-section">
        <div className="hero-badge">
          <Sparkles className="hero-badge__icon" />
          <span>OSION Load Pilot</span>
        </div>
        <h1 className="hero-title">Was möchtest Du heute tun?</h1>
        <p className="hero-subtitle">
          Wähle den nächsten Schritt und arbeite smarter mit Deinem Project Twin.
        </p>
        
        {/* Kompakter Statusüberblick */}
        {projectCount > 0 && (
          <div className="hero-status">
            <div className="hero-status__item">
              <span className="hero-status__value">{projectCount}</span>
              <span className="hero-status__label">Projekte</span>
            </div>
            <div className="hero-status__divider" />
            <div className="hero-status__item">
              <span className="hero-status__value">{openMeasures}</span>
              <span className="hero-status__label">offene Maßnahmen</span>
            </div>
            {criticalRisks > 0 && (
              <>
                <div className="hero-status__divider" />
                <div className="hero-status__item hero-status__item--alert">
                  <span className="hero-status__value">{criticalRisks}</span>
                  <span className="hero-status__label">kritische Risiken</span>
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* B) PRIMÄRE AKTIONSBEREICHE - 4 Hauptkarten */}
      <section className="primary-actions">
        <div className="primary-grid">
          {/* Karte 1: Projekte weiterbearbeiten */}
          <button 
            className="action-card action-card--projects"
            onClick={onOpenProjects}
          >
            <div className="action-card__top">
              <div className="action-card__icon action-card__icon--projects">
                <FolderKanban className="w-6 h-6" />
              </div>
              <ArrowRight className="action-card__arrow" />
            </div>
            <div className="action-card__content">
              <h3 className="action-card__title">Projekte weiterbearbeiten</h3>
              <p className="action-card__description">
                Öffne Deine Projekte und arbeite direkt im jeweiligen Project Twin weiter.
              </p>
            </div>
          </button>

          {/* Karte 2: Neues Projekt starten */}
          <button 
            className="action-card action-card--new"
            onClick={onNewInput}
          >
            <div className="action-card__top">
              <div className="action-card__icon action-card__icon--new">
                <PlusCircle className="w-6 h-6" />
              </div>
              <ArrowRight className="action-card__arrow" />
            </div>
            <div className="action-card__content">
              <h3 className="action-card__title">Neues Projekt starten</h3>
              <p className="action-card__description">
                Starte eine neue Analyse oder erstelle einen neuen Project Twin.
              </p>
            </div>
          </button>

          {/* Karte 3: Command prüfen */}
          <button 
            className="action-card action-card--command"
            onClick={onOpenCommand}
          >
            <div className="action-card__top">
              <div className="action-card__icon action-card__icon--command">
                <Command className="w-6 h-6" />
              </div>
              <ArrowRight className="action-card__arrow" />
            </div>
            <div className="action-card__content">
              <h3 className="action-card__title">Command prüfen</h3>
              <p className="action-card__description">
                Prüfe projektübergreifend kritische Maßnahmen, Blocker und Fristen.
              </p>
            </div>
          </button>

          {/* Karte 4: Mit OSION sprechen */}
          <button 
            className="action-card action-card--chat"
            onClick={onOpenChat}
          >
            <div className="action-card__top">
              <div className="action-card__icon action-card__icon--chat">
                <MessageCircle className="w-6 h-6" />
              </div>
              <ArrowRight className="action-card__arrow" />
            </div>
            <div className="action-card__content">
              <h3 className="action-card__title">Mit OSION sprechen</h3>
              <p className="action-card__description">
                Öffne den Chat für Fragen, Planung und projektübergreifende Steuerung.
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* C) SEKUNDÄRE SCHNELLEINSTIEGE */}
      <section className="quick-access">
        <h2 className="section-label">Schnellzugriff</h2>
        <div className="quick-grid">
          <button className="quick-item" onClick={() => { /* TODO: Navigate to measures */ }}>
            <div className="quick-item__icon quick-item__icon--measures">
              <CheckSquare className="w-5 h-5" />
            </div>
            <span className="quick-item__label">Maßnahmen</span>
            {openMeasures > 0 && <span className="quick-item__badge">{openMeasures}</span>}
          </button>
          
          <button className="quick-item" onClick={() => { /* TODO: Navigate to deadlines */ }}>
            <div className="quick-item__icon quick-item__icon--deadlines">
              <CalendarDays className="w-5 h-5" />
            </div>
            <span className="quick-item__label">Fristen</span>
          </button>
          
          <button className="quick-item" onClick={() => { /* TODO: Navigate to simulation */ }}>
            <div className="quick-item__icon quick-item__icon--simulation">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <span className="quick-item__label">Simulation</span>
          </button>
          
          <button className="quick-item" onClick={() => { /* TODO: Navigate to agents */ }}>
            <div className="quick-item__icon quick-item__icon--agents">
              <Bot className="w-5 h-5" />
            </div>
            <span className="quick-item__label">Agenten</span>
          </button>
          
          <button className="quick-item" onClick={() => { /* TODO: Navigate to memory */ }}>
            <div className="quick-item__icon quick-item__icon--memory">
              <Database className="w-5 h-5" />
            </div>
            <span className="quick-item__label">Memory</span>
          </button>
        </div>
      </section>

      {/* D) AUFMERKSAMKEITSLISTE - nach unten verschoben */}
      {criticalItems.length > 0 && (
        <section className="attention-section">
          <div className="attention-header">
            <div className="attention-header__title-group">
              <div className="attention-header__icon">
                <Zap className="w-4 h-4" />
              </div>
              <h2 className="attention-header__title">Aufmerksamkeitsliste</h2>
            </div>
            <span className="attention-header__count">{criticalItems.length} Punkte</span>
          </div>
          
          <div className="attention-list-premium">
            {criticalItems.slice(0, 5).map((twin) => {
              const risk = twin.analysis?.risks?.find(r => r.severity === 'high')
              const isBlocked = twin.progress?.stage === 'blocked'
              
              return (
                <div 
                  key={twin.id} 
                  className="attention-row"
                  onClick={() => onOpenTwin(twin.id)}
                >
                  <div className="attention-row__indicator" />
                  <div className="attention-row__content">
                    <div className="attention-row__main">
                      <span className="attention-row__project">{twin.title}</span>
                      <span className="attention-row__meta">
                        {isBlocked ? 'Blockiert' : risk?.title || 'Kritisch'}
                      </span>
                    </div>
                    <div className="attention-row__tags">
                      <span className={`attention-tag ${isBlocked ? 'attention-tag--blocked' : 'attention-tag--risk'}`}>
                        {isBlocked ? 'Blockiert' : 'Hohes Risiko'}
                      </span>
                    </div>
                  </div>
                  <button className="attention-row__action">
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
            
            {criticalItems.length > 5 && (
              <button 
                className="attention-show-more"
                onClick={onOpenCommand}
              >
                + {criticalItems.length - 5} weitere in Command anzeigen
              </button>
            )}
          </div>
        </section>
      )}

      {/* Empty State für Aufmerksamkeitsliste */}
      {projectCount > 0 && criticalItems.length === 0 && (
        <section className="attention-section attention-section--empty">
          <div className="attention-empty">
            <div className="attention-empty__icon">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="attention-empty__content">
              <h3 className="attention-empty__title">Alles im Griff</h3>
              <p className="attention-empty__text">
                Aktuell gibt es keine kritischen Punkte, die Deine Aufmerksamkeit erfordern.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
