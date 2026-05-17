import { useState } from 'react'
import { ArrowRight, Sparkles, Cpu, Network, Target } from 'lucide-react'

interface InputScreenProps {
  onSubmit: () => void
}

export default function InputScreen({ onSubmit }: InputScreenProps) {
  const [text, setText] = useState('')

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit()
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="text-center py-12 relative">
        {/* Floating Elements */}
        <div className="absolute top-4 left-1/4 animate-float opacity-60">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00d4ff]/20 to-[#00d4ff]/5 border border-[#00d4ff]/30 flex items-center justify-center">
            <Cpu className="w-8 h-8 text-[#00d4ff]" />
          </div>
        </div>
        <div className="absolute top-8 right-1/4 animate-float opacity-60" style={{ animationDelay: '0.5s' }}>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ff3366]/20 to-[#ff3366]/5 border border-[#ff3366]/30 flex items-center justify-center">
            <Network className="w-8 h-8 text-[#ff3366]" />
          </div>
        </div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 animate-float opacity-60" style={{ animationDelay: '1s' }}>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8b5cf6]/20 to-[#8b5cf6]/5 border border-[#8b5cf6]/30 flex items-center justify-center">
            <Target className="w-8 h-8 text-[#8b5cf6]" />
          </div>
        </div>

        {/* Logo */}
        <div className="inline-block mb-6 relative">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#ff3366] via-[#ff6b8a] to-[#ffb3c1] flex items-center justify-center shadow-2xl shadow-[#ff3366]/30">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#00d4ff] flex items-center justify-center text-white font-bold text-sm animate-pulse">
            β
          </div>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
          Load Pilot
        </h1>

        <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Project Twin System für überladene Unternehmer
        </p>

        {/* Feature Pills */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <div className="tag tag-cyan flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00d4ff]" />
            Simple Input
          </div>
          <div className="text-zinc-600">→</div>
          <div className="tag tag-accent flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#ff3366]" />
            Deep Simulation
          </div>
          <div className="text-zinc-600">→</div>
          <div className="tag flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#8b5cf6]" />
            One Next Move
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="max-w-3xl mx-auto">
        <div className="glass-card p-8 relative overflow-hidden group">
          {/* Decorative Gradient Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ff3366] via-[#8b5cf6] to-[#00d4ff]" />

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff3366]/20 to-[#ff3366]/5 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#ff3366]" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Beschreibe dein Projekt</h2>
              <p className="text-sm text-zinc-500">Unstrukturierter Text wird automatisch analysiert</p>
            </div>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Martin wartet auf eine Bankfinanzierung für KS19. Bank braucht Unterlagen zur Prüfung. Steuerberater muss BWA liefern..."
            className="input-glow min-h-[180px] resize-none mb-6 font-mono text-sm leading-relaxed"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-500">
              <div className="w-2 h-2 rounded-full bg-[#10b981]" />
              <span className="text-sm font-mono">{text.length} Zeichen</span>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!text.trim()}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Analysieren</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto">
        <FeatureCard
          icon={<Cpu className="w-6 h-6" />}
          number="01"
          title="Erkennung"
          description="KI-gestützte Extraktion von Actoren, Abhängigkeiten und Risiken"
          color="cyan"
        />
        <FeatureCard
          icon={<Network className="w-6 h-6" />}
          number="02"
          title="Simulation"
          description="Interaktiver Dependency Graph mit kritischen Pfaden"
          color="purple"
        />
        <FeatureCard
          icon={<Target className="w-6 h-6" />}
          number="03"
          title="Next Move"
          description="Priorisierte Empfehlung basierend auf Impact und Dringlichkeit"
          color="red"
        />
      </div>

      {/* Footer */}
      <div className="text-center pt-8">
        <p className="text-sm text-zinc-600 font-mono">
          OSION Solution XR • {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}

function FeatureCard({ icon, number, title, description, color }: { icon: React.ReactNode; number: string; title: string; description: string; color: 'cyan' | 'purple' | 'red' }) {
  const colorClasses = {
    cyan: 'from-[#00d4ff]/20 to-[#00d4ff]/5 border-[#00d4ff]/30 text-[#00d4ff]',
    purple: 'from-[#8b5cf6]/20 to-[#8b5cf6]/5 border-[#8b5cf6]/30 text-[#8b5cf6]',
    red: 'from-[#ff3366]/20 to-[#ff3366]/5 border-[#ff3366]/30 text-[#ff3366]',
  }

  return (
    <div className="glass-card p-6 group hover:scale-[1.02] transition-transform duration-300">
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <div className="text-4xl font-bold text-zinc-700 mb-2">{number}</div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
    </div>
  )
}
