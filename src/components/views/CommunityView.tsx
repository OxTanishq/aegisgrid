import React, { useState } from 'react';
import { useAegis } from '../../context/AegisContext';
import { DemoRole } from '../../types';
import {
  Users2,
  Plus,
  MessageSquare,
  Shield,
  UserPlus,
  Check,
  Radio,
  ArrowRight,
  Sparkles,
  Heart,
  X,
  Compass,
} from 'lucide-react';

export const CommunityView: React.FC = () => {
  const {
    teams,
    participants,
    userProfile,
    joinTeam,
    registerTeam,
    registerTeamMember,
    setCurrentView,
  } = useAegis();

  // Modals
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [targetTeamName, setTargetTeamName] = useState<string>('');

  // Create Team form state
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamMotto, setNewTeamMotto] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [newTeamColor, setNewTeamColor] = useState('#9FE870');

  // Add Member form state
  const [memberCallsign, setMemberCallsign] = useState('');
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState<DemoRole>('Team Member');
  const [memberSquad, setMemberSquad] = useState(teams[0]?.name || 'Alpha Recon Squad');
  const [memberStatusNote, setMemberStatusNote] = useState('');

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    const channelId = `team-${newTeamName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    await registerTeam({
      name: newTeamName.trim(),
      description: newTeamDescription.trim() || 'Custom registered team community.',
      motto: newTeamMotto.trim() || 'Working together and staying safe.',
      leaderCallsign: userProfile.callsign,
      channelId,
      color: newTeamColor,
    });

    setNewTeamName('');
    setNewTeamMotto('');
    setNewTeamDescription('');
    setShowCreateTeamModal(false);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberCallsign.trim() || !memberName.trim()) return;

    await registerTeamMember({
      callsign: memberCallsign.trim().toUpperCase(),
      name: memberName.trim(),
      role: memberRole,
      group: memberSquad,
      availability: 'Available',
      statusNote: memberStatusNote.trim() || 'Ready and connected to team channel.',
    });

    setMemberCallsign('');
    setMemberName('');
    setMemberStatusNote('');
    setShowAddMemberModal(false);
  };

  const handleOpenAddMemberForTeam = (teamName: string) => {
    setMemberSquad(teamName);
    setShowAddMemberModal(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#17232D] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#8495A5] mb-1">
            <span>TEAM DIRECTORY & CHAT COMMUNITIES</span>
            <span>·</span>
            <span>{teams.length} REGISTERED SQUADS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#F3F7FA] font-display flex items-center gap-3">
            <Users2 className="w-8 h-8 text-[#9FE870]" />
            Team Community & Squad Registration
          </h1>
          <p className="text-xs text-[#8495A5] mt-1 max-w-2xl leading-relaxed">
            Register your team, invite fellow teammates, and talk with everyone in your group. All messages are saved safely on your device so everyone can see them anytime.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowAddMemberModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#17232D] hover:bg-[#1f2f3d] text-xs font-bold text-[#48DDF2] border border-[#48DDF2]/30 transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Register Teammate
          </button>
          <button
            onClick={() => setShowCreateTeamModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#9FE870] hover:bg-[#9FE870]/90 text-xs font-black text-[#080D12] transition-colors shadow-md"
          >
            <Plus className="w-4 h-4" />
            Create New Team
          </button>
        </div>
      </div>

      {/* Current User Active Squad Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#111922] border border-[#48DDF2]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#17232D] border border-[#48DDF2]/40 flex items-center justify-center text-[#48DDF2] shadow-inner">
            <Shield className="w-6 h-6 text-[#9FE870]" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold tracking-wider text-[#48DDF2] uppercase block">
              YOUR REGISTERED TEAM
            </span>
            <h3 className="text-lg font-black text-[#F3F7FA] font-display">
              {userProfile.assignedGroup}
            </h3>
            <p className="text-xs text-[#8495A5]">
              You are logged in as <strong className="text-[#9FE870]">{userProfile.displayName}</strong> ({userProfile.callsign})
            </p>
          </div>
        </div>

        <button
          onClick={() => setCurrentView('comms')}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#48DDF2] hover:bg-[#48DDF2]/90 text-[#080D12] font-black text-xs transition-colors shadow-md"
        >
          <MessageSquare className="w-4 h-4" />
          Open Team Chat Room
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid of Team Communities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {teams.map((team) => {
          const isMyTeam = userProfile.assignedGroup === team.name;
          const teamMembers = participants.filter(
            (p) => p.group.toLowerCase() === team.name.toLowerCase() || p.group.includes(team.name.split(' ')[0])
          );

          return (
            <div
              key={team.id}
              className={`p-5 rounded-2xl bg-[#111922] border transition-all flex flex-col justify-between ${
                isMyTeam
                  ? 'border-[#48DDF2] shadow-[0_0_20px_rgba(72,221,242,0.12)] ring-1 ring-[#48DDF2]/50'
                  : 'border-[#17232D] hover:border-[#8495A5]/40'
              }`}
            >
              <div className="space-y-3">
                {/* Team Top Strip */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="w-3 h-3 rounded-full inline-block"
                        style={{ backgroundColor: team.color }}
                      />
                      <span className="text-xs font-mono font-bold text-[#8495A5]">
                        {teamMembers.length} Members Registered
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-[#F3F7FA] font-display">
                      {team.name}
                    </h3>
                  </div>

                  {isMyTeam ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-[#9FE870]/15 text-[#9FE870] border border-[#9FE870]/30">
                      <Check className="w-3.5 h-3.5" />
                      Your Team
                    </span>
                  ) : (
                    <button
                      onClick={() => joinTeam(team.id)}
                      className="px-3 py-1 rounded-lg bg-[#17232D] hover:bg-[#1f2f3d] text-xs font-mono text-[#48DDF2] border border-[#48DDF2]/20 hover:border-[#48DDF2]/50 transition-colors"
                    >
                      Join Team
                    </button>
                  )}
                </div>

                {/* Motto & Description */}
                <p className="text-xs text-[#8495A5] leading-relaxed">
                  {team.description}
                </p>

                <div className="p-2.5 rounded-lg bg-[#080D12] border border-[#17232D] text-xs font-mono text-[#F3F7FA] flex items-center justify-between">
                  <span className="text-[#8495A5]">Team Motto:</span>
                  <span className="text-[#9FE870] font-bold">“{team.motto}”</span>
                </div>

                {/* Team Members List */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#8495A5]">
                    <span>Registered Teammates:</span>
                    <button
                      onClick={() => handleOpenAddMemberForTeam(team.name)}
                      className="text-[#48DDF2] hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <Plus className="w-3 h-3" />
                      Add Member
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {teamMembers.map((member) => (
                      <div
                        key={member.id}
                        className="p-2 rounded-lg bg-[#080D12]/70 border border-[#17232D] flex items-center justify-between text-xs font-mono"
                      >
                        <div>
                          <span className="font-bold text-[#F3F7FA] block">{member.callsign}</span>
                          <span className="text-[10px] text-[#8495A5] truncate">{member.name}</span>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-[#9FE870]" title="Online" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Quick Chat Button */}
              <div className="pt-4 mt-4 border-t border-[#17232D] flex items-center justify-between gap-3">
                <span className="text-xs font-mono text-[#8495A5]">
                  Channel: <strong className="text-[#48DDF2]">#{team.channelId}</strong>
                </span>

                <button
                  onClick={() => setCurrentView('comms')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#17232D] hover:bg-[#1f2f3d] text-xs font-bold text-[#F3F7FA] hover:text-[#48DDF2] transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Chat with Team
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Team Modal */}
      {showCreateTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCreateTeam}
            className="w-full max-w-md bg-[#111922] border border-[#17232D] rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#17232D]">
              <h3 className="text-base font-bold text-[#F3F7FA] flex items-center gap-2 font-display">
                <Users2 className="w-5 h-5 text-[#9FE870]" />
                Register a New Team Community
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateTeamModal(false)}
                className="text-[#8495A5] hover:text-[#F3F7FA]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#8495A5] block mb-1 font-semibold">Team or Squad Name</label>
                <input
                  type="text"
                  required
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g. Falcon Rescue Squad, Night Patrol, Blue Team..."
                  className="w-full px-3.5 py-2.5 bg-[#080D12] border border-[#17232D] focus:border-[#48DDF2] rounded-lg text-xs text-[#F3F7FA] outline-none"
                />
              </div>

              <div>
                <label className="text-[#8495A5] block mb-1 font-semibold">Team Motto / Tagline</label>
                <input
                  type="text"
                  value={newTeamMotto}
                  onChange={(e) => setNewTeamMotto(e.target.value)}
                  placeholder="e.g. Help everyone, stay united, never give up"
                  className="w-full px-3.5 py-2.5 bg-[#080D12] border border-[#17232D] focus:border-[#48DDF2] rounded-lg text-xs text-[#F3F7FA] outline-none"
                />
              </div>

              <div>
                <label className="text-[#8495A5] block mb-1 font-semibold">What does this team do?</label>
                <textarea
                  rows={3}
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                  placeholder="Briefly describe what your team works on or coordinates..."
                  className="w-full px-3.5 py-2.5 bg-[#080D12] border border-[#17232D] focus:border-[#48DDF2] rounded-lg text-xs text-[#F3F7FA] outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-[#8495A5] block mb-1 font-semibold">Team Badge Color</label>
                <div className="flex items-center gap-3">
                  {['#9FE870', '#48DDF2', '#FFBF69', '#FF6464', '#A78BFA', '#38BDF8'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewTeamColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        newTeamColor === c ? 'scale-125 border-white shadow-md' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#17232D]">
              <button
                type="button"
                onClick={() => setShowCreateTeamModal(false)}
                className="px-3 py-2 text-xs text-[#8495A5] hover:text-[#F3F7FA] bg-[#17232D] rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-black text-[#080D12] bg-[#9FE870] hover:bg-[#9FE870]/90 rounded-lg shadow-md"
              >
                Create Team & Join
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Teammate Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handleAddMember}
            className="w-full max-w-md bg-[#111922] border border-[#17232D] rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#17232D]">
              <h3 className="text-base font-bold text-[#F3F7FA] flex items-center gap-2 font-display">
                <UserPlus className="w-5 h-5 text-[#48DDF2]" />
                Register a Teammate
              </h3>
              <button
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                className="text-[#8495A5] hover:text-[#F3F7FA]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#8495A5] block mb-1 font-semibold">Teammate Callsign</label>
                  <input
                    type="text"
                    required
                    value={memberCallsign}
                    onChange={(e) => setMemberCallsign(e.target.value)}
                    placeholder="e.g. RAPTOR, SHADOW"
                    className="w-full px-3 py-2 bg-[#080D12] border border-[#17232D] focus:border-[#48DDF2] rounded-lg text-xs font-mono text-[#9FE870] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[#8495A5] block mb-1 font-semibold">Full Name</label>
                  <input
                    type="text"
                    required
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 bg-[#080D12] border border-[#17232D] focus:border-[#48DDF2] rounded-lg text-xs text-[#F3F7FA] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#8495A5] block mb-1 font-semibold">Assign to Team / Squad</label>
                <select
                  value={memberSquad}
                  onChange={(e) => setMemberSquad(e.target.value)}
                  className="w-full px-3 py-2 bg-[#080D12] border border-[#17232D] text-xs text-[#F3F7FA] rounded-lg outline-none font-medium"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[#8495A5] block mb-1 font-semibold">Role</label>
                <select
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value as DemoRole)}
                  className="w-full px-3 py-2 bg-[#080D12] border border-[#17232D] text-xs text-[#F3F7FA] rounded-lg outline-none font-medium"
                >
                  <option value="Team Member">Team Member (Field Operative)</option>
                  <option value="Coordinator">Coordinator (Team Leader)</option>
                  <option value="Observer">Observer (Read-Only)</option>
                </select>
              </div>

              <div>
                <label className="text-[#8495A5] block mb-1 font-semibold">Initial Status Note</label>
                <input
                  type="text"
                  value={memberStatusNote}
                  onChange={(e) => setMemberStatusNote(e.target.value)}
                  placeholder="e.g. Radio ready, waiting for task..."
                  className="w-full px-3 py-2 bg-[#080D12] border border-[#17232D] focus:border-[#48DDF2] rounded-lg text-xs text-[#F3F7FA] outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#17232D]">
              <button
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                className="px-3 py-2 text-xs text-[#8495A5] hover:text-[#F3F7FA] bg-[#17232D] rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-black text-[#080D12] bg-[#48DDF2] hover:bg-[#48DDF2]/90 rounded-lg shadow-md"
              >
                Register Teammate
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
