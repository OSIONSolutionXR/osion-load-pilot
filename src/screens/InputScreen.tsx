import { useState } from 'react'
import { Sparkles, X, Send, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react'

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
      <header className="card-glass p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onCancel} className="btn-ghost group">
              <X className="w-5 h-5 transition-transform group-hover:scale-110" />
              Abbrechen
            </button>
            
            <div className="h-8 w-px bg-white/10" />
            
            <div>
              <span className="label label-accent mb-1 inline-block">Neues Projekt</span>
              <h2 className="text-2xl font-bold">Projekt eingeben</h2>
            </div>
          </div>

          <button 
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Analysieren
            <Send className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Input */}
      <div className="card-hero p-10 md:p-16">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[#ff006e]/20 to-[#8338ec]/20 flex items-center justify-center border border-[#ff006e]/30 mb-6 shadow-lg shadow-[#ff006e]/10">
            <Sparkles className="w-9 h-9 text-[#ff006e]" />
          </div>
          <h3 className="text-3xl font-bold mb-3">Beschreibe deine Situation</h3>
          <p className="text-zinc-400 text-lg">Unstrukturierter Text wird automatisch analysiert</p>
        </div>

        <div className="mb-8">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Martin wartet auf eine Bankfinanzierung für KS19. Bank braucht Unterlagen zur Prüfung. Steuerberater muss BWA liefern..."
            className="w-full bg-[#0a0a0c] rounded-2xl p-6 text-lg leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-[#ff006e]/50 transition-all placeholder:text-zinc-600"
            style={{ minHeight: '240px', border: '1px solid rgba(255,255,255,0.06)' }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500">{text.length} Zeichen</span>
          
          <div className="flex gap-3">
            <button onClick={onCancel} className="btn-secondary">
              Abbrechen
            </button>
            <button 
              onClick={handleSubmit}
              disabled={!text.trim()}
              className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed group"
            >
              Analysieren
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-8 grid-12">
        <div className="col-4">
          <TipCard 
            number="01" 
            title="Natürlich beschreiben" 
            description="Schreiben Sie frei, wie Sie es jemandem erzählen würden" 
          />
        </div>
        <div className="col-4">
          <TipCard 
            number="02" 
            title="Wichtige Details" 
            description="Nennen Sie Personen, Fristen und Abhängigkeiten" 
          />
        </div>
        <div className="col-4">
          <TipCard 
            number="03" 
            title="KI-Analyse" 
            description="Das System erkennt automatisch Struktur und Actoren" 
          />
        </div>
      </div>

      {/* Features Preview */}
      <section className="mt-8 card-glass p-8">
        <div className="text-center mb-8">
          <h4 className="text-lg font-semibold mb-2">Was passiert danach?</h4>
          <p className="text-zinc-500">Die KI erstellt automatisch Ihren Project Twin</p>
        </div>
        
        <div className="grid-12">
          <div className="col-3 text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-[#ff006e]/10 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6 text-[#ff006e]" />
            </div>
            <div className="font-medium mb-1">Actoren identifizieren</div>
            <div className="text-sm text-zinc-500">Personen und Rollen erkannt</div>
          </div>
          <div className="col-3 text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-[#8338ec]/10 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-[#8338ec]" />
            </div>
            <div className="font-medium mb-1">Abhängigkeiten mappen</div>
            <div className="text-sm text-zinc-500">Flow automatisch generiert</div>
          </div>
          <div className="col-3 text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-amber-500/10 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <div className="font-medium mb-1">Risiken erkennen</div>
            <div className="text-sm text-zinc-500">Blocker und Gefahren identifiziert</div>
          </div>
          <div className="col-3 text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3">
              <Send className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="font-medium mb-1">Nächsten Schritt empfehlen</div>
            <div className="text-sm text-zinc-500">Priorisierte Handlungsempfehlung</div>
          </div>
        </div>
      </section>
    </div>
  )
}

function TipCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="card-focus p-6">
      <div className="text-4xl font-bold text-zinc-800/50 mb-4">{number}</div>
      <h4 className="text-base font-semibold mb-2">{title}</h4>
      <p className="text-sm text-zinc-500">{description}</p>
    </div>
  )
}
