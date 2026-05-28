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
  ArrowRight
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
  // Attention Queue Berechnung
  const criticalItems = twins.filter(t => 
    t.analysis?.risks?.some(r => r.severity === 'high') ||
    t.progress?.stage === 'blocked'
  ).length

  const hasTwins = twins.length > 0

  return (
    <div className="start-screen">
      {/* Header */}
      <div className="start-screen__header">
        <h1 className="start-screen__title">Was möchtest Du heute tun?</h1>
        <p className="start-screen__subtitle">
          Wähle Deinen nächsten Schritt im OSION Load Pilot
        </p>
      </div>

      {/* Zone 1: Hauptentscheidung - Loslegen */}
      <section className="start-screen__section start-screen__section--primary">
        <div className="start-screen__grid start-screen__grid--4">
          {/* Karte 1: Projekte weiterbearbeiten */}
          <button 
            className="start-card start-card--primary"
            onClick={onOpenProjects}
          >
            <div className="start-card__icon-wrapper start-card__icon--projects">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div className="start-card__content">
              <h3 className="start-card__title">Projekte weiterbearbeiten</h3>
              <p className="start-card__description">
                Öffne Deine Projekte und arbeite direkt im jeweiligen Project Twin weiter.
              </p>
            </div>
            <ArrowRight className="start-card__arrow" />
          </button>

          {/* Karte 2: Neues Projekt starten */}
          <button 
            className="start-card start-card--primary"
            onClick={onNewInput}
          >
            <div className="start-card__icon-wrapper start-card__icon--new">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div className="start-card__content">
              <h3 className="start-card__title">Neues Projekt starten</h3>
              <p className="start-card__description">
                Starte eine neue Analyse oder erstelle einen neuen Project Twin.
              </p>
            </div>
            <ArrowRight className="start-card__arrow" />
          </button>

          {/* Karte 3: Command prüfen */}
          <button 
            className="start-card start-card--primary"
            onClick={onOpenCommand}
          >
            <div className="start-card__icon-wrapper start-card__icon--command">
              <Command className="w-6 h-6" />
            </div>
            <div className="start-card__content">
              <h3 className="start-card__title">Command prüfen</h3>
              <p className="start-card__description">
                Prüfe projektübergreifend kritische Maßnahmen, Blocker und Fristen.
              </p>
            </div>
            <ArrowRight className="start-card__arrow" />
          </button>

          {/* Karte 4: Mit OSION sprechen */}
          <button 
            className="start-card start-card--primary"
            onClick={onOpenChat}
          >
            <div className="start-card__icon-wrapper start-card__icon--chat">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div className="start-card__content">
              <h3 className="start-card__title">Mit OSION sprechen</h3>
              <p className="start-card__description">
                Öffne den Chat für Fragen, Planung und projektübergreifende Steuerung.
              </p>
            </div>
            <ArrowRight className="start-card__arrow" />
          </button>
        </div>
      </section>

      {/* Zone 2: Heute wichtig - Aufmerksamkeitsliste */}
      <section className="start-screen__section">
        <div className="start-screen__section-header">
          <AlertCircle className="w-5 h-5 start-screen__section-icon" />
          <h2 className="start-screen__section-title">Aufmerksamkeitsliste</h2>
          <span className="start-screen__section-badge">
            {criticalItems > 0 ? `${criticalItems} Punkte` : 'Keine'}
          </span>
        </div>
        <p className="start-screen__section-subtitle">
          Diese Punkte brauchen als Nächstes Deine Aufmerksamkeit
        </p>
        
        <div className="attention-list">
          {criticalItems > 0 ? (
            <div className="attention-list__content">
              {twins
                .filter(t => t.analysis?.risks?.some(r => r.severity === 'high') || t.progress?.stage === 'blocked')
                .slice(0, 3)
                .map(twin => (
                  <div 
                    key={twin.id} 
                    className="attention-item"
                    onClick={() => onOpenTwin(twin.id)}
                  >
                    <div className="attention-item__indicator attention-item__indicator--critical" />
                    <div className="attention-item__content">
                      <span className="attention-item__project">{twin.title}</span>
                      <span className="attention-item__issue">
                        {twin.analysis?.risks?.find(r => r.severity === 'high')?.title || 'Projekt blockiert'}
                      </span>
                    </div>
                    <ArrowRight className="attention-item__arrow" />
                  </div>
                ))}
              {criticalItems > 3 && (
                <button 
                  className="attention-list__more"
                  onClick={onOpenCommand}
                >
                  + {criticalItems - 3} weitere Punkte in Command anzeigen
                </button>
              )}
            </div>
          ) : (
            <div className="attention-list__empty">
              <span className="attention-list__empty-icon">✓</span>
              <p>Aktuell braucht kein Punkt Deine direkte Aufmerksamkeit.</p>
            </div>
          )}
        </div>
      </section>

      {/* Zone 3: Direkt weiterarbeiten - Schnellzugriffe */}
      <section className="start-screen__section start-screen__section--quick">
        <h2 className="start-screen__section-title start-screen__section-title--small">
          Direkt weiterarbeiten
        </h2>
        <div className="start-screen__grid start-screen__grid--5">
          <button 
            className="quick-card"
            onClick={() => { /* TODO: Navigate to measures */ }}
          >
            <CheckSquare className="quick-card__icon" />
            <span className="quick-card__label">Maßnahmen</span>
          </button>
          
          <button 
            className="quick-card"
            onClick={() => { /* TODO: Navigate to deadlines */ }}
          >
            <CalendarDays className="quick-card__icon" />
            <span className="quick-card__label">Fristen</span>
          </button>
          
          <button 
            className="quick-card"
            onClick={() => { /* TODO: Navigate to simulation */ }}
          >
            <BrainCircuit className="quick-card__icon" />
            <span className="quick-card__label">Simulation</span>
          </button>
          
          <button 
            className="quick-card"
            onClick={() => { /* TODO: Navigate to agents */ }}
          >
            <Bot className="quick-card__icon" />
            <span className="quick-card__label">Agenten</span>
          </button>
          
          <button 
            className="quick-card"
            onClick={() => { /* TODO: Navigate to memory */ }}
          >
            <Database className="quick-card__icon" />
            <span className="quick-card__label">Memory</span>
          </button>
        </div>
      </section>

      {/* Quick Stats */}
      {hasTwins && (
        <section className="start-screen__stats">
          <div className="stat-card">
            <span className="stat-card__value">{twins.length}</span>
            <span className="stat-card__label">Projekte</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__value">
              {twins.reduce((acc, t) => acc + (t.measures?.length || 0), 0)}
            </span>
            <span className="stat-card__label">Maßnahmen</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__value">
              {twins.reduce((acc, t) => acc + (t.analysis?.risks?.length || 0), 0)}
            </span>
            <span className="stat-card__label">Risiken</span>
          </div>
        </section>
      )}
    </div>
  )
}
