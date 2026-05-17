import { useState } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'

interface InputScreenProps {
  onSubmit: () => void
}

export default function InputScreen({ onSubmit }: InputScreenProps) {
  const [text, setText] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit()
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12">
        <div className="inline-block mb-6">
          <div className="w-20 h-20 bg-black flex items-center justify-center border-2 border-black shadow-[6px_6px_0px_0px_#dc2626]">
            <span className="text-white font-mono font-bold text-4xl">⚡</span>
          </div>
        </div>
        
        <h1 className="font-mono font-bold text-4xl md:text-5xl mb-4 tracking-tight">
          LOAD PILOT
        </h1>
        
        <p className="font-mono text-gray-500 text-lg max-w-xl mx-auto">
          Project Twin System für überladene Unternehmer
        </p>
        
        <div className="flex items-center justify-center gap-4 mt-6">
          <span className="tag">SIMPLE INPUT</span>
          <span className="text-gray-400">→</span>
          <span className="tag-filled bg-osion-red">DEEP SIMULATION</span>
          <span className="text-gray-400">→</span>
          <span className="tag">ONE NEXT MOVE</span>
        </div>
      </div>

      {/* Input Card */}
      <div className="card max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-osion-red" />
          <span className="font-mono text-sm text-gray-500">BESCHREIBE DEIN PROJEKT</span>
        </div>
        
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Martin wartet auf eine Bankfinanzierung für KS19. Bank braucht Unterlagen zur Prüfung. Steuerberater muss BWA liefern..."
          className="input-mono min-h-[160px] resize-none mb-4"
        />
        
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-gray-400">
            {text.length} Zeichen
          </span>
          
          <button 
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="btn-primary flex items-center gap-2"
          >
            ANALYSIEREN
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
        <FeatureCard 
          number="01"
          title="Erkennung"
          description="Automatische Extraktion von Actoren, Abhängigkeiten und Risiken"
        />
        <FeatureCard 
          number="02"
          title="Simulation"
          description="Visualisierung des Dependency Graphs mit kritischen Pfaden"
        />
        <FeatureCard 
          number="03"
          title="Next Move"
          description="Genau eine empfohlene Aktion basierend auf Impact und Dringlichkeit"
        />
      </div>

      {/* Footer */}
      <div className="text-center pt-8 border-t-2 border-gray-100">
        <p className="font-mono text-xs text-gray-400">
          OSION Solution XR • {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}

function FeatureCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="card hover:border-osion-red">
      <div className="font-mono text-3xl font-bold text-gray-200 mb-2">{number}</div>
      <h3 className="font-mono font-bold mb-2">{title}</h3>
      <p className="font-mono text-xs text-gray-500 leading-relaxed">{description}</p>
    </div>
  )
}
