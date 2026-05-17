import { User, FileText, Landmark, FileCheck, Building2, AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';

interface OrgNodeData {
  id: string;
  icon: ReactNode;
  title: string;
  subtitle: string;
  status: 'normal' | 'blocked' | 'waiting' | 'warning';
}

interface OrganigramProps {
  variant?: 'compact' | 'full';
}

export default function Organigram({ variant = 'compact' }: OrganigramProps) {
  const compactNodes: OrgNodeData[] = [
    {
      id: '1',
      icon: <User className="w-5 h-5" />,
      title: 'Steuerberater Müller',
      subtitle: 'Wartet',
      status: 'normal',
    },
    {
      id: '2',
      icon: <FileText className="w-5 h-5" />,
      title: 'BWA',
      subtitle: 'Fehlt',
      status: 'blocked',
    },
    {
      id: '3',
      icon: <Landmark className="w-5 h-5" />,
      title: 'Bank',
      subtitle: 'Prüfung',
      status: 'waiting',
    },
  ];

  const fullNodes: OrgNodeData[] = [
    {
      id: '1',
      icon: <User className="w-5 h-5" />,
      title: 'Steuerberater Müller',
      subtitle: 'Wartet auf Handlung',
      status: 'normal',
    },
    {
      id: '2',
      icon: <FileText className="w-5 h-5" />,
      title: 'BWA',
      subtitle: 'Fehlt - Blockiert',
      status: 'blocked',
    },
    {
      id: '3',
      icon: <Landmark className="w-5 h-5" />,
      title: 'Bankprüfung',
      subtitle: 'Kann nicht beginnen',
      status: 'blocked',
    },
    {
      id: '4',
      icon: <FileCheck className="w-5 h-5" />,
      title: 'Finanzierungszusage',
      subtitle: 'Nicht möglich',
      status: 'waiting',
    },
    {
      id: '5',
      icon: <Building2 className="w-5 h-5" />,
      title: 'Verkäuferentscheidung',
      subtitle: 'Wird gefährdet',
      status: 'warning',
    },
  ];

  const nodes = variant === 'compact' ? compactNodes : fullNodes;

  return (
    <div className="w-full py-4">
      {nodes.map((node, index) => (
        <div key={node.id} className="flex flex-col items-center">
          <NodeCard data={node} />
          {index < nodes.length - 1 && <Connector fromStatus={node.status} toStatus={nodes[index + 1].status} />}
        </div>
      ))}
    </div>
  );
}

function NodeCard({ data }: { data: OrgNodeData }) {
  const statusStyles = {
    normal: 'border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02]',
    blocked: 'border-[#ef4444]/50 bg-gradient-to-br from-[#ef4444]/15 to-[#ef4444]/5 shadow-[0_0_30px_rgba(239,68,68,0.15)]',
    waiting: 'border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02]',
    warning: 'border-amber-500/50 bg-gradient-to-br from-amber-500/15 to-amber-500/5',
  };

  const iconStyles = {
    normal: 'bg-white/5 text-zinc-400',
    blocked: 'bg-[#ef4444]/20 text-[#ef4444]',
    waiting: 'bg-white/5 text-zinc-400',
    warning: 'bg-amber-500/20 text-amber-400',
  };

  const textColors = {
    normal: 'text-zinc-500',
    blocked: 'text-[#ef4444]',
    waiting: 'text-zinc-500',
    warning: 'text-amber-400',
  };

  const showWarning = data.status === 'blocked' || data.status === 'warning';

  return (
    <div className="relative w-full max-w-[220px]">
      <div
        className={`p-4 rounded-xl border ${statusStyles[data.status]} ${
          data.status === 'blocked' ? 'animate-pulse' : ''
        } transition-all duration-300 hover:scale-[1.02]`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconStyles[data.status]}`}>
            {data.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm truncate">{data.title}</div>
            <div className={`text-xs ${textColors[data.status]}`}>{data.subtitle}</div>
          </div>
        </div>
      </div>
      
      {showWarning && (
        <div className="absolute -top-2 -right-2">
          <AlertTriangle className="w-4 h-4 text-[#ef4444]" />
        </div>
      )}
    </div>
  );
}

function Connector({ fromStatus, toStatus }: { fromStatus: string; toStatus: string }) {
  const isBlocked = fromStatus === 'blocked' || toStatus === 'blocked';
  
  return (
    <div className="flex flex-col items-center py-2">
      {/* Line */}
      <div 
        className={`w-0.5 h-8 ${
          isBlocked 
            ? 'bg-gradient-to-b from-[#ef4444]/60 to-[#ef4444]/20' 
            : 'bg-gradient-to-b from-white/20 to-white/5'
        }`} 
      />
      {/* Arrow head using CSS border trick */}
      <div 
        className={`w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent -mt-0.5 ${
          isBlocked ? 'border-t-[#ef4444]/60' : 'border-t-white/20'
        }`}
      />
    </div>
  );
}
