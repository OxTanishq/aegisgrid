import React from 'react';
import { useAegis, AppView } from '../../context/AegisContext';
import {
  LayoutDashboard,
  MapPin,
  MessageSquare,
  Users,
  Users2,
  CheckSquare,
  AlertTriangle,
  BarChart3,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Database,
  X,
} from 'lucide-react';

interface TacticalSidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const TacticalSidebar: React.FC<TacticalSidebarProps> = ({
  isMobileOpen,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { currentView, setCurrentView, alerts, tasks, messages, syncQueue, teams } = useAegis();

  const unreadAlerts = alerts.filter((a) => !a.read && !a.resolved).length;
  const pendingTasks = tasks.filter((t) => t.status === 'Open' || t.status === 'In Progress').length;
  const queuedSyncItems = syncQueue.length;

  const navigationItems: {
    id: AppView;
    label: string;
    icon: React.ElementType;
    badge?: number;
    badgeColor?: string;
  }[] = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'map', label: 'Live Map', icon: MapPin },
    {
      id: 'comms',
      label: 'Team Chat',
      icon: MessageSquare,
      badge: queuedSyncItems > 0 ? queuedSyncItems : undefined,
      badgeColor: 'text-[#FFBF69]',
    },
    {
      id: 'community',
      label: 'Squads & Community',
      icon: Users2,
      badge: teams.length,
      badgeColor: 'text-[#9FE870]',
    },
    { id: 'team', label: 'Team Members', icon: Users },
    {
      id: 'tasks',
      label: 'Task Board',
      icon: CheckSquare,
      badge: pendingTasks > 0 ? pendingTasks : undefined,
      badgeColor: 'text-[#48DDF2]',
    },
    {
      id: 'alerts',
      label: 'Safety Alerts',
      icon: AlertTriangle,
      badge: unreadAlerts > 0 ? unreadAlerts : undefined,
      badgeColor: 'text-[#FF6464]',
    },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'reports', label: 'Reports & Export', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (view: AppView) => {
    setCurrentView(view);
    onCloseMobile();
  };

  const sidebarContent = (
    <aside
      className={`h-full bg-[#080D12] border-r border-[#17232D] flex flex-col justify-between transition-all duration-200 select-none ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Top Section */}
      <div>
        {/* Navigation list */}
        <div className="py-3 px-2 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left relative ${
                  isActive
                    ? 'bg-[#17232D] text-[#F3F7FA] font-black border-l-3 border-[#48DDF2] shadow-sm'
                    : 'text-[#8495A5] hover:text-[#F3F7FA] hover:bg-[#111922]'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-[#48DDF2]' : 'text-[#8495A5]'
                  }`}
                />
                {!isCollapsed && (
                  <span className="truncate flex-1 font-display tracking-tight text-xs">
                    {item.label}
                  </span>
                )}
                {!isCollapsed && item.badge !== undefined && (
                  <span
                    className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#111922] ${
                      item.badgeColor || 'text-[#8495A5]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {isCollapsed && item.badge !== undefined && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF6464]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="p-3 border-t border-[#17232D] space-y-2">
        {!isCollapsed && (
          <div className="px-2.5 py-2 rounded-xl bg-[#111922] border border-[#17232D] text-[11px] font-mono text-[#8495A5] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#9FE870]" />
              OFFLINE STORAGE
            </span>
            <span className="text-[#9FE870] font-bold">READY</span>
          </div>
        )}

        {/* Desktop collapse toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex w-full items-center justify-center p-2 text-[#8495A5] hover:text-[#F3F7FA] hover:bg-[#111922] rounded-lg transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:block shrink-0">{sidebarContent}</div>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[80vw] h-full z-10 flex flex-col bg-[#080D12]">
            <div className="p-4 border-b border-[#17232D] flex items-center justify-between">
              <span className="text-sm font-black text-[#F3F7FA] font-display">AEGIS GRID MENU</span>
              <button
                onClick={onCloseMobile}
                className="p-1 text-[#8495A5] hover:text-[#F3F7FA]"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{sidebarContent}</div>
          </div>
        </div>
      )}
    </>
  );
};
