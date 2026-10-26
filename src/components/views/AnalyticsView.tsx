import React, { useState } from 'react';
import { useAegis } from '../../context/AegisContext';
import {
  calculateTeamAvailability,
  calculateMessageDeliveryAnalytics,
  calculateTaskCompletion,
  calculateDataFreshness,
  calculateActivityTrends,
  validateDataQuality,
} from '../../services/algorithms';
import {
  BarChart3,
  Users,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Radio,
  RefreshCw,
  AlertTriangle,
  Zap,
  Activity,
  Layers,
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { participants, tasks, messages, syncQueue, activities, settings } = useAegis();
  const [integrityAuditResult, setIntegrityAuditResult] = useState<ReturnType<typeof validateDataQuality> | null>(null);

  // Compute live algorithms
  const teamMetrics = calculateTeamAvailability(participants);
  const deliveryMetrics = calculateMessageDeliveryAnalytics(messages, syncQueue);
  const taskMetrics = calculateTaskCompletion(tasks);
  const freshness = calculateDataFreshness(participants, settings.freshnessThresholds);
  const trends = calculateActivityTrends(activities);

  const handleRunIntegrityAudit = () => {
    const issues = validateDataQuality(participants, tasks, messages);
    setIntegrityAuditResult(issues);
  };

  const maxTrendCount = Math.max(1, ...trends.map((t) => t.count));

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#17232D] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#8495A5] mb-1">
            <span>PERFORMANCE & HEALTH STATS</span>
            <span>·</span>
            <span>LIVE METRICS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#F3F7FA] font-display flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-[#48DDF2]" />
            Team Analytics & Health Stats
          </h1>
          <p className="text-xs text-[#8495A5] mt-1">
            Track message delivery speeds, teammate readiness, task completion rates, and storage health.
          </p>
        </div>

        <button
          onClick={handleRunIntegrityAudit}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#17232D] hover:bg-[#1f2f3d] text-xs font-bold font-display text-[#9FE870] border border-[#9FE870]/30 rounded-xl transition-all shadow-md active:scale-95"
        >
          <ShieldCheck className="w-4 h-4 text-[#9FE870]" />
          Run Health & Data Check
        </button>
      </div>

      {/* Row 1: Team Availability & Freshness */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* A. Team Availability Breakdown */}
        <div className="p-5 rounded-2xl bg-[#111922] border border-[#17232D] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#F3F7FA] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#9FE870]" />
                Team Operational Availability
              </h3>
              <p className="text-xs text-[#8495A5]">
                {teamMetrics.total} total operatives · {teamMetrics.operationalReadinessPct}% ready for deployment
              </p>
            </div>
            <span className="text-lg font-mono font-bold text-[#9FE870]">
              {teamMetrics.operationalReadinessPct}%
            </span>
          </div>

          {/* Availability Status Progress Bars */}
          <div className="space-y-3 pt-2">
            {(
              [
                { label: 'Available', key: 'Available', color: 'bg-[#9FE870]', count: teamMetrics.byStatus.Available },
                { label: 'On Mission', key: 'On Mission', color: 'bg-[#48DDF2]', count: teamMetrics.byStatus['On Mission'] },
                { label: 'Restricted Comms', key: 'Restricted Comms', color: 'bg-[#FF6464]', count: teamMetrics.byStatus['Restricted Comms'] },
                { label: 'Standby', key: 'Standby', color: 'bg-[#FFBF69]', count: teamMetrics.byStatus.Standby },
              ] as const
            ).map((item) => {
              const pct = teamMetrics.percentageByStatus[item.key] || 0;
              return (
                <div key={item.key} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-[#8495A5]">{item.label}</span>
                    <span className="text-[#F3F7FA] font-bold">
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#080D12] h-2 rounded-full overflow-hidden border border-[#17232D]">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-300`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-[#17232D]">
            <div className="p-2.5 rounded bg-[#080D12] border border-[#17232D]">
              <span className="text-[#8495A5] text-[10px] block">FLEET AVERAGE BATTERY</span>
              <span className="text-[#F3F7FA] font-bold">{teamMetrics.avgBatteryPct}%</span>
            </div>
            <div className="p-2.5 rounded bg-[#080D12] border border-[#17232D]">
              <span className="text-[#8495A5] text-[10px] block">FLEET AVERAGE SIGNAL</span>
              <span className="text-[#48DDF2] font-bold">{teamMetrics.avgSignalDbm} dBm</span>
            </div>
          </div>
        </div>

        {/* E. Data Freshness Classification */}
        <div className="p-5 rounded-2xl bg-[#111922] border border-[#17232D] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#F3F7FA] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#FFBF69]" />
                Telemetry Freshness Classification
              </h3>
              <p className="text-xs text-[#8495A5]">
                Demonstration thresholds: Fresh (&lt;{settings.freshnessThresholds.freshMin}m), Aging (&lt;{settings.freshnessThresholds.agingMin}m), Stale (&gt;{settings.freshnessThresholds.agingMin}m)
              </p>
            </div>
            <span className="text-lg font-mono font-bold text-[#48DDF2]">
              {freshness.overallFreshnessScorePct}% Score
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono">
            <div className="p-3 rounded-xl bg-[#080D12] border border-[#9FE870]/30">
              <span className="text-[10px] text-[#9FE870] uppercase font-bold block mb-1">Fresh Telemetry</span>
              <span className="text-xl font-bold text-[#9FE870]">{freshness.freshCount}</span>
              <span className="text-[10px] text-[#8495A5] block mt-0.5">&lt; {settings.freshnessThresholds.freshMin} min ago</span>
            </div>

            <div className="p-3 rounded-xl bg-[#080D12] border border-[#FFBF69]/30">
              <span className="text-[10px] text-[#FFBF69] uppercase font-bold block mb-1">Aging Telemetry</span>
              <span className="text-xl font-bold text-[#FFBF69]">{freshness.agingCount}</span>
              <span className="text-[10px] text-[#8495A5] block mt-0.5">{settings.freshnessThresholds.freshMin}–{settings.freshnessThresholds.agingMin} min ago</span>
            </div>

            <div className="p-3 rounded-xl bg-[#080D12] border border-[#FF6464]/30">
              <span className="text-[10px] text-[#FF6464] uppercase font-bold block mb-1">Stale Telemetry</span>
              <span className="text-xl font-bold text-[#FF6464]">{freshness.staleCount}</span>
              <span className="text-[10px] text-[#8495A5] block mt-0.5">&gt; {settings.freshnessThresholds.agingMin} min ago</span>
            </div>
          </div>

          {/* Stale Node Warning List */}
          <div className="space-y-1.5 pt-2 border-t border-[#17232D]">
            <span className="text-xs font-semibold text-[#8495A5]">OPERATIVES REQUIRING POSITION CHECK-IN</span>
            {freshness.staleParticipants.length === 0 ? (
              <p className="text-xs text-[#9FE870] font-mono">All operative pings are within nominal latency tolerances.</p>
            ) : (
              <div className="space-y-1">
                {freshness.staleParticipants.map((sp) => (
                  <div key={sp.id} className="p-2 rounded bg-[#080D12] border border-[#FF6464]/30 flex items-center justify-between text-xs font-mono">
                    <span className="text-[#F3F7FA] font-bold">{sp.callsign} ({sp.group})</span>
                    <span className="text-[#FF6464]">
                      Last ping: {new Date(sp.lastCheckIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Message Delivery Analytics & Task Completion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* B. Message Delivery Analytics */}
        <div className="p-5 rounded-2xl bg-[#111922] border border-[#17232D] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#F3F7FA] flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#48DDF2]" />
                Mesh Message Delivery Analytics
              </h3>
              <p className="text-xs text-[#8495A5]">
                Decentralized packet dispatch & queue efficiency
              </p>
            </div>
            <span className="text-lg font-mono font-bold text-[#9FE870]">
              {deliveryMetrics.deliverySuccessRatePct}% Success
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
            <div className="p-2.5 rounded bg-[#080D12] border border-[#17232D]">
              <span className="text-[#8495A5] text-[10px] block">TOTAL LOCAL</span>
              <span className="text-base font-bold text-[#F3F7FA]">{deliveryMetrics.totalMessages}</span>
            </div>
            <div className="p-2.5 rounded bg-[#080D12] border border-[#17232D]">
              <span className="text-[#8495A5] text-[10px] block">DELIVERED</span>
              <span className="text-base font-bold text-[#9FE870]">{deliveryMetrics.deliveredCount}</span>
            </div>
            <div className="p-2.5 rounded bg-[#080D12] border border-[#17232D]">
              <span className="text-[#8495A5] text-[10px] block">QUEUED OFFLINE</span>
              <span className="text-base font-bold text-[#FFBF69]">{deliveryMetrics.pendingCount}</span>
            </div>
            <div className="p-2.5 rounded bg-[#080D12] border border-[#17232D]">
              <span className="text-[#8495A5] text-[10px] block">AVG MESH RTT</span>
              <span className="text-base font-bold text-[#48DDF2]">{deliveryMetrics.estimatedAvgLatencyMs} ms</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#080D12] border border-[#17232D] text-xs text-[#8495A5] space-y-1">
            <span className="font-semibold text-[#F3F7FA] block">Decentralized Mesh Simulation Metrics</span>
            <p>
              When disconnected, messages remain queued locally inside IndexedDB. Re-establishing connection triggers automated batch synchronization without telemetry loss.
            </p>
          </div>
        </div>

        {/* C. Task Completion Rate */}
        <div className="p-5 rounded-2xl bg-[#111922] border border-[#17232D] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#F3F7FA] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#9FE870]" />
                Task Completion Velocity
              </h3>
              <p className="text-xs text-[#8495A5]">
                {taskMetrics.completedCount} of {taskMetrics.totalTasks} logistics directives completed
              </p>
            </div>
            <span className="text-lg font-mono font-bold text-[#9FE870]">
              {taskMetrics.completionRatePct}%
            </span>
          </div>

          {/* Status Breakdown Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono text-[#8495A5]">
              <span>Distribution by Operational Stage</span>
              <span className="text-[#F3F7FA]">{taskMetrics.totalTasks} Tasks</span>
            </div>
            <div className="w-full bg-[#080D12] h-3 rounded-full overflow-hidden flex border border-[#17232D]">
              <div
                style={{ width: `${(taskMetrics.completedCount / Math.max(1, taskMetrics.totalTasks)) * 100}%` }}
                className="bg-[#9FE870] h-full"
                title={`Completed: ${taskMetrics.completedCount}`}
              />
              <div
                style={{ width: `${(taskMetrics.inProgressCount / Math.max(1, taskMetrics.totalTasks)) * 100}%` }}
                className="bg-[#48DDF2] h-full"
                title={`In Progress: ${taskMetrics.inProgressCount}`}
              />
              <div
                style={{ width: `${(taskMetrics.blockedCount / Math.max(1, taskMetrics.totalTasks)) * 100}%` }}
                className="bg-[#FF6464] h-full"
                title={`Blocked: ${taskMetrics.blockedCount}`}
              />
              <div
                style={{ width: `${(taskMetrics.openCount / Math.max(1, taskMetrics.totalTasks)) * 100}%` }}
                className="bg-[#8495A5] h-full"
                title={`Open: ${taskMetrics.openCount}`}
              />
            </div>
          </div>

          {/* Priority Breakdown Matrix */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono pt-2">
            {(['Critical', 'High', 'Medium', 'Low'] as const).map((pr) => {
              const data = taskMetrics.priorityBreakdown[pr];
              return (
                <div key={pr} className="p-2 rounded bg-[#080D12] border border-[#17232D]">
                  <span className="text-[10px] text-[#8495A5] block uppercase">{pr}</span>
                  <span className="text-sm font-bold text-[#F3F7FA]">
                    {data.completed}/{data.total}
                  </span>
                  <span className="text-[9px] text-[#9FE870] block">
                    {data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* D. Event Activity Trends Chart */}
      <div className="p-5 rounded-2xl bg-[#111922] border border-[#17232D] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#F3F7FA] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#48DDF2]" />
              Event Activity Frequency Over Time Windows
            </h3>
            <p className="text-xs text-[#8495A5]">
              Real activity counts aggregated from local audit trail
            </p>
          </div>
          <span className="text-xs font-mono text-[#8495A5]">
            {activities.length} total events recorded
          </span>
        </div>

        {/* Clean SVG/CSS Bar Chart */}
        <div className="h-44 flex items-end gap-4 pt-6 px-2 border-b border-[#17232D]">
          {trends.map((bucket, idx) => {
            const heightPct = Math.round((bucket.count / maxTrendCount) * 100);
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[11px] font-mono font-bold text-[#48DDF2] opacity-0 group-hover:opacity-100 transition-opacity">
                  {bucket.count}
                </span>
                <div
                  className="w-full max-w-[48px] bg-[#17232D] group-hover:bg-[#48DDF2] rounded-t transition-all duration-300 relative flex flex-col justify-end overflow-hidden"
                  style={{ height: `${Math.max(8, heightPct)}%` }}
                >
                  <div
                    className="w-full bg-[#9FE870]"
                    style={{ height: `${(bucket.commCount / Math.max(1, bucket.count)) * 100}%` }}
                    title={`Comms: ${bucket.commCount}`}
                  />
                </div>
                <span className="text-[10px] font-mono text-[#8495A5]">{bucket.label}</span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-6 text-xs font-mono text-[#8495A5]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#9FE870]" /> Communications
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#17232D]" /> Tasks & Position
          </span>
        </div>
      </div>

      {/* G. DATA QUALITY & INTEGRITY REPORT */}
      {integrityAuditResult && (
        <div className="p-5 rounded-2xl bg-[#111922] border border-[#9FE870]/40 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#F3F7FA] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#9FE870]" />
              Data Integrity & Quality Validation Audit Report
            </h3>
            <span className="text-xs font-mono text-[#9FE870] font-bold">
              {integrityAuditResult.length === 0 ? '0 ANOMALIES DETECTED' : `${integrityAuditResult.length} ISSUES FOUND`}
            </span>
          </div>

          {integrityAuditResult.length === 0 ? (
            <div className="p-4 rounded-xl bg-[#080D12] text-xs text-[#9FE870] font-mono flex items-center gap-2 border border-[#9FE870]/20">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              All data records validated successfully: No missing IDs, duplicate keys, orphaned task assignees, or corrupted timestamps.
            </div>
          ) : (
            <div className="space-y-2">
              {integrityAuditResult.map((issue) => (
                <div
                  key={issue.id}
                  className="p-3 rounded-lg bg-[#080D12] border border-[#FFBF69]/30 text-xs font-mono flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <span className="text-[#FFBF69] font-bold uppercase">
                      [{issue.entityType}] {issue.severity.toUpperCase()}
                    </span>
                    <p className="text-[#F3F7FA]">{issue.description}</p>
                  </div>
                  <span className="text-[10px] text-[#8495A5]">Auto-repairable on reset</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
