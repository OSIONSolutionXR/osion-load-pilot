import { useState } from 'react'
import { Sparkles, X, Send, ArrowRight, Users, GitBranch, AlertTriangle } from 'lucide-react'

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
    <div className="animate-in space-y-6">
      
      {/* Header */}
      <header className="card-glass p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onCancel} className="btn-ghost group">
              <X className="w-5 h-5" />
              Abbrechen
            </button>
            
            <div className="h-8 w-px bg-white/10" />
            
            <div>
              <span className="label label-accent mb-1 inline-block">Neues Projekt</span>
              <h2 className="text-xl font-bold">Projekt eingeben</h2>
            </div>
          </div>

          <button 
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="btn-primary disabled:opacity-40"
          >
            Analysieren
            <Send className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Input Card */}
      <section className="card-hero p-8 md:p-12">
        <div className="max-w-3xl mx-auto">
          {/* Icon + Headline */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#ff006e]/20 to-[#8338ec]/20 flex items-center justify-center border border-[#ff006e]/30 mb-4">
              <Sparkles className="w-7 h-7 text-[#ff006e]" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Beschreibe deine Situation</h3>
            <p className="text-zinc-400">Unstrukturierter Text wird automatisch analysiert</p>
          </div>

          {/* Textarea */}
          <div className="mb-6">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Martin wartet auf eine Bankfinanzierung für KS19. Bank braucht Unterlagen zur Prüfung. Steuerberater muss BWA liefern..."
              className="w-full bg-[#0a0a0c] rounded-2xl p-6 text-base leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-[#ff006e]/50 transition-all placeholder:text-zinc-600"
              style={{ minHeight: '160px', border: '1px solid rgba(255,255,255,0.06)' }}
            />
          </div>

          {/* Counter + Buttons */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500">{text.length} Zeichen</span>
            
            <div className="flex gap-3">
              <button onClick={onCancel} className="btn-secondary">
                Abbrechen
              </button>
              <button 
                onClick={handleSubmit}
                disabled={!text.trim()}
                className="btn-primary disabled:opacity-40 group"
              >
                Analysieren
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Horizontal Process Flow */}
      <section className="card-glass p-6">
        <div className="text-center mb-6">
          <h4 className="text-base font-semibold">Was passiert danach?</h4>
          <p className="text-sm text-zinc-500">Die KI erstellt automatisch Ihren Project Twin</p>
        </div>
        
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <ProcessStep 
            icon={<Users className="w-5 h-5" />}
            title="Actoren"
            subtitle="Identifizieren"
            color="magenta"
          />
          
          <ArrowRight className="w-5 h-5 text-zinc-600" />
          
          <ProcessStep 
            icon={<GitBranch className="w-5 h-5" />}
            title="Flow"
            subtitle="Mapping"
            color="purple"
          />
          
          <ArrowRight className="w-5 h-5 text-zinc-600" />
          
          <ProcessStep 
            icon={<AlertTriangle className="w-5 h-5" />}
            title="Risiken"
            subtitle="Erkennen"
            color="amber"
          />
          
          <ArrowRight className="w-5 h-5 text-zinc-600" />
          
          <ProcessStep 
            icon={<Send className="w-5 h-5" />}
            title="Empfehlung"
            subtitle="Priorisieren"
            color="emerald"
          />
        </div>
      </section>

      {/* Tips Grid */}
      <section>
        <div className="grid-12">
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
      </section>
    </div>
  )
}

function ProcessStep({ icon, title, subtitle, color }: { 
  icon: React.ReactNode
  title: string
  subtitle: string
  color: 'magenta' | 'purple' | 'amber' | 'emerald'
}) {
  const colors = {
    magenta: 'from-[#ff006e]/20 to-[#ff006e]/5 border-[#ff006e]/30 text-[#ff006e]',
    purple: 'from-[#8338ec]/20 to-[#8338ec]/5 border-[#8338ec]/30 text-[#8338ec]',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-500',
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-500'
  }

  return (
    <div className={`flex items-center gap-3 px-5 py-4 rounded-xl bg-gradient-to-br ${colors[color]} border backdrop-blur-sm min-w-[160px]`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-black/20`}>
        {icon}
      </div>
      <div>
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-xs opacity-80">{subtitle}</div>
      </div>
    </div>
  )
}

function TipCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="card-focus p-5 h-full">
      <div className="text-3xl font-bold text-zinc-700 mb-3">{number}</div>
      <h4 className="text-base font-semibold mb-2">{title}</h4>
      <p className="text-sm text-zinc-500">{description}</p>
    </div>
  )
}
