import { useState } from 'react'
import { Sparkles, X, Send } from 'lucide-react'

interface InputScreenProps {
  onSubmit: () => void
  onCancel: () => void
}

export default function InputScreen({ onSubmit, onCancel }: InputScreenProps) {
  const [text, setText] = useState('')

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit()
    }
  }

  return (
    <div className="animate-in">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <span className="label-premium label-accent mb-3 inline-block">Neues Projekt</span>
          <h2 className="section-headline">Projekt eingeben</h2>
        </div>
        <button onClick={onCancel} className="btn-outline px-4 py-2">
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Main Input Card */}
      <div className="card-premium p-8 md:p-12">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#ff006e]/20 to-[#8338ec]/20 flex items-center justify-center border border-[#ff006e]/30 mb-6">
            <Sparkles className="w-7 h-7 text-[#ff006e]" />
          </div>
          <h3 className="text-2xl font-bold mb-3">Beschreibe deine Situation</h3>
          <p className="text-zinc-500">Unstrukturierter Text wird automatisch analysiert</p>
        </div>

        <div className="mb-8">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Martin wartet auf eine Bankfinanzierung für KS19. Bank braucht Unterlagen zur Prüfung. Steuerberater muss BWA liefern..."
            className="w-full bg-[#0a0a0c] rounded-2xl p-6 text-lg leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-[#ff006e]/50 transition-all placeholder:text-zinc-600"
            style={{ minHeight: '220px', border: '1px solid rgba(255,255,255,0.08)' }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500">{text.length} Zeichen</span>
          
          <div className="flex gap-3">
            <button onClick={onCancel} className="btn-outline">
              Abbrechen
            </button>
            <button 
              onClick={handleSubmit}
              disabled={!text.trim()}
              className="btn-glow disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Analysieren
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        <TipCard 
          number="01" 
          title="Natürlich beschreiben" 
          description="Schreiben Sie frei, wie Sie es jemandem erzählen würden" 
        />
        <TipCard 
          number="02" 
          title="Wichtige Details" 
          description="Nennen Sie Personen, Fristen und Abhängigkeiten" 
        />
        <TipCard 
          number="03" 
          title="KI-Analyse" 
          description="Das System erkennt automatisch Struktur und Actoren" 
        />
      </div>
    </div>
  )
}

function TipCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="card-dark p-6">
      <div className="text-4xl font-bold text-zinc-800 mb-4">{number}</div>
      <h4 className="text-base font-semibold mb-2">{title}</h4>
      <p className="text-sm text-zinc-500">{description}</p>
    </div>
  )
}
