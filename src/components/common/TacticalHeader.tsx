import React from 'react';
import { useAegis, AppView } from '../../context/AegisContext';
import { PWAInstallButton } from './PWAInstallButton';
import { Menu, ShieldAlert, UserCheck } from 'lucide-react';

interface TacticalHeaderProps {
  onOpenMobileMenu: () => void;
}

export const TacticalHeader: React.FC<TacticalHeaderProps> = ({ onOpenMobileMenu }) => {
  const { currentView, setCurrentView, userProfile, updateUserProfile, alerts, triggerEmergencySOS } = useAegis();

  const unresolvedAlertCount = alerts.filter((a) => !a.resolved).length;

  const navLinks: { id: AppView; label: string }[] = [
    { id: 'overview', label: 'Dashboard' },
    { id: 'map', label: 'Live Map' },
    { id: 'comms', label: 'Team Chat' },
    { id: 'community', label: 'Squads' },
    { id: 'tasks', label: 'Tasks' },
  ];

  return (
    <header className="flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5 bg-[#080D12] border-b border-[#17232D] sticky top-0 z-30 select-none">
      {/* Zone 1: Single text element wordmark with modern bold styling */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 text-[#8495A5] hover:text-[#F3F7FA] rounded hover:bg-[#17232D] transition-colors"
          aria-label="Open tactical menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          onClick={() => setCurrentView('overview')}
          className="text-xl font-black tracking-tight text-[#F3F7FA] hover:text-[#48DDF2] transition-colors whitespace-nowrap shrink-0 flex items-center gap-2.5 text-left font-display"
        >
          <span className="w-3 h-3 rounded-md bg-[#9FE870] inline-block shadow-[0_0_12px_rgba(159,232,112,0.8)]" />
          AEGIS GRID
        </button>
      </div>

      {/* Zone 2: 4–5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#8495A5]">
        {navLinks.map((link) => (
          <button
            key={link.id}
            onClick={() => setCurrentView(link.id)}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentView === link.id
                ? 'text-[#F3F7FA] font-semibold border-b-2 border-[#48DDF2]'
                : 'hover:text-[#F3F7FA]'
            }`}
          >
            {link.label}
          </button>
        ))}

        {/* Quick jump to Alerts if unread */}
        {unresolvedAlertCount > 0 && (
          <button
            onClick={() => setCurrentView('alerts')}
            className={`whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors py-1 ${
              currentView === 'alerts' ? 'text-[#FFBF69] font-semibold border-b-2 border-[#FFBF69]' : 'text-[#FFBF69] hover:text-[#FFBF69]/80'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-[#FFBF69]" />
            <span>Alerts ({unresolvedAlertCount})</span>
          </button>
        )}
      </nav>

      {/* Zone 3: Emergency SOS & Role Identifier */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Prominent Quick SOS Button */}
        <button
          onClick={() => triggerEmergencySOS()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF6464] hover:bg-[#ff4d4d] text-[#080D12] font-black font-display text-xs rounded-xl shadow-lg shadow-[#FF6464]/30 transition-all hover:scale-105 active:scale-95"
        >
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>SOS</span>
        </button>

        <PWAInstallButton />

        {/* Role Switcher Pill/Button */}
        <div className="relative group">
          <button
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#111922] border border-[#17232D] hover:border-[#48DDF2]/40 text-xs font-mono transition-colors"
            title="Click to toggle or cycle role"
            onClick={() => {
              const nextRole =
                userProfile.role === 'Coordinator'
                  ? 'Team Member'
                  : userProfile.role === 'Team Member'
                  ? 'Observer'
                  : 'Coordinator';
              updateUserProfile({ role: nextRole });
            }}
          >
            <UserCheck className="w-3.5 h-3.5 text-[#48DDF2]" />
            <span className="text-[#F3F7FA] font-medium hidden sm:inline">{userProfile.callsign}</span>
            <span className="text-[#8495A5] text-[10px]">[{userProfile.role}]</span>
          </button>
        </div>
      </div>
    </header>
  );
};
