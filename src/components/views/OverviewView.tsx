import React, { useState } from 'react';
import { useAegis, AppView } from '../../context/AegisContext';
import {
  calculateTeamAvailability,
  calculateTaskCompletion,
  calculateDataFreshness,
  calculateMessageDeliveryAnalytics,
} from '../../services/algorithms';
import {
  Shield,
  Wifi,
  WifiOff,
  Database,
  RefreshCw,
  Clock,
  Users,
  Users2,
  CheckSquare,
  MessageSquare,
  AlertTriangle,
  Activity,
  ArrowUpRight,
  Send,
  Plus,
  FileDown,
  Layers,
  Radio,
  CheckCircle2,
} from 'lucide-react';

export const OverviewView: React.FC = () => {
  const {
    setCurrentView,
    participants,
    tasks,
    messages,
    alerts,
    activities,
    syncQueue,
    isSimulatedOffline,
    isBrowserOnline,
    lastSyncTime,
    appUptimeSeconds,
    processSyncQueue,
    settings,
    teams,
    userProfile,
  } = useAegis();

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  // Compute live algorithms
  const teamMetrics = calculateTeamAvailability(participants);
  const taskMetrics = calculateTaskCompletion(tasks);
  const freshness = calculateDataFreshness(participants, settings.freshnessThresholds);
  const deliveryMetrics = calculateMessageDeliveryAnalytics(messages, syncQueue);

  const unresolvedAlerts = alerts.filter((a) => !a.resolved);

  // Filter activity events
  const filteredActivities = activities.filter((ev) => {
    if (categoryFilter !== 'all' && ev.category !== categoryFilter) return false;
    if (severityFilter !== 'all' && ev.severity !== severityFilter) return false;
    return true;
  });

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#17232D] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#8495A5] mb-1">
            <span>OFFLINE TACTICAL NETWORK</span>
            <span>·</span>
            <span>SAFE ENVIRONMENT</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#F3F7FA] font-display flex items-center gap-3">
            <Shield className="w-7 h-7 text-[#9FE870]" />
            Mission Command Dashboard
          </h1>
          <p className="text-xs text-[#8495A5] mt-1">
            Logged in as <strong className="text-[#9FE870]">{userProfile.displayName}</strong> ({userProfile.callsign}) · Squad: <strong className="text-[#48DDF2]">{userProfile.assignedGroup}</strong>
          </p>
        </div>

        {/* Quick Action Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setCurrentView('community')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#17232D] hover:bg-[#1f2f3d] text-xs font-bold text-[#9FE870] rounded-xl transition-colors border border-[#9FE870]/30 shadow-sm"
          >
            <Users2 className="w-4 h-4" />
            Squads ({teams.length})
          </button>
          <button
            onClick={() => setCurrentView('comms')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#17232D] hover:bg-[#1f2f3d] text-xs font-bold text-[#48DDF2] rounded-xl transition-colors border border-[#48DDF2]/30 shadow-sm"
          >
            <Send className="w-4 h-4" />
            Send Message
          </button>
          <button
            onClick={() => setCurrentView('tasks')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#17232D] hover:bg-[#1f2f3d] text-xs font-bold text-[#F3F7FA] rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
          <button
            onClick={processSyncQueue}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#9FE870] hover:bg-[#9FE870]/90 text-xs font-black text-[#080D12] rounded-xl transition-colors shadow-md"
            title="Send all queued messages"
          >
            <RefreshCw className="w-4 h-4" />
            Sync ({syncQueue.length})
          </button>
        </div>
      </div>

      {/* A. SYSTEM STATUS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Network Availability */}
        <div className="p-3.5 rounded-2xl bg-[#111922] border border-[#17232D]">
          <span className="text-[11px] font-semibold text-[#8495A5] block mb-1">Network Mode</span>
          <div className="flex items-center gap-1.5">
            {isSimulatedOffline ? (
              <WifiOff className="w-4 h-4 text-[#FF6464]" />
            ) : (
              <Wifi className="w-4 h-4 text-[#9FE870]" />
            )}
            <span
              className={`text-sm font-mono font-bold ${
                isSimulatedOffline ? 'text-[#FF6464]' : 'text-[#9FE870]'
              }`}
            >
              {isSimulatedOffline ? 'OFFLINE' : 'ONLINE'}
            </span>
          </div>
          <span className="text-[10px] text-[#8495A5] block mt-1 font-mono">
            Device: {isBrowserOnline ? 'Connected' : 'Offline'}
          </span>
        </div>

        {/* Local Storage Status */}
        <div className="p-3.5 rounded-2xl bg-[#111922] border border-[#17232D]">
          <span className="text-[11px] font-semibold text-[#8495A5] block mb-1">Saved Locally</span>
          <div className="flex items-center gap-1.5">
            <Database className="w-4 h-4 text-[#48DDF2]" />
            <span className="text-sm font-mono font-bold text-[#F3F7FA]">IndexedDB</span>
          </div>
          <span className="text-[10px] text-[#8495A5] block mt-1 font-mono">
            {participants.length + tasks.length + messages.length} items saved
          </span>
        </div>

        {/* Last Sync Time */}
        <div className="p-3.5 rounded-2xl bg-[#111922] border border-[#17232D]">
          <span className="text-[11px] font-semibold text-[#8495A5] block mb-1">Last Update</span>
          <div className="flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4 text-[#8495A5]" />
            <span className="text-xs font-mono font-semibold text-[#F3F7FA]">
              {new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <span className="text-[10px] text-[#8495A5] block mt-1 font-mono">
            {syncQueue.length} pending items
          </span>
        </div>

        {/* Pending Sync Items */}
        <div
          onClick={processSyncQueue}
          className="p-3.5 rounded-2xl bg-[#111922] border border-[#17232D] hover:border-[#FFBF69]/40 cursor-pointer transition-colors"
        >
          <span className="text-[11px] font-semibold text-[#8495A5] block mb-1">Unsent Messages</span>
          <span
            className={`text-xl font-mono font-bold ${
              syncQueue.length > 0 ? 'text-[#FFBF69]' : 'text-[#9FE870]'
            }`}
          >
            {syncQueue.length}
          </span>
          <span className="text-[10px] text-[#8495A5] block mt-0.5">
            {syncQueue.length > 0 ? 'Click to send now' : 'All messages delivered'}
          </span>
        </div>

        {/* Active Demo Operatives */}
        <div
          onClick={() => setCurrentView('team')}
          className="p-3.5 rounded-2xl bg-[#111922] border border-[#17232D] hover:border-[#48DDF2]/40 cursor-pointer transition-colors"
        >
          <span className="text-[11px] font-semibold text-[#8495A5] block mb-1">Team Members</span>
          <span className="text-xl font-mono font-bold text-[#F3F7FA]">{participants.length}</span>
          <span className="text-[10px] text-[#9FE870] block mt-0.5 font-mono">
            {teamMetrics.operationalReadinessPct}% ready
          </span>
        </div>

        {/* System Uptime */}
        <div className="p-3.5 rounded-2xl bg-[#111922] border border-[#17232D]">
          <span className="text-[11px] font-semibold text-[#8495A5] block mb-1">Session Timer</span>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#8495A5]" />
            <span className="text-xs font-mono font-semibold text-[#F3F7FA]">
              {formatUptime(appUptimeSeconds)}
            </span>
          </div>
          <span className="text-[10px] text-[#8495A5] block mt-1 font-mono">Active session</span>
        </div>
      </div>

      {/* B. DEMO OPERATION SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Squads & Community */}
        <div
          onClick={() => setCurrentView('community')}
          className="p-5 rounded-2xl bg-[#111922] border border-[#17232D] hover:border-[#9FE870]/50 cursor-pointer transition-all flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#8495A5]">Registered Squads</span>
              <Users2 className="w-5 h-5 text-[#9FE870]" />
            </div>
            <div className="text-3xl font-black font-display text-[#F3F7FA] group-hover:text-[#9FE870] transition-colors">
              {teams.length}
            </div>
            <p className="text-xs text-[#8495A5] mt-1.5">
              Talk directly with your team in dedicated chat channels.
            </p>
          </div>
          <div className="pt-3 mt-3 border-t border-[#17232D] flex items-center justify-between text-xs font-bold text-[#9FE870]">
            <span>Join or manage squads</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Open Tasks */}
        <div
          onClick={() => setCurrentView('tasks')}
          className="p-5 rounded-2xl bg-[#111922] border border-[#17232D] hover:border-[#48DDF2]/50 cursor-pointer transition-all flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#8495A5]">Team To-Dos</span>
              <CheckSquare className="w-5 h-5 text-[#48DDF2]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-display text-[#F3F7FA] group-hover:text-[#48DDF2] transition-colors">
                {taskMetrics.openCount + taskMetrics.inProgressCount}
              </span>
              <span className="text-xs text-[#8495A5]">active / {taskMetrics.totalTasks} total</span>
            </div>
            <div className="mt-2.5 w-full bg-[#17232D] rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#48DDF2] h-full rounded-full transition-all duration-300"
                style={{ width: `${taskMetrics.completionRatePct}%` }}
              />
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-[#17232D] flex items-center justify-between text-xs font-bold text-[#48DDF2]">
            <span>{taskMetrics.completionRatePct}% tasks finished</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Communications Health */}
        <div
          onClick={() => setCurrentView('comms')}
          className="p-5 rounded-2xl bg-[#111922] border border-[#17232D] hover:border-[#9FE870]/50 cursor-pointer transition-all flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#8495A5]">Saved Messages</span>
              <MessageSquare className="w-5 h-5 text-[#9FE870]" />
            </div>
            <div className="text-3xl font-black font-display text-[#F3F7FA] group-hover:text-[#9FE870] transition-colors">
              {messages.length}
            </div>
            <p className="text-xs text-[#8495A5] mt-1.5 font-mono">
              Delivered: {deliveryMetrics.deliveredCount} · Queued: {deliveryMetrics.pendingCount}
            </p>
          </div>
          <div className="pt-3 mt-3 border-t border-[#17232D] flex items-center justify-between text-xs font-bold text-[#9FE870]">
            <span>Open team chat</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Unresolved Alerts */}
        <div
          onClick={() => setCurrentView('alerts')}
          className="p-5 rounded-2xl bg-[#111922] border border-[#17232D] hover:border-[#FFBF69]/50 cursor-pointer transition-all flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#8495A5]">Safety Warnings</span>
              <AlertTriangle className="w-5 h-5 text-[#FFBF69]" />
            </div>
            <div className="text-3xl font-black font-display text-[#FFBF69]">
              {unresolvedAlerts.length}
            </div>
            <p className="text-xs text-[#8495A5] mt-1.5">
              Check-in score: {freshness.overallFreshnessScorePct}% · Overdue: {freshness.staleCount}
            </p>
          </div>
          <div className="pt-3 mt-3 border-t border-[#17232D] flex items-center justify-between text-xs font-bold text-[#FFBF69]">
            <span>Review warnings</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Map Teaser & Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Map Preview Card */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-[#111922] border border-[#17232D] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-[#F3F7FA] font-display flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#48DDF2]" />
                Live Map — Sector 7-Delta Camp
              </h3>
              <p className="text-xs text-[#8495A5]">
                Offline vector map · Click to inspect teammates and locations
              </p>
            </div>
            <button
              onClick={() => setCurrentView('map')}
              className="text-xs font-bold text-[#48DDF2] hover:underline flex items-center gap-1 font-display"
            >
              Open Full Map
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Schematic Graphic Canvas Thumbnail */}
          <div
            onClick={() => setCurrentView('map')}
            className="w-full h-64 rounded-xl bg-[#080D12] border border-[#17232D] relative overflow-hidden cursor-pointer group shadow-inner"
          >
            <div className="absolute inset-0 bg-tactical-grid opacity-50" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-[#48DDF2]/20 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-[#9FE870]/15 pointer-events-none" />

            {/* Simulated Node Blips */}
            {participants.slice(0, 7).map((p, idx) => {
              const xPos = 20 + ((idx * 27) % 65);
              const yPos = 25 + ((idx * 33) % 55);
              return (
                <div
                  key={p.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${xPos}%`, top: `${yPos}%` }}
                >
                  <div className="relative group/node">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#9FE870] block shadow-[0_0_10px_rgba(159,232,112,0.9)]" />
                    <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-mono text-[#F3F7FA] whitespace-nowrap bg-[#080D12]/90 px-1.5 rounded border border-[#17232D]">
                      {p.callsign}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Click to expand overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="px-4 py-2 rounded-xl bg-[#48DDF2] text-[#080D12] text-xs font-black shadow-xl">
                Open Interactive Map View
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs font-mono text-center">
            <div className="p-2.5 rounded-xl bg-[#080D12] border border-[#17232D]">
              <span className="text-[#8495A5] block text-[10px]">TEAMMATES</span>
              <span className="text-[#9FE870] font-bold text-sm">{participants.length} Active</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#080D12] border border-[#17232D]">
              <span className="text-[#8495A5] block text-[10px]">AVG SIGNAL</span>
              <span className="text-[#48DDF2] font-bold text-sm">{teamMetrics.avgSignalDbm} dBm</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#080D12] border border-[#17232D]">
              <span className="text-[#8495A5] block text-[10px]">AVG BATTERY</span>
              <span className="text-[#F3F7FA] font-bold text-sm">{teamMetrics.avgBatteryPct}%</span>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Activity Timeline */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#111922] border border-[#17232D] space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-black text-[#F3F7FA] font-display flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#9FE870]" />
                Live Team Activity
              </h3>
              <span className="text-xs font-mono text-[#8495A5]">
                {filteredActivities.length} updates
              </span>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-1.5 pb-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#080D12] border border-[#17232D] text-[#8495A5] hover:text-[#F3F7FA] rounded-lg px-2 py-1 text-[11px] outline-none"
              >
                <option value="all">All Types</option>
                <option value="Comm">Messages</option>
                <option value="Task">Tasks</option>
                <option value="Position">Check-ins</option>
                <option value="Alert">Warnings</option>
                <option value="Sync">Sync</option>
              </select>

              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-[#080D12] border border-[#17232D] text-[#8495A5] hover:text-[#F3F7FA] rounded-lg px-2 py-1 text-[11px] outline-none"
              >
                <option value="all">All Priorities</option>
                <option value="info">Normal</option>
                <option value="warning">Attention</option>
                <option value="critical">Urgent</option>
              </select>
            </div>

            {/* Timeline Stream */}
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {filteredActivities.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#8495A5]">
                  No updates matching filter.
                </div>
              ) : (
                filteredActivities.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-xl bg-[#080D12]/70 border border-[#17232D] space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-[#8495A5]">
                        {new Date(ev.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                      <span
                        className={`font-bold ${
                          ev.severity === 'critical'
                            ? 'text-[#FF6464]'
                            : ev.severity === 'warning'
                            ? 'text-[#FFBF69]'
                            : 'text-[#48DDF2]'
                        }`}
                      >
                        {ev.actor}
                      </span>
                    </div>
                    <p className="text-[#F3F7FA] leading-relaxed text-xs">{ev.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => setCurrentView('reports')}
            className="w-full py-2.5 bg-[#17232D] hover:bg-[#1f2f3d] text-xs font-bold text-[#8495A5] hover:text-[#F3F7FA] rounded-xl transition-colors flex items-center justify-center gap-1.5 mt-2"
          >
            <FileDown className="w-3.5 h-3.5" />
            Download Activity Log
          </button>
        </div>
      </div>
    </div>
  );
};
