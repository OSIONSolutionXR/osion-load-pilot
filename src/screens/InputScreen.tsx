import { useState } from 'react'
import { Sparkles, ArrowRight, Users, GitBranch, AlertTriangle, Target, CheckCircle2, X, Loader2 } from 'lucide-react'

interface InputScreenProps {
  onCreateTwin: () => void
  onCancel: () => void
}

export default function InputScreen({ onCreateTwin, onCancel }: InputScreenProps) {
  const [text, setText] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const handleAnalyze = () => {
    if (!text.trim()) return
    setIsAnalyzing(true)
    // Simulate analysis
    setTimeout(() => {
      setIsAnalyzing(false)
      setShowPreview(true)
    }, 1500)
  }

  const handleCreateTwin = () => {
    onCreateTwin()
  }

  return (
    <div className="animate-in space-y-6">
      
      {/* Page Header */}
      <header className="card-glass p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onCancel} className="btn-ghost">
              <X className="w-5 h-5" />
            </button>
            
            <div className="h-8 w-px bg-white/10" />
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-[#ff006e]" />
                <span className="label label-accent">Neuer Input</span>
              </div>
              <h2 className="text-2xl font-bold">Projektlage erfassen</h2>
            </div>
          </div>
        </div>
      </header>

      {!showPreview ? (
        <>
          {/* Input Hero */}
          
          <section className="card-hero p-10 md:p-16">
            <div className="max-w-3xl mx-auto text-center">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[#ff006e]/20 to-[#8338ec]/20 flex items-center justify-center border border-[#ff006e]/30 mb-6 shadow-lg shadow-[#ff006e]/10">
                <Sparkles className="w-9 h-9 text-[#ff006e]" />
              </div>
              
              <h3 className="text-3xl font-bold mb-3">Was ist gerade offen?</h3>
              <p className="text-zinc-400 text-lg mb-8">
                Schreib Deine Projektlage ungeordnet rein. OSION erkennt Projekte, Akteure, Fristen, Blocker und Abhängigkeiten.
              </p>

              <div className="mb-6">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Bank wartet auf BWA, Steuerberater Müller hat noch nicht geliefert, Verkäufer will bis Freitag Rückmeldung, Cityhouse Preise müssen geprüft werden..."
                  className="w-full bg-[#0a0a0c] rounded-2xl p-6 text-lg leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-[#ff006e]/50 transition-all placeholder:text-zinc-600"
                  style={{ minHeight: '200px', border: '1px solid rgba(255,255,255,0.06)' }}
                />
              </div>

              <div className="flex items-center justify-center gap-4">
                <button 
                  onClick={handleAnalyze}
                  disabled={!text.trim() || isAnalyzing}
                  className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed group"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analysiere...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Projektlage analysieren
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
                
                <button onClick={onCancel} className="btn-secondary">
                  Abbrechen
                </button>
              </div>
            </div>
          </section>

          {/* Example */}
          
          <section className="card-glass p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-zinc-500" />
              <span className="text-sm font-medium">Beispiel</span>
            </div>
            
            <div className="p-4 rounded-xl bg-[#0a0a0c] border border-white/5 text-zinc-400 text-sm leading-relaxed">
              „Bank wartet auf BWA, Steuerberater Müller hat noch nicht geliefert, Verkäufer will bis Freitag Rückmeldung, Cityhouse Preise müssen noch geprüft werden. Martin überlegt, ob er das alleine stemmen kann oder Unterstützung braucht. Zeitdruck steigt.“
            </div>
          </section>
        </>
      ) : (
        <>
          {/* Analysis Preview */}
          
          <section className="card-glass p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="font-semibold">Analyse erkannt</span>
              </div>
              
              <button onClick={() => setShowPreview(false)} className="btn-ghost text-sm">
                Neue Eingabe
              </button>
            </div>

            <div className="grid-12 gap-4">
              {/* Erkannte Projekte */}
              
              <div className="col-6">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-[#ff006e]" />
                    <span className="font-semibold text-sm">Erkannte Projekte</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="p-3 rounded-lg bg-white/[0.03]">
                      <div className="font-medium text-sm">Bankfinanzierung KS19</div>
                      <div className="text-xs text-zinc-500">Kredit zur Sanierung sicherstellen</div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/[0.03]">
                      <div className="font-medium text-sm">Cityhouse Preisstrategie</div>
                      <div className="text-xs text-zinc-500">Preise prüfen und entscheiden</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Erkannte Akteure */}
              
              <div className="col-6">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-[#3a86ff]" />
                    <span className="font-semibold text-sm">Erkannte Akteure</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full bg-[#3a86ff]/10 border border-[#3a86ff]/30 text-sm">Steuerberater Müller</span>
                    <span className="px-3 py-1 rounded-full bg-[#3a86ff]/10 border border-[#3a86ff]/30 text-sm">Bank</span>
                    <span className="px-3 py-1 rounded-full bg-[#3a86ff]/10 border border-[#3a86ff]/30 text-sm">Verkäufer</span>
                    <span className="px-3 py-1 rounded-full bg-[#3a86ff]/10 border border-[#3a86ff]/30 text-sm">Martin</span>
                  </div>
                </div>
              </div>

              {/* Erkannte Abhängigkeiten */}
              
              <div className="col-6">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <GitBranch className="w-4 h-4 text-[#8338ec]" />
                    <span className="font-semibold text-sm">Erkannte Abhängigkeiten</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <span className="px-2 py-1 rounded bg-white/5">BWA</span>
                    <ArrowRight className="w-4 h-4 text-zinc-600" />
                    <span className="px-2 py-1 rounded bg-white/5">Bankprüfung</span>
                    <ArrowRight className="w-4 h-4 text-zinc-600" />
                    <span className="px-2 py-1 rounded bg-white/5">Zusage</span>
                    <ArrowRight className="w-4 h-4 text-zinc-600" />
                    <span className="px-2 py-1 rounded bg-white/5">Entscheidung</span>
                  </div>
                </div>
              </div>

              {/* Erkannte Risiken */}
              
              <div className="col-6">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-[#ef4444]" />
                    <span className="font-semibold text-sm">Erkannte Risiken</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                      Bankprüfung bleibt blockiert
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                      Verkäufer wird unsicher
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                      Frist läuft näher
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button onClick={handleCreateTwin} className="btn-primary group">
                <Sparkles className="w-5 h-5" />
                Project Twin erstellen
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
