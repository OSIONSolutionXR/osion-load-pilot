import {
  ReactFlow,
  Background,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  User,
  FileText,
  Landmark,
  FileCheck,
  Building2,
  AlertTriangle,
} from 'lucide-react';

// Custom Node Component
interface CustomNodeData {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  status: 'normal' | 'blocked' | 'waiting' | 'warning';
}

function CustomNode({ data }: { data: CustomNodeData }) {
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
    <div className="relative">
      <Handle type="target" position={Position.Top} className="opacity-0" />
      
      <div
        className={`w-[200px] p-4 rounded-xl border ${statusStyles[data.status]} transition-all duration-300 hover:scale-[1.02]`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconStyles[data.status]}`}
          >
            {data.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm truncate">{data.title}</div>
            <div className={`text-xs ${textColors[data.status]}`}>{data.subtitle}</div>
          </div>
        </div>
        
        {showWarning && (
          <div className="absolute -top-2 -right-2">
            <AlertTriangle className="w-4 h-4 text-[#ef4444]" />
          </div>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

interface OrganigramProps {
  variant?: 'compact' | 'full';
}

export default function Organigram({ variant = 'compact' }: OrganigramProps) {
  // Compact variant: 3 nodes
  const compactNodes: Node[] = [
    {
      id: '1',
      type: 'custom',
      position: { x: 0, y: 0 },
      data: {
        icon: <User className="w-5 h-5" />,
        title: 'Steuerberater Müller',
        subtitle: 'Wartet',
        status: 'normal',
      },
    },
    {
      id: '2',
      type: 'custom',
      position: { x: 0, y: 100 },
      data: {
        icon: <FileText className="w-5 h-5" />,
        title: 'BWA',
        subtitle: 'Fehlt',
        status: 'blocked',
      },
    },
    {
      id: '3',
      type: 'custom',
      position: { x: 0, y: 200 },
      data: {
        icon: <Landmark className="w-5 h-5" />,
        title: 'Bank',
        subtitle: 'Prüfung',
        status: 'waiting',
      },
    },
  ];

  // Full variant: 5 nodes
  const fullNodes: Node[] = [
    {
      id: '1',
      type: 'custom',
      position: { x: 0, y: 0 },
      data: {
        icon: <User className="w-5 h-5" />,
        title: 'Steuerberater Müller',
        subtitle: 'Wartet auf Handlung',
        status: 'normal',
      },
    },
    {
      id: '2',
      type: 'custom',
      position: { x: 0, y: 100 },
      data: {
        icon: <FileText className="w-5 h-5" />,
        title: 'BWA',
        subtitle: 'Fehlt - Blockiert',
        status: 'blocked',
      },
    },
    {
      id: '3',
      type: 'custom',
      position: { x: 0, y: 200 },
      data: {
        icon: <Landmark className="w-5 h-5" />,
        title: 'Bankprüfung',
        subtitle: 'Kann nicht beginnen',
        status: 'blocked',
      },
    },
    {
      id: '4',
      type: 'custom',
      position: { x: 0, y: 300 },
      data: {
        icon: <FileCheck className="w-5 h-5" />,
        title: 'Finanzierungszusage',
        subtitle: 'Nicht möglich',
        status: 'waiting',
      },
    },
    {
      id: '5',
      type: 'custom',
      position: { x: 0, y: 400 },
      data: {
        icon: <Building2 className="w-5 h-5" />,
        title: 'Verkäuferentscheidung',
        subtitle: 'Wird gefährdet',
        status: 'warning',
      },
    },
  ];

  const nodes = variant === 'compact' ? compactNodes : fullNodes;

  const edges: Edge[] = nodes.slice(0, -1).map((node, index) => ({
    id: `e${node.id}-${nodes[index + 1].id}`,
    source: node.id,
    target: nodes[index + 1].id,
    type: 'smoothstep',
    animated: nodes[index + 1].data.status === 'blocked',
    style: {
      stroke: nodes[index + 1].data.status === 'blocked' ? '#ef4444' : 'rgba(255,255,255,0.2)',
      strokeWidth: 2,
    },
  }));

  return (
    <div className="w-full h-[320px]" style={{ minHeight: variant === 'full' ? '500px' : '320px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={1}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="rgba(255,255,255,0.03)" gap={20} size={1} />
      </ReactFlow>
    </div>
  );
}
