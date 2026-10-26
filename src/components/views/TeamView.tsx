import React, { useState, useMemo } from 'react';
import { useAegis } from '../../context/AegisContext';
import { Participant, AvailabilityStatus, TacticalGroup } from '../../types';
import { ArmyCharacter3D } from '../common/ArmyCharacter3D';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  Battery,
  Signal,
  Clock,
  Compass,
  Radio,
  Edit3,
  X,
  ArrowUpDown,
} from 'lucide-react';

export const TeamView: React.FC = () => {
  const { participants, participantCheckIn, settings, userProfile, setMapCenter, setSelectedTeammateId, setCurrentView } = useAegis();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'activity' | 'name' | 'battery'>('activity');

  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [statusNoteDraft, setStatusNoteDraft] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);

  const getFreshness = (lastCheckIn: string) => {
    const ageMins = (Date.now() - new Date(lastCheckIn).getTime()) / (60 * 1000);
    if (ageMins <= settings.freshnessThresholds.freshMin) return { label: 'Active Now', color: 'text-[#9FE870] bg-[#9FE870]/10 border-[#9FE870]/20' };
    if (ageMins <= settings.freshnessThresholds.agingMin) return { label: 'Active Recently', color: 'text-[#FFBF69] bg-[#FFBF69]/10 border-[#FFBF69]/20' };
    return { label: 'Needs Check-in', color: 'text-[#FF6464] bg-[#FF6464]/10 border-[#FF6464]/20' };
  };

  // Filter & Sort
  const filteredParticipants = useMemo(() => {
    return participants
      .filter((p) => {
        if (roleFilter !== 'all' && p.role !== roleFilter) return false;
        if (groupFilter !== 'all' && p.group !== groupFilter) return false;
        if (availabilityFilter !== 'all' && p.availability !== availabilityFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchCallsign = p.callsign.toLowerCase().includes(q);
          const matchName = p.name.toLowerCase().includes(q);
          const matchId = p.id.toLowerCase().includes(q);
          if (!matchCallsign && !matchName && !matchId) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'battery') return b.batteryPct - a.batteryPct;
        return new Date(b.lastCheckIn).getTime() - new Date(a.lastCheckIn).getTime();
      });
  }, [participants, roleFilter, groupFilter, availabilityFilter, searchQuery, sortBy]);

  const selectedParticipant = participants.find((p) => p.id === selectedParticipantId);

  const handleManualCheckIn = async (id: string) => {
    await participantCheckIn(id, statusNoteDraft.trim() || undefined);
    setShowStatusModal(false);
    setStatusNoteDraft('');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#17232D] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#8495A5] mb-1">
            <span>TEAM MEMBERS DIRECTORY</span>
            <span>·</span>
            <span>{participants.length} REGISTERED OPERATIVES</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#F3F7FA] font-display flex items-center gap-3">
            <Users className="w-8 h-8 text-[#48DDF2]" />
            Team Members & Availability
          </h1>
          <p className="text-xs text-[#8495A5] mt-1">
            View everyone in your group, check their battery and signal levels, and send a check-in ping.
          </p>
        </div>

        {/* Disclaimer label */}
        <span className="text-xs font-mono font-bold text-[#8495A5] bg-[#111922] px-3.5 py-2 rounded-xl border border-[#17232D]">
          DEMO TEAM PERSONNEL
        </span>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-[#111922] border border-[#17232D] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#8495A5] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, callsign, or ID (e.g. VANGUARD-1, p-01)..."
            className="w-full pl-9 pr-3 py-2 bg-[#080D12] border border-[#17232D] focus:border-[#48DDF2] rounded-lg text-xs text-[#F3F7FA] outline-none"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-[#080D12] border border-[#17232D] text-xs text-[#8495A5] hover:text-[#F3F7FA] rounded-lg px-2.5 py-2 outline-none"
          >
            <option value="all">All Roles</option>
            <option value="Coordinator">Coordinator</option>
            <option value="Team Member">Team Member</option>
            <option value="Observer">Observer</option>
          </select>

          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="bg-[#080D12] border border-[#17232D] text-xs text-[#8495A5] hover:text-[#F3F7FA] rounded-lg px-2.5 py-2 outline-none"
          >
            <option value="all">All Squads</option>
            <option value="Alpha Recon">Alpha Recon</option>
            <option value="Bravo Logistics">Bravo Logistics</option>
            <option value="Delta Medical">Delta Medical</option>
            <option value="Echo Comms">Echo Comms</option>
          </select>

          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="bg-[#080D12] border border-[#17232D] text-xs text-[#8495A5] hover:text-[#F3F7FA] rounded-lg px-2.5 py-2 outline-none"
          >
            <option value="all">All Availability</option>
            <option value="Available">Available</option>
            <option value="On Mission">On Mission</option>
            <option value="Restricted Comms">Restricted Comms</option>
            <option value="Standby">Standby</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#080D12] border border-[#17232D] text-xs text-[#48DDF2] rounded-lg px-2.5 py-2 outline-none font-medium"
          >
            <option value="activity">Sort: Recent Activity</option>
            <option value="name">Sort: Name (A-Z)</option>
            <option value="battery">Sort: Battery Level</option>
          </select>
        </div>
      </div>

      {/* Grid of Operative Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredParticipants.map((p) => {
          const freshness = getFreshness(p.lastCheckIn);
          const isSelected = selectedParticipantId === p.id;

          let statusColor = 'text-[#9FE870] border-[#9FE870]/30 bg-[#9FE870]/10';
          if (p.availability === 'On Mission') statusColor = 'text-[#48DDF2] border-[#48DDF2]/30 bg-[#48DDF2]/10';
          else if (p.availability === 'Restricted Comms') statusColor = 'text-[#FF6464] border-[#FF6464]/30 bg-[#FF6464]/10';
          else if (p.availability === 'Standby') statusColor = 'text-[#FFBF69] border-[#FFBF69]/30 bg-[#FFBF69]/10';

          return (
            <div
              key={p.id}
              onClick={() => setSelectedParticipantId(p.id)}
              className={`p-4 rounded-xl bg-[#111922] border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-[#48DDF2] shadow-[0_0_15px_rgba(72,221,242,0.15)] ring-1 ring-[#48DDF2]'
                  : 'border-[#17232D] hover:border-[#8495A5]/40'
              }`}
            >
              <div>
                {/* Top Call Sign and Badges */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-14 relative shrink-0">
                      <ArmyCharacter3D
                        animationState={p.animationState || 'idle'}
                        uniformColor={p.uniformColor || 'camo_green'}
                        heading={p.heading ?? 0}
                        inEmergency={Boolean(p.inEmergency)}
                        size={48}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-[#8495A5] block">{p.id}</span>
                      <h3 className="text-sm font-black font-display text-[#F3F7FA]">{p.callsign}</h3>
                      <p className="text-xs text-[#8495A5]">{p.name}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${statusColor}`}>
                      {p.availability}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono border ${freshness.color}`}>
                      {freshness.label}
                    </span>
                  </div>
                </div>

                {/* Squad & Role */}
                <div className="text-xs text-[#8495A5] space-x-1.5 mb-2 font-mono flex items-center justify-between">
                  <div>
                    <span className="text-[#48DDF2]">{p.group}</span>
                    <span> · </span>
                    <span>{p.role}</span>
                  </div>
                  <span className="text-[10px] text-[#9FE870] font-bold">
                    State: {(p.animationState || 'idle').toUpperCase()}
                  </span>
                </div>

                {/* Status Note */}
                <p className="text-xs text-[#F3F7FA] bg-[#080D12] p-2.5 rounded-lg border border-[#17232D] leading-relaxed mb-3">
                  “{p.statusNote}”
                </p>
              </div>

              {/* Bottom Telemetry Bar */}
              <div className="pt-3 border-t border-[#17232D] flex items-center justify-between text-xs font-mono text-[#8495A5]">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1" title="Battery Percentage">
                    <Battery className="w-3.5 h-3.5 text-[#9FE870]" />
                    {p.batteryPct}%
                  </span>
                  <span className="flex items-center gap-1" title="Signal Strength">
                    <Signal className="w-3.5 h-3.5 text-[#48DDF2]" />
                    {p.signalDbm} dBm
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMapCenter({ lat: p.lat, lng: p.lng });
                      setSelectedTeammateId(p.id);
                      setCurrentView('map');
                    }}
                    className="px-2.5 py-1 bg-[#17232D] hover:bg-[#48DDF2]/20 text-[#48DDF2] rounded text-[10px] font-bold font-display"
                  >
                    View on Map →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Participant Detail Drawer */}
      {selectedParticipant && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-[#111922] border-l border-[#17232D] shadow-2xl p-6 z-40 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-[#17232D]">
              <div>
                <span className="text-xs font-mono text-[#48DDF2]">{selectedParticipant.id}</span>
                <h2 className="text-lg font-bold text-[#F3F7FA] mt-0.5">
                  {selectedParticipant.callsign}
                </h2>
                <p className="text-xs text-[#8495A5]">{selectedParticipant.name}</p>
              </div>
              <button
                onClick={() => setSelectedParticipantId(null)}
                className="text-[#8495A5] hover:text-[#F3F7FA] p-1 rounded hover:bg-[#17232D]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tactical Classification */}
            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded bg-[#080D12] border border-[#17232D] flex justify-between">
                <span className="text-[#8495A5]">ASSIGNED SQUAD:</span>
                <span className="text-[#F3F7FA] font-bold">{selectedParticipant.group}</span>
              </div>
              <div className="p-2.5 rounded bg-[#080D12] border border-[#17232D] flex justify-between">
                <span className="text-[#8495A5]">OPERATIVE ROLE:</span>
                <span className="text-[#48DDF2] font-bold">{selectedParticipant.role}</span>
              </div>
              <div className="p-2.5 rounded bg-[#080D12] border border-[#17232D] flex justify-between">
                <span className="text-[#8495A5]">AVAILABILITY:</span>
                <span className="text-[#9FE870] font-bold">{selectedParticipant.availability}</span>
              </div>
            </div>

            {/* Coordinates */}
            <div className="p-3.5 rounded-lg bg-[#080D12] border border-[#17232D] space-y-2 text-xs font-mono">
              <span className="text-[#8495A5] text-[10px] block">TACTICAL GRID POSITION</span>
              <div className="text-[#48DDF2] font-bold">
                SECTOR {selectedParticipant.gridCoordinates.sector} // E: {selectedParticipant.gridCoordinates.easting} · N: {selectedParticipant.gridCoordinates.northing}
              </div>
              <div className="text-[#8495A5] text-[11px]">
                Elevation: {selectedParticipant.gridCoordinates.elevationM} meters ASL
              </div>
            </div>

            {/* Live Field Notes */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#8495A5]">CURRENT SITUATION NOTE</span>
              <p className="text-xs text-[#F3F7FA] bg-[#080D12] p-3 rounded-lg border border-[#17232D] leading-relaxed">
                {selectedParticipant.statusNote}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-6 border-t border-[#17232D] space-y-2">
            <button
              onClick={() => {
                setStatusNoteDraft(selectedParticipant.statusNote);
                setShowStatusModal(true);
              }}
              className="w-full py-2.5 bg-[#48DDF2] hover:bg-[#48DDF2]/90 text-[#080D12] font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Transmit Check-In / Update Status
            </button>
            <button
              onClick={() => setSelectedParticipantId(null)}
              className="w-full py-2 bg-[#17232D] hover:bg-[#1f2f3d] text-xs text-[#8495A5] hover:text-[#F3F7FA] rounded-lg transition-colors"
            >
              Close Drawer
            </button>
          </div>
        </div>
      )}

      {/* Manual Check-in Modal */}
      {showStatusModal && selectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#111922] border border-[#17232D] rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#17232D]">
              <h4 className="text-sm font-semibold text-[#F3F7FA] flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#9FE870]" />
                Simulate Check-In: {selectedParticipant.callsign}
              </h4>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-[#8495A5] hover:text-[#F3F7FA]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-[#8495A5]">
                Updating telemetry records will refresh this operative's data freshness timestamp and broadcast a position ping to the local mesh.
              </p>

              <div>
                <label className="text-[#8495A5] block mb-1">Field Situation Report / Note</label>
                <textarea
                  rows={3}
                  value={statusNoteDraft}
                  onChange={(e) => setStatusNoteDraft(e.target.value)}
                  className="w-full px-3 py-2 bg-[#080D12] border border-[#17232D] focus:border-[#48DDF2] rounded-lg text-[#F3F7FA] outline-none resize-none"
                  placeholder="Enter updated field observation..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#17232D]">
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="px-3 py-1.5 text-xs text-[#8495A5] hover:text-[#F3F7FA] bg-[#17232D] rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleManualCheckIn(selectedParticipant.id)}
                className="px-4 py-1.5 text-xs font-semibold text-[#080D12] bg-[#9FE870] hover:bg-[#9FE870]/90 rounded"
              >
                Broadcast Check-In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
