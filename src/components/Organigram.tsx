import { User, FileText, Landmark, Shield, AlertTriangle, X, ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';

interface ProcessStep {
  id: string;
  icon: ReactNode;
  title: string;
  subtitle: string;
  status: 'complete' | 'blocked' | 'waiting' | 'pending';
  step: number;
}

interface OrganigramProps {
  variant?: 'compact' | 'full';
}

export default function Organigram({ variant: _variant = 'compact' }: OrganigramProps) {
  void _variant; // Reserved for future use
  const steps: ProcessStep[] = [
    {
      id: '1',
      step: 1,
      icon: <User className="w-5 h-5" />,
      title: 'Steuerberater\nMüller',
      subtitle: 'Auslöser',
      status: 'complete',
    },
    {
      id: '2',
      step: 2,
      icon: <FileText className="w-5 h-5" />,
      title: 'BWA',
      subtitle: 'Fehlt',
      status: 'blocked',
    },
    {
      id: '3',
      step: 3,
      icon: <Landmark className="w-5 h-5" />,
      title: 'Bank',
      subtitle: 'Prüfung wartet',
      status: 'waiting',
    },
    {
      id: '4',
      step: 4,
      icon: <Shield className="w-5 h-5" />,
      title: 'Zusage',
      subtitle: 'Finanzierung',
      status: 'pending',
    },
  ];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center">
          <svg className="w-5 h-5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">Erkannte Abhängigkeit</h3>
          <div className="flex items-center gap-2 mt-1">
            <svg className="w-3 h-3 text-violet-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span className="text-sm text-violet-300">Simulation</span>
          </div>
        </div>
      </div>

      {/* Process Flow */}
      <div className="flex items-start justify-center gap-4 mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start">
            <ProcessCard data={step} />
            {index < steps.length - 1 && (
              <ProcessConnector 
                _fromStatus={step.status}
                _toStatus={steps[index + 1].status}
                isBlocked={step.status === 'blocked'}
              />
            )}
          </div>
        ))}
      </div>

      {/* Risk Warning */}
      <div className="rounded-xl border border-red-500/30 bg-gradient-to-r from-red-500/10 to-red-900/5 p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="font-medium text-white mb-1">Wenn heute nichts passiert:</p>
            <p className="text-red-300">
              <span className="text-red-400 font-medium">Risiko steigt</span>, Bankprüfung bleibt <span className="text-red-400 font-medium">blockiert</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProcessCard({ data }: { data: ProcessStep }) {
  const isBlocked = data.status === 'blocked';
  const isComplete = data.status === 'complete';
  const isWaiting = data.status === 'waiting';

  return (
    <div className="flex flex-col items-center w-[140px]">
      {/* Step Label */}
      <div className={`mb-3 px-3 py-1 rounded-full text-xs font-medium tracking-wider uppercase ${
        isBlocked ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-zinc-800 text-zinc-500'
      }`}>
        Schritt {data.step}
      </div>

      {/* Card */}
      <div className={`relative w-full p-4 rounded-xl border transition-all duration-300 ${
        isBlocked
          ? 'bg-gradient-to-br from-red-500/10 to-red-900/5 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.15)]'
          : isComplete
            ? 'bg-gradient-to-br from-blue-500/10 to-blue-900/5 border-blue-500/30'
            : 'bg-zinc-900/50 border-zinc-700/50'
      }`}>
        {/* Status Badge */}
        {isComplete && (
          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
        {isBlocked && (
          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
            <AlertTriangle className="w-3 h-3 text-white" />
          </div>
        )}

        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 overflow-hidden ${
          isBlocked
            ? 'bg-red-500/20 text-red-400'
            : isComplete
              ? 'bg-blue-500/20 text-blue-400'
              : isWaiting
                ? 'bg-zinc-700/50 text-zinc-400'
                : 'bg-zinc-800/50 text-zinc-500'
        }`}>
          <div className="w-5 h-5 flex items-center justify-center">
            {data.icon}
          </div>
        </div>

        {/* Title */}
        <h4 className={`font-semibold text-sm whitespace-pre-line mb-1 ${
          isBlocked ? 'text-white' : 'text-zinc-200'
        }`}>
          {data.title}
        </h4>

        {/* Subtitle */}
        <p className={`text-xs ${
          isBlocked ? 'text-red-400' : isComplete ? 'text-blue-400' : isWaiting ? 'text-violet-400' : 'text-zinc-500'
        }`}>
          {data.subtitle}
        </p>
      </div>
    </div>
  );
}

function ProcessConnector({
  _fromStatus,
  _toStatus,
  isBlocked
}: {
  _fromStatus: string;
  _toStatus: string;
  isBlocked: boolean;
}) {
  void _fromStatus; void _toStatus; // Reserved for future directional styling
  return (
    <div className="flex flex-col items-center justify-center w-16 mt-12">
      {/* Connector Line with Arrow */}
      <div className="relative flex items-center w-full">
        {/* Line */}
        <div className={`flex-1 h-0.5 ${
          isBlocked
            ? 'bg-gradient-to-r from-blue-500/60 via-red-500/60 to-zinc-600/30'
            : 'bg-gradient-to-r from-zinc-600 to-zinc-600/30'
        }`}
        style={{
          backgroundImage: isBlocked
            ? 'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(239,68,68,0.5) 4px, rgba(239,68,68,0.5) 8px)'
            : 'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(100,100,100,0.5) 4px, rgba(100,100,100,0.5) 8px)'
        }} />

        {/* Arrow */}
        <ArrowRight className={`w-4 h-4 -ml-1 ${
          isBlocked ? 'text-zinc-600' : 'text-zinc-600'
        }`} />

        {/* Blocked X indicator */}
        {isBlocked && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center">
            <X className="w-3 h-3 text-red-400" />
          </div>
        )}
      </div>
    </div>
  );
}
