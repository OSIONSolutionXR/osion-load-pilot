import { Layers, Plus, Clock, AlertTriangle, Target } from 'lucide-react'

const projects = [
  {
    id: '1',
    name: 'Bankfinanzierung KS19',
    goal: 'Kredit zur Sanierung von KS19 sicherstellen',
    status: 'blocked',
    loadScore: 8.0,
    openActions: 1,
    risks: 3
  },
  {
    id: '2', 
    name: 'Cityhouse Preisstrategie',
    goal: 'Preise prüfen und entscheiden',
    status: 'active',
    loadScore: 5.5,
    openActions: 2,
    risks: 1
  }
]

export default function ProjectsScreen() {
  return (
    <div className="animate-in space-y-6">
      
      {/* Page Header */}
      <header className="card-glass p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#ff006e]/10 flex items-center justify-center border border-[#ff006e]/30">
              <Layers className="w-5 h-5 text-[#ff006e]" />
            </div>
            
            <div>
              <span className="label label-accent mb-1 inline-block">Projekte</span>
              <h2 className="text-2xl font-bold">Projektwelten</h2>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-2xl font-bold">{projects.length}</div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider">Aktive Projekte</div>
            </div>
          </div>
        </div>
      </header>

      {/* Projects Grid */}
      <div className="grid-12 gap-6">
        {projects.map(project => (
          <div key={project.id} className="col-6">
            <div className="card-focus p-6 group cursor-pointer hover:border-white/10 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {project.status === 'blocked' ? (
                      <span className="label label-blocked">Blockiert</span>
                    ) : (
                      <span className="label">Aktiv</span>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-bold mb-1 group-hover:text-white transition-colors">{project.name}</h3>
                  <p className="text-sm text-zinc-500">{project.goal}</p>
                </div>
                
                <div className="text-right">
                  <div className={`text-2xl font-bold ${project.status === 'blocked' ? 'text-[#ef4444]' : 'gradient-text'}`}>
                    {project.loadScore.toFixed(1)}
                  </div>
                  <div className="text-xs text-zinc-500">Last</div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <Clock className="w-4 h-4" />
                  {project.openActions} offen
                </div>
                
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <AlertTriangle className="w-4 h-4" />
                  {project.risks} Risiken
                </div>
                
                <button className="ml-auto btn-ghost text-sm">
                  <Target className="w-4 h-4" />
                  Öffnen
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add New Card */}
        <div className="col-6">
          <div className="card-glass p-6 border-dashed border-white/10 flex flex-col items-center justify-center text-center min-h-[200px] cursor-pointer hover:border-white/20 hover:bg-white/[0.02] transition-all">
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-3">
              <Plus className="w-6 h-6 text-zinc-500" />
            </div>
            <div className="font-semibold text-zinc-400">Neues Projekt erfassen</div>
            <div className="text-sm text-zinc-600">Über Input-Seite</div>
          </div>
        </div>
      </div>
    </div>
  )
}
