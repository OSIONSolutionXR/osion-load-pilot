import { User, FileText, Landmark, AlertTriangle, ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';

interface OrgNodeData {
  id: string;
  icon: ReactNode;
  title: string;
  subtitle: string;
  status: 'normal' | 'blocked' | 'waiting' | 'active';
  step: number;
}

interface OrganigramProps {
  variant?: 'compact' | 'full';
}

export default function Organigram({ variant = 'compact' }: OrganigramProps) {
  const compactNodes: OrgNodeData[] = [
    {
      id: '1',
      step: 1,
      icon: <User className="w-5 h-5" />,
      title: 'Steuerberater Müller',
      subtitle: 'Auslöser',
      status: 'active',
    },
    {
      id: '2',
      step: 2,
      icon: <FileText className="w-5 h-5" />,
      title: 'BWA',
      subtitle: 'Fehlt → Blockiert',
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
  ];

  const fullNodes: OrgNodeData[] = [
    {
      id: '1',
      step: 1,
      icon: <User className="w-5 h-5" />,
      title: 'Steuerberater Müller',
      subtitle: 'Auslöser',
      status: 'active',
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
      subtitle: 'Prüfung blockiert',
      status: 'blocked',
    },
    {
      id: '4',
      step: 4,
      icon: <Landmark className="w-5 h-5" />,
      title: 'Finanzierung',
      subtitle: 'Nicht möglich',
      status: 'waiting',
    },
  ];

  const nodes = variant === 'compact' ? compactNodes : fullNodes;

  return (
    <div className="w-full">
      {/* Horizontal Process Flow */}
      <div className="flex items-center justify-center">
        {nodes.map((node, index) => (
          <div key={node.id} className="flex items-center">
            <ProcessNode data={node} />
            {index < nodes.length - 1 && (
              <ProcessConnector fromStatus={node.status} toStatus={nodes[index + 1].status} />
            )}
          </div>
        ))}
      </div>

      {/* Legend below */}
      <div className="mt-6 flex justify-center gap-6 text-xs">
        <LegendItem color="bg-emerald-500" label="Aktiv" />
        <LegendItem color="bg-[#ef4444]" label="Blockiert" />
        <LegendItem color="bg-zinc-500" label="Wartend" />
      </div>
    </div>
  );
}

function ProcessNode({ data }: { data: OrgNodeData }) {
  const statusRingColors = {
    normal: 'border-zinc-500/30',
    blocked: 'border-[#ef4444] shadow-[0_0_20px_rgba(239,68,68,0.3)]',
    waiting: 'border-zinc-600/30',
    active: 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]',
  };

  const statusBgColors = {
    normal: 'bg-zinc-800/50',
    blocked: 'bg-[#ef4444]/10',
    waiting: 'bg-zinc-800/30',
    active: 'bg-emerald-500/10',
  };

  const statusIconColors = {
    normal: 'text-zinc-400',
    blocked: 'text-[#ef4444]',
    waiting: 'text-zinc-500',
    active: 'text-emerald-400',
  };

  const statusTextColors = {
    normal: 'text-zinc-400',
    blocked: 'text-[#ef4444]',
    waiting: 'text-zinc-500',
    active: 'text-emerald-400',
  };

  const isBlocked = data.status === 'blocked';
  const isActive = data.status === 'active';

  return (
    <div className="flex flex-col items-center group">
      {/* Step Number */}
      <div className={`mb-3 text-xs font-medium ${statusTextColors[data.status]}`}>
        Schritt {data.step}
      </div>

      {/* Node Card */}
      <div className="relative">
        {/* Status Ring */}
        <div 
          className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${statusRingColors[data.status]} ${statusBgColors[data.status]} group-hover:scale-110`}
        >
          <div className={statusIconColors[data.status]}>
            {data.icon}
          </div>
        </div>

        {/* Warning Badge */}
        {isBlocked && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#ef4444] flex items-center justify-center animate-pulse">
            <AlertTriangle className="w-3 h-3 text-white" />
          </div>
        )}

        {/* Active Badge */}
        {isActive && (
          <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        )}
      </div>

      {/* Label */}
      <div className="mt-3 text-center max-w-[120px]">
        <div className="font-semibold text-sm text-white truncate">{data.title}</div>
        <div className={`text-xs ${statusTextColors[data.status]} mt-0.5`}>{data.subtitle}</div>
      </div>
    </div>
  );
}

function ProcessConnector({ fromStatus, toStatus }: { fromStatus: string; toStatus: string }) {
  const isBlocked = fromStatus === 'blocked' || toStatus === 'blocked';
  const isFlowing = fromStatus === 'active' && !isBlocked;

  return (
    <div className="flex flex-col items-center mx-2">
      {/* Horizontal Line with Arrow */}
      <div className="relative flex items-center w-12">
        {/* Line */}
        <div 
          className={`h-0.5 flex-1 transition-all duration-500 ${
            isBlocked 
              ? 'bg-gradient-to-r from-[#ef4444]/80 to-[#ef4444]/40' 
              : isFlowing
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-500/60'
                : 'bg-gradient-to-r from-zinc-600 to-zinc-700'
          }`}
        />
        
        {/* Arrow */}
        <ArrowRight 
          className={`w-4 h-4 -ml-0.5 transition-all duration-300 ${
            isBlocked 
              ? 'text-[#ef4444]' 
              : isFlowing 
                ? 'text-emerald-400' 
                : 'text-zinc-600'
          }`}
        />

        {/* Flow Animation for blocked state */}
        {isBlocked && (
          <div className="absolute inset-0 overflow-hidden">
            <div className="w-2 h-full bg-gradient-to-r from-transparent via-[#ef4444]/40 to-transparent animate-pulse" />
          </div>
        )}
      </div>

      {/* Status Text below connector */}
      <div className="mt-1 text-[10px] text-zinc-600 font-medium">
        {isBlocked ? '→ blockiert' : isFlowing ? '→ fließt' : '→ wartet'}
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-zinc-500">{label}</span>
    </div>
  );
}
