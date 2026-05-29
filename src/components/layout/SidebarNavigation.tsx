import { useState, useEffect } from 'react';
import {
  Command,
  Home,
  FolderKanban,
  PlusCircle,
  CheckSquare,
  CalendarDays,
  BrainCircuit,
  Bot,
  Settings,
  Database,
  ChevronLeft,
  ChevronRight,
  Zap,
  MessageCircle
} from 'lucide-react';

type ViewId = 'start' | 'command' | 'chat' | 'chatSelect' | 'chatGeneral' | 'chatProject' | 'chatProjectPicker' | 'projects' | 'input' | 'measures' | 'deadlines' | 'simulation' | 'agents' | 'memory' | 'settings' | 'twin';

interface NavSection {
  label: string;
  items: { id: ViewId; label: string; icon: React.ElementType }[];
}

const navSections: NavSection[] = [
  {
    label: 'Steuerung',
    items: [
      { id: 'start', label: 'Start', icon: Home },
      { id: 'command', label: 'Command', icon: Command },
      { id: 'chat', label: 'Chat', icon: MessageCircle },
      { id: 'projects', label: 'Projekte', icon: FolderKanban },
      { id: 'input', label: 'Input', icon: PlusCircle },
    ],
  },
  {
    label: 'Arbeit',
    items: [
      { id: 'measures', label: 'Maßnahmen', icon: CheckSquare },
      { id: 'deadlines', label: 'Fristen', icon: CalendarDays },
      { id: 'simulation', label: 'Simulation', icon: BrainCircuit },
      { id: 'agents', label: 'Agenten', icon: Bot },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'memory', label: 'Memory', icon: Database },
    ],
  },
];

interface SidebarNavigationProps {
  activeView: ViewId;
  onNavigate: (view: ViewId) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export default function SidebarNavigation({
  activeView,
  onNavigate,
  collapsed,
  onToggleCollapsed,
}: SidebarNavigationProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [activeView]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile overlay - improved with backdrop blur */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-200 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile menu button - improved touch target */}
      <button
        type="button"
        className="lp-mobile-menu-button"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'Menü schließen' : 'Menü öffnen'}
        aria-expanded={mobileOpen}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {mobileOpen ? (
            <path d="M18 6L6 18M6 6l12 12" />
          ) : (
            <path d="M3 12h18M3 6h18M3 18h18" />
          )}
        </svg>
      </button>

      {/* Sidebar */}
      <aside 
        className={`lp-sidebar ${mobileOpen ? 'is-mobile-open' : ''} ${collapsed ? 'is-collapsed' : ''}`}
        aria-label="Hauptnavigation"
      >
        {/* Top section */}
        <div className="lp-sidebar__top">
          <div className="lp-sidebar__logo">
            <Zap className="w-5 h-5" />
          </div>

          {!collapsed && (
            <div className="lp-sidebar__brand">
              <div className="lp-sidebar__brand-title">Load Pilot</div>
              <div className="lp-sidebar__brand-subtitle">Project Twin System</div>
            </div>
          )}

          <button
            type="button"
            className="lp-sidebar__collapse"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? 'Navigation ausfahren' : 'Navigation einfahren'}
            title={collapsed ? 'Ausfahren' : 'Einfahren'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Scrollable navigation */}
        <div className="lp-sidebar__scroll">
          {navSections.map((section) => (
            <div className="lp-sidebar__section" key={section.label}>
              <div className="lp-sidebar__section-label">{section.label}</div>

              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id || 
                  (item.id === 'chat' && ['chatSelect', 'chatGeneral', 'chatProject', 'chatProjectPicker'].includes(activeView));

                return (
                  <button
                    type="button"
                    key={item.id}
                    className={`lp-sidebar__item ${isActive ? 'is-active' : ''}`}
                    onClick={() => onNavigate(item.id)}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="lp-sidebar__item-icon">
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className="lp-sidebar__item-text">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom section */}
        <div className="lp-sidebar__bottom">
          <button
            type="button"
            className={`lp-sidebar__item ${activeView === 'settings' ? 'is-active' : ''}`}
            onClick={() => onNavigate('settings')}
            title={collapsed ? 'Einstellungen' : undefined}
          >
            <span className="lp-sidebar__item-icon">
              <Settings className="w-5 h-5" />
            </span>
            <span className="lp-sidebar__item-text">Einstellungen</span>
          </button>
        </div>
      </aside>
    </>
  );
}
