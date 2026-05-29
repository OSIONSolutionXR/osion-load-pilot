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
  const projectCount = twins.length
  const openMeasures = twins.reduce((acc, t) => acc + (t.measures?.filter(m => m.status === 'open').length || 0), 0)
  const criticalRisks = twins.reduce((acc, t) => acc + (t.analysis?.risks?.filter(r => r.severity === 'high').length || 0), 0)
  
  const criticalItems = twins.filter(t => 
    t.analysis?.risks?.some(r => r.severity === 'high') ||
    t.progress?.stage === 'blocked'
  )

  return (
    <div className="start-screen">
      {/* HERO: Links Titel, Rechts KPIs - keine verschachtelte Box */}
      <section className="hero">
        <div className="hero__left">
          <div className="hero__badge">
            <Sparkles className="hero__badge-icon" />
            <span>OSION Load Pilot</span>
          </div>
          <h1 className="hero__title">Was möchtest Du heute tun?</h1>
          <p className="hero__subtitle">
            Wähle den nächsten Schritt und arbeite smarter mit Deinem Project Twin.
          </p>
        </div>
        
        {projectCount > 0 && (
          <div className="hero__stats">
            <div className="stat-pill">
              <span className="stat-pill__value">{projectCount}</span>
              <span className="stat-pill__label">Projekte</span>
            </div>
            <div className="stat-pill">
              <span className="stat-pill__value">{openMeasures}</span>
              <span className="stat-pill__label">Maßnahmen</span>
            </div>
            {criticalRisks > 0 && (
              <div className="stat-pill stat-pill--alert">
                <span className="stat-pill__value">{criticalRisks}</span>
                <span className="stat-pill__label">Risiken</span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 4 HAUPTAKTIONEN - mit farblicher Absetzung */}
      <section className="actions">
        <button 
          className="action-card action-card--projects"
          onClick={onOpenProjects}
        >
          <div className="action-card__icon">
            <FolderKanban className="w-6 h-6" />
          </div>
          <h3 className="action-card__title">Projekte weiterbearbeiten</h3>
          <p className="action-card__text">Öffne Deine Projekte und arbeite direkt im jeweiligen Project Twin weiter.</p>
          <ArrowRight className="action-card__arrow" />
        </button>

        <button 
          className="action-card action-card--new"
          onClick={onNewInput}
        >
          <div className="action-card__icon">
            <PlusCircle className="w-6 h-6" />
          </div>
          <h3 className="action-card__title">Neues Projekt starten</h3>
          <p className="action-card__text">Starte eine neue Analyse oder erstelle einen neuen Project Twin.</p>
          <ArrowRight className="action-card__arrow" />
        </button>

        <button 
          className="action-card action-card--command"
          onClick={onOpenCommand}
        >
          <div className="action-card__icon">
            <Command className="w-6 h-6" />
          </div>
          <h3 className="action-card__title">Command prüfen</h3>
          <p className="action-card__text">Prüfe projektübergreifend kritische Maßnahmen, Blocker und Fristen.</p>
          <ArrowRight className="action-card__arrow" />
        </button>

        <button 
          className="action-card action-card--chat"
          onClick={onOpenChat}
        >
          <div className="action-card__icon">
            <MessageCircle className="w-6 h-6" />
          </div>
          <h3 className="action-card__title">Mit OSION sprechen</h3>
          <p className="action-card__text">Öffne den Chat für Fragen, Planung und projektübergreifende Steuerung.</p>
          <ArrowRight className="action-card__arrow" />
        </button>
      </section>

      {/* SCHNELLZUGRIFFE */}
      <section className="quick-access">
        <h2 className="quick-access__label">Schnellzugriff</h2>
        <div className="quick-grid">
          <button className="quick-item">
            <div className="quick-item__icon quick-item__icon--measures">
              <CheckSquare className="w-5 h-5" />
            </div>
            <span className="quick-item__label">Maßnahmen</span>
            {openMeasures > 0 && <span className="quick-item__badge">{openMeasures}</span>}
          </button>
          
          <button className="quick-item">
            <div className="quick-item__icon quick-item__icon--deadlines">
              <CalendarDays className="w-5 h-5" />
            </div>
            <span className="quick-item__label">Fristen</span>
          </button>
          
          <button className="quick-item">
            <div className="quick-item__icon quick-item__icon--simulation">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <span className="quick-item__label">Simulation</span>
          </button>
          
          <button className="quick-item">
            <div className="quick-item__icon quick-item__icon--agents">
              <Bot className="w-5 h-5" />
            </div>
            <span className="quick-item__label">Agenten</span>
          </button>
          
          <button className="quick-item">
            <div className="quick-item__icon quick-item__icon--memory">
              <Database className="w-5 h-5" />
            </div>
            <span className="quick-item__label">Memory</span>
          </button>
        </div>
      </section>

      {/* AUFMERKSAMKEITSLISTE - unten */}
      {criticalItems.length > 0 ? (
        <section className="attention">
          <div className="attention__header">
            <div className="attention__title-wrap">
              <Zap className="attention__title-icon" />
              <h2 className="attention__title">Aufmerksamkeitsliste</h2>
            </div>
            <span className="attention__count">{criticalItems.length} Punkte</span>
          </div>
          
          <div className="attention__list">
            {criticalItems.slice(0, 5).map((twin) => {
              const risk = twin.analysis?.risks?.find(r => r.severity === 'high')
              const isBlocked = twin.progress?.stage === 'blocked'
              
              return (
                <div 
                  key={twin.id} 
                  className="attention__item"
                  onClick={() => onOpenTwin(twin.id)}
                >
                  <div className="attention__item-dot" />
                  <div className="attention__item-content">
                    <span className="attention__item-project">{twin.title}</span>
                    <span className="attention__item-meta">
                      {isBlocked ? 'Blockiert' : risk?.title || 'Kritisch'}
                    </span>
                  </div>
                  <span className={`attention__item-tag ${isBlocked ? 'attention__item-tag--blocked' : 'attention__item-tag--risk'}`}>
                    {isBlocked ? 'Blockiert' : 'Hohes Risiko'}
                  </span>
                  <ArrowRight className="attention__item-arrow" />
                </div>
              )
            })}
            
            {criticalItems.length > 5 && (
              <button className="attention__more" onClick={onOpenCommand}>
                + {criticalItems.length - 5} weitere in Command anzeigen
              </button>
            )}
          </div>
        </section>
      ) : projectCount > 0 ? (
        <section className="attention attention--empty">
          <div className="attention__empty">
            <AlertCircle className="attention__empty-icon" />
            <div>
              <h3 className="attention__empty-title">Alles im Griff</h3>
              <p className="attention__empty-text">Aktuell keine kritischen Punkte.</p>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
