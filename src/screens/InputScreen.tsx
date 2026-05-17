import { useState } from 'react'
import { ArrowRight, Sparkles, X } from 'lucide-react'

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
    <div className="max-w-3xl mx-auto animate-fade-in-up">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <span className="label label-accent mb-2 inline-block">New Project</span>
          <h2 className="text-headline">Projekt eingeben</h2>
        </div>
        <button onClick={onCancel} className="btn-ghost">
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Input Card */}
      <div className="card-primary card-glow p-8 md:p-12">
        {/* Label */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff006e]/20 to-[#8338ec]/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#ff006e]" />
          </div>
          <div>
            <h3 className="text-subhead">Beschreibe deine Situation</h3>
            <p className="text-caption">Unstrukturierter Text wird automatisch analysiert</p>
          </div>
        </div>

        {/* Textarea */}
        <div className="mb-6">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Martin wartet auf eine Bankfinanzierung für KS19. Bank braucht Unterlagen zur Prüfung. Steuerberater muss BWA liefern..."
            className="w-full bg-[#0a0a0c] rounded-2xl p-6 text-base leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-[#ff006e]/50 transition-all"
            style={{ minHeight: '200px', border: '1px solid rgba(255,255,255,0.08)' }}
          />
        </div>

        {/* Character Count */}
        <div className="flex items-center justify-between">
          <span className="text-caption">{text.length} Zeichen</span>
          
          <div className="flex gap-3">
            <button onClick={onCancel} className="btn-secondary">
              Abbrechen
            </button>
            <button 
              onClick={handleSubmit}
              disabled={!text.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Analysieren
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        <TipCard number="01" title="Natürlich beschreiben" description="Schreiben Sie frei, wie Sie es jemandem erzählen würden" />
        <TipCard number="02" title="Wichtige Details" description="Nennen Sie Personen, Fristen und Abhängigkeiten" />
        <TipCard number="03" title="KI-Analyse" description="Das System erkennt automatisch Struktur und Actoren" />
      </div>
    </div>
  )
}

function TipCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="card-secondary p-5">
      <div className="text-3xl font-bold text-zinc-700 mb-3">{number}</div>
      <h4 className="text-sm font-semibold mb-1">{title}</h4>
      <p className="text-xs text-zinc-500 leading-relaxed">{description}</p>
    </div>
  )
}
