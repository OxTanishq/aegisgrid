import React, { useState } from 'react';
import { useAegis } from '../../context/AegisContext';
import { DemoRole } from '../../types';
import { Shield, Radio, Eye, Check, ArrowRight, Database, WifiOff, Users2 } from 'lucide-react';

interface LandingModalProps {
  onDismiss: () => void;
}

export const LandingModal: React.FC<LandingModalProps> = ({ onDismiss }) => {
  const { userProfile, updateUserProfile, setCurrentView, teams } = useAegis();
  const [selectedRole, setSelectedRole] = useState<DemoRole>(userProfile.role || 'Coordinator');
  const [callsignInput, setCallsignInput] = useState(userProfile.callsign);
  const [nameInput, setNameInput] = useState(userProfile.displayName);
  const [selectedGroup, setSelectedGroup] = useState(userProfile.assignedGroup || 'Alpha Recon Squad');

  const roles: {
    id: DemoRole;
    title: string;
    description: string;
    badge: string;
    icon: React.ElementType;
  }[] = [
    {
      id: 'Coordinator',
      title: 'Team Leader',
      description: 'Full team leader controls: assign tasks, create squad channels, broadcast alerts, and direct check-ins.',
      badge: 'Leader Controls',
      icon: Shield,
    },
    {
      id: 'Team Member',
      title: 'Squad Member',
      description: 'Teammate console: talk with your squad, report your status, send check-in pings, and complete tasks.',
      badge: 'Teammate Access',
      icon: Radio,
    },
    {
      id: 'Observer',
      title: 'Viewer / Guest',
      description: 'Read-only access: view team activity, read messages, inspect the live map, and download mission reports.',
      badge: 'Viewer Mode',
      icon: Eye,
    },
  ];

  const handleLaunch = async (targetView?: 'map' | 'overview') => {
    await updateUserProfile({
      role: selectedRole,
      callsign: callsignInput.trim() || 'AEGIS-LEAD',
      displayName: nameInput.trim() || 'Roland Hayes',
      assignedGroup: selectedGroup,
      initialLaunchComplete: true,
    });
    if (targetView) {
      setCurrentView(targetView);
    }
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080D12]/95 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#111922] border border-[#17232D] rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* Header HUD Banner */}
        <div className="relative bg-[#080D12] p-6 sm:p-8 border-b border-[#17232D] overflow-hidden">
          <div className="absolute inset-0 bg-tactical-grid opacity-40 pointer-events-none" />
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full border border-[#48DDF2]/15 pointer-events-none" />
          <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full border border-[#9FE870]/15 pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#17232D] border border-[#48DDF2]/30 flex items-center justify-center text-[#48DDF2] shadow-lg">
                  <Shield className="w-6 h-6 text-[#9FE870]" />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-[#F3F7FA] font-display">
                    AEGIS GRID
                  </h1>
                  <p className="text-xs font-mono font-bold text-[#48DDF2]">
                    OFFLINE TEAM COORDINATION & CHAT
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[11px] font-bold bg-[#FFBF69]/15 text-[#FFBF69] border border-[#FFBF69]/30">
                SAFE DEMO ENVIRONMENT
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#8495A5] max-w-lg leading-relaxed">
              “Connected Intelligence. Resilient Coordination.” — Talk with your team and keep situational awareness even without internet. Every message and task is saved directly on your device.
            </p>

            {/* Offline indicators */}
            <div className="flex items-center gap-4 text-xs font-mono text-[#8495A5] pt-1">
              <span className="flex items-center gap-1.5 text-[#9FE870] font-bold">
                <Database className="w-3.5 h-3.5" />
                Saves Offline Automatically
              </span>
              <span className="flex items-center gap-1.5 text-[#48DDF2] font-bold">
                <WifiOff className="w-3.5 h-3.5" />
                Zero Internet Needed
              </span>
            </div>
          </div>
        </div>

        {/* Profile & Role Configuration */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-3">
            <label className="text-xs font-bold text-[#8495A5] tracking-wider uppercase font-display">
              1. Choose Your Role
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {roles.map((r) => {
                const Icon = r.icon;
                const isSelected = selectedRole === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRole(r.id)}
                    className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#17232D] border-[#48DDF2] shadow-[0_0_15px_rgba(72,221,242,0.18)]'
                        : 'bg-[#080D12]/70 border-[#17232D] hover:border-[#8495A5]/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-[#48DDF2]' : 'text-[#8495A5]'}`} />
                        {isSelected && <Check className="w-4 h-4 text-[#9FE870]" />}
                      </div>
                      <h4 className="text-xs font-black text-[#F3F7FA] font-display mb-1">{r.title}</h4>
                      <p className="text-[11px] text-[#8495A5] leading-snug">{r.description}</p>
                    </div>
                    <span className="mt-3 text-[10px] font-mono font-bold text-[#48DDF2] block">{r.badge}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Callsign and Name input */}
          <div className="space-y-3 pt-1">
            <label className="text-xs font-bold text-[#8495A5] tracking-wider uppercase font-display">
              2. Your Identity & Squad
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#8495A5]">Your Full Name</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full px-3 py-2 bg-[#080D12] border border-[#17232D] focus:border-[#48DDF2] rounded-xl text-xs text-[#F3F7FA] outline-none transition-colors"
                  placeholder="e.g. Roland Hayes"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#8495A5]">Radio Callsign (Short Tag)</label>
                <input
                  type="text"
                  value={callsignInput}
                  onChange={(e) => setCallsignInput(e.target.value)}
                  className="w-full px-3 py-2 bg-[#080D12] border border-[#17232D] focus:border-[#48DDF2] rounded-xl text-xs font-mono font-bold text-[#9FE870] outline-none transition-colors"
                  placeholder="e.g. AEGIS-LEAD"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#8495A5]">Default Squad / Team</label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full px-3 py-2 bg-[#080D12] border border-[#17232D] text-xs text-[#F3F7FA] rounded-xl outline-none"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#17232D]">
            <p className="text-[11px] text-[#8495A5] text-center sm:text-left">
              Fictional demonstration data. Messages save on your device.
            </p>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleLaunch('map')}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-[#17232D] hover:bg-[#17232D] text-xs font-bold text-[#8495A5] hover:text-[#F3F7FA] transition-colors"
              >
                Open Live Map
              </button>

              <button
                type="button"
                onClick={() => handleLaunch('overview')}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#48DDF2] hover:bg-[#48DDF2]/90 text-xs font-black text-[#080D12] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#48DDF2]/15"
              >
                Launch Dashboard
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
