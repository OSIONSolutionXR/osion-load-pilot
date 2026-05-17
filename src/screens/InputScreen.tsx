import { useState } from 'react'
import { ClipboardPaste, Sparkles, ArrowRight } from 'lucide-react'

interface InputScreenProps {
  onSubmit: (text: string) => void
}

export default function InputScreen({ onSubmit }: InputScreenProps) {
  const [text, setText] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Demo-Text für den Goldfall
  const demoText = `Martin wartet auf eine Bankfinanzierung für KS19.
Bank braucht Unterlagen zur Prüfung.
Steuerberater muss BWA liefern, hat aber noch nicht gemeldet.
Verkäufer will bis Freitag Rückmeldung, sonst zieht er sich zurück.
Martin hat bereits 50 Stunden Wochenlast und kommt nicht dazu, das alles zu koordinieren.`

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText()
      setText(clipboardText)
    } catch {
      // Fallback: Demo-Text einfügen
      setText(demoText)
    }
  }

  const handleAnalyze = () => {
    if (!text.trim()) return
    setIsAnalyzing(true)
    // Simuliere Analyse-Delay
    setTimeout(() => {
      setIsAnalyzing(false)
      onSubmit(text)
    }, 800)
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Was beschäftigt dich gerade?
        </h2>
        <p className="text-gray-400 max-w-lg mx-auto">
          Beschreibe deine Situation in freiem Text. Load Pilot erkennt Projekte, 
          Actoren, Abhängigkeiten und zeigt dir den besten nächsten Schritt.
        </p>
      </div>

      {/* Input Area */}
      <div className="glass-panel p-1">
        <div className="bg-osion-black/50 rounded-xl p-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Zum Beispiel: Ich warte auf die Bank, aber mein Steuerberater hat die Unterlagen noch nicht geschickt..."
            className="w-full h-48 bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none text-base leading-relaxed"
          />
          
          <div className="flex items-center justify-between pt-4 border-t border-osion-surfaceLight">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePaste}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-osion-surface rounded-lg transition-colors"
              >
                <ClipboardPaste className="w-4 h-4" />
                Einfügen
              </button>
              <button
                onClick={() => setText(demoText)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-osion-surface rounded-lg transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Demo
              </button>
            </div>
            
            <span className="text-xs text-gray-500">
              {text.length} Zeichen
            </span>
          </div>
        </div>
      </div>

      {/* Analyze Button */}
      <div className="flex justify-center">
        <button
          onClick={handleAnalyze}
          disabled={!text.trim() || isAnalyzing}
          className="btn-primary flex items-center gap-3 text-lg px-8 py-4"
        >
          {isAnalyzing ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analysiere...
            </>
          ) : (
            <>
              Analysieren
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>

      {/* Tips */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <TipCard
          icon="🎯"
          title="Simple Input"
          description="Schreib frei, wie du denkst"
        />
        <TipCard
          icon="🧠"
          title="Deep Simulation"
          description="KI analysiert Struktur & Risiken"
        />
        <TipCard
          icon="⚡"
          title="One Next Move"
          description="Konkreter nächster Schritt"
        />
      </div>
    </div>
  )
}

interface TipCardProps {
  icon: string
  title: string
  description: string
}

function TipCard({ icon, title, description }: TipCardProps) {
  return (
    <div className="glass-panel p-4">
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className="font-semibold text-sm mb-1">{title}</h3>
      <p className="text-xs text-gray-400">{description}</p>
    </div>
  )
}
