import React, { useState } from 'react';
import { useAegis } from '../../context/AegisContext';
import { aegisDB } from '../../services/db';
import {
  calculateTeamAvailability,
  calculateTaskCompletion,
  calculateMessageDeliveryAnalytics,
  calculateDataFreshness,
} from '../../services/algorithms';
import {
  FileText,
  Download,
  Printer,
  Table,
  CheckCircle2,
  Database,
  Calendar,
  Shield,
  Clock,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const {
    participants,
    tasks,
    messages,
    alerts,
    activities,
    syncQueue,
    isSimulatedOffline,
    isBrowserOnline,
    lastSyncTime,
    userProfile,
    settings,
    addToast,
  } = useAegis();

  const [exporting, setExporting] = useState(false);

  // Compute algorithms for report
  const teamMetrics = calculateTeamAvailability(participants);
  const taskMetrics = calculateTaskCompletion(tasks);
  const deliveryMetrics = calculateMessageDeliveryAnalytics(messages, syncQueue);
  const freshness = calculateDataFreshness(participants, settings.freshnessThresholds);

  // Helper to trigger browser download
  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 1. Export JSON
  const handleExportJSON = async () => {
    try {
      setExporting(true);
      const dataDump = await aegisDB.exportAllData();
      const jsonString = JSON.stringify(dataDump, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const filename = `aegis_grid_mission_report_${new Date().toISOString().slice(0, 10)}.json`;
      triggerDownload(blob, filename);
      addToast('success', 'JSON Report Exported', `Saved to ${filename}`);
    } catch (err) {
      console.error('Failed to export JSON:', err);
      addToast('error', 'Export Failed', 'Could not generate JSON dump.');
    } finally {
      setExporting(false);
    }
  };

  // 2. Export CSV Helper
  const handleExportCSV = (entityType: 'participants' | 'tasks' | 'messages' | 'activities') => {
    try {
      let csvContent = '';
      let filename = `aegis_${entityType}_${new Date().toISOString().slice(0, 10)}.csv`;

      if (entityType === 'participants') {
        const headers = ['ID', 'Callsign', 'Name', 'Role', 'Squad', 'Availability', 'BatteryPct', 'SignalDbm', 'LastCheckIn', 'StatusNote'];
        const rows = participants.map((p) => [
          p.id,
          p.callsign,
          `"${p.name.replace(/"/g, '""')}"`,
          p.role,
          p.group,
          p.availability,
          p.batteryPct,
          p.signalDbm,
          p.lastCheckIn,
          `"${p.statusNote.replace(/"/g, '""')}"`,
        ]);
        csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      } else if (entityType === 'tasks') {
        const headers = ['ID', 'Title', 'Priority', 'Status', 'AssigneeCallsign', 'CreatedAt', 'DueDate', 'Description'];
        const rows = tasks.map((t) => [
          t.id,
          `"${t.title.replace(/"/g, '""')}"`,
          t.priority,
          t.status,
          t.assigneeCallsign,
          t.createdAt,
          t.dueDate || '',
          `"${t.description.replace(/"/g, '""')}"`,
        ]);
        csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      } else if (entityType === 'messages') {
        const headers = ['ID', 'Channel', 'SenderCallsign', 'SenderRole', 'Priority', 'Status', 'Timestamp', 'Content'];
        const rows = messages.map((m) => [
          m.id,
          m.channelId,
          m.senderCallsign,
          m.senderRole,
          m.priority,
          m.status,
          m.timestamp,
          `"${m.content.replace(/"/g, '""')}"`,
        ]);
        csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      } else if (entityType === 'activities') {
        const headers = ['ID', 'Timestamp', 'Category', 'Actor', 'Severity', 'Description'];
        const rows = activities.map((a) => [
          a.id,
          a.timestamp,
          a.category,
          a.actor,
          a.severity,
          `"${a.description.replace(/"/g, '""')}"`,
        ]);
        csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      triggerDownload(blob, filename);
      addToast('success', 'CSV Exported', `Saved to ${filename}`);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      addToast('error', 'Export Failed', 'Could not compile CSV records.');
    }
  };

  // 3. Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header (hidden in print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#17232D] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#8495A5] mb-1">
            <span>OFFICIAL MISSION LOG & ARCHIVE</span>
            <span>·</span>
            <span>BACKUP & EXPORT</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#F3F7FA] font-display flex items-center gap-3">
            <FileText className="w-8 h-8 text-[#9FE870]" />
            Reports & Data Downloads
          </h1>
          <p className="text-xs text-[#8495A5] mt-1">
            Export your squad roster, tasks, messages, and mission logs to JSON or CSV spreadsheets.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportJSON}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#17232D] hover:bg-[#1f2f3d] text-xs font-bold font-display text-[#48DDF2] border border-[#48DDF2]/30 rounded-xl transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            Download Full Backup (JSON)
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#48DDF2] hover:bg-[#48DDF2]/90 text-xs font-black font-display text-[#080D12] rounded-xl transition-all shadow-md active:scale-95"
          >
            <Printer className="w-4 h-4" />
            Print Clean Report
          </button>
        </div>
      </div>

      {/* Quick CSV Export Strips (no-print) */}
      <div className="no-print p-4 rounded-xl bg-[#111922] border border-[#17232D] space-y-3">
        <span className="text-xs font-bold font-display text-[#8495A5] uppercase tracking-wider block">
          Download Spreadsheets (CSV)
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => handleExportCSV('participants')}
            className="p-3 rounded-xl bg-[#080D12] hover:bg-[#17232D] border border-[#17232D] text-left text-xs font-bold font-display transition-colors flex items-center justify-between group"
          >
            <span className="text-[#F3F7FA] group-hover:text-[#48DDF2]">Teammates CSV</span>
            <Table className="w-3.5 h-3.5 text-[#8495A5]" />
          </button>
          <button
            onClick={() => handleExportCSV('tasks')}
            className="p-3 rounded-xl bg-[#080D12] hover:bg-[#17232D] border border-[#17232D] text-left text-xs font-bold font-display transition-colors flex items-center justify-between group"
          >
            <span className="text-[#F3F7FA] group-hover:text-[#48DDF2]">Tasks CSV</span>
            <Table className="w-3.5 h-3.5 text-[#8495A5]" />
          </button>
          <button
            onClick={() => handleExportCSV('messages')}
            className="p-3 rounded-xl bg-[#080D12] hover:bg-[#17232D] border border-[#17232D] text-left text-xs font-bold font-display transition-colors flex items-center justify-between group"
          >
            <span className="text-[#F3F7FA] group-hover:text-[#48DDF2]">Messages CSV</span>
            <Table className="w-3.5 h-3.5 text-[#8495A5]" />
          </button>
          <button
            onClick={() => handleExportCSV('activities')}
            className="p-3 rounded-xl bg-[#080D12] hover:bg-[#17232D] border border-[#17232D] text-left text-xs font-bold font-display transition-colors flex items-center justify-between group"
          >
            <span className="text-[#F3F7FA] group-hover:text-[#48DDF2]">Activity History CSV</span>
            <Table className="w-3.5 h-3.5 text-[#8495A5]" />
          </button>
        </div>
      </div>


      {/* Formal Printable Tactical Report Document */}
      <div className="p-6 sm:p-10 rounded-2xl bg-[#111922] border border-[#17232D] print-surface space-y-6">
        {/* Dossier Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#17232D] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-[#9FE870] inline-block" />
              <h2 className="text-xl font-bold tracking-tight text-[#F3F7FA] print-text-dark">
                AEGIS GRID // SITUATIONAL SUMMARY REPORT
              </h2>
            </div>
            <p className="text-xs font-mono text-[#8495A5] print-text-muted">
              SECTOR 7-DELTA OPERATIONAL OVERVIEW · DECENTRALIZED MESH TELEMETRY
            </p>
          </div>

          <div className="text-right text-xs font-mono text-[#8495A5] print-text-muted space-y-0.5">
            <div>COMPILED: {new Date().toLocaleString()}</div>
            <div>SIGNING OFFICER: {userProfile.callsign} ({userProfile.role})</div>
            <div className="text-[#FFBF69] font-bold">NON-OPERATIONAL SIMULATION</div>
          </div>
        </div>

        {/* Section 1: System Status & Infrastructure */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-[#48DDF2] tracking-wider uppercase font-mono">
            01. Communications & Storage Architecture
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-[#080D12] border border-[#17232D] print-surface">
              <span className="text-[#8495A5] print-text-muted text-[10px] block">SIMULATED LINK</span>
              <span className="text-sm font-bold text-[#9FE870] print-text-dark">
                {isSimulatedOffline ? 'OFFLINE' : 'ONLINE'}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-[#080D12] border border-[#17232D] print-surface">
              <span className="text-[#8495A5] print-text-muted text-[10px] block">HOST NETWORK</span>
              <span className="text-sm font-bold text-[#F3F7FA] print-text-dark">
                {isBrowserOnline ? 'CONNECTED' : 'DISCONNECTED'}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-[#080D12] border border-[#17232D] print-surface">
              <span className="text-[#8495A5] print-text-muted text-[10px] block">LOCAL CACHE</span>
              <span className="text-sm font-bold text-[#48DDF2] print-text-dark">IndexedDB</span>
            </div>
            <div className="p-3 rounded-lg bg-[#080D12] border border-[#17232D] print-surface">
              <span className="text-[#8495A5] print-text-muted text-[10px] block">QUEUE BACKLOG</span>
              <span className="text-sm font-bold text-[#FFBF69] print-text-dark">
                {syncQueue.length} items
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Team Readiness */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-[#48DDF2] tracking-wider uppercase font-mono">
            02. Operative Readiness & Telemetry
          </h3>
          <div className="grid grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 rounded bg-[#080D12] border border-[#17232D] print-surface text-center">
              <span className="text-[#8495A5] print-text-muted text-[10px] block">READINESS RATE</span>
              <span className="text-lg font-bold text-[#9FE870] print-text-dark">
                {teamMetrics.operationalReadinessPct}%
              </span>
            </div>
            <div className="p-3 rounded bg-[#080D12] border border-[#17232D] print-surface text-center">
              <span className="text-[#8495A5] print-text-muted text-[10px] block">AVERAGE BATTERY</span>
              <span className="text-lg font-bold text-[#F3F7FA] print-text-dark">
                {teamMetrics.avgBatteryPct}%
              </span>
            </div>
            <div className="p-3 rounded bg-[#080D12] border border-[#17232D] print-surface text-center">
              <span className="text-[#8495A5] print-text-muted text-[10px] block">AVERAGE SIGNAL</span>
              <span className="text-lg font-bold text-[#48DDF2] print-text-dark">
                {teamMetrics.avgSignalDbm} dBm
              </span>
            </div>
          </div>

          {/* Tabular Operatives List */}
          <div className="overflow-x-auto border border-[#17232D] rounded-lg">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#080D12] text-[#8495A5] border-b border-[#17232D]">
                <tr>
                  <th className="p-2.5">Callsign</th>
                  <th className="p-2.5">Squad</th>
                  <th className="p-2.5">Role</th>
                  <th className="p-2.5">Availability</th>
                  <th className="p-2.5">Battery</th>
                  <th className="p-2.5">Last Check-In</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#17232D] text-[#F3F7FA] print-text-dark">
                {participants.slice(0, 8).map((p) => (
                  <tr key={p.id}>
                    <td className="p-2.5 font-bold text-[#48DDF2]">{p.callsign}</td>
                    <td className="p-2.5">{p.group}</td>
                    <td className="p-2.5 text-[#8495A5]">{p.role}</td>
                    <td className="p-2.5 font-semibold text-[#9FE870]">{p.availability}</td>
                    <td className="p-2.5">{p.batteryPct}%</td>
                    <td className="p-2.5 text-[#8495A5]">
                      {new Date(p.lastCheckIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Coordination Tasks */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-[#48DDF2] tracking-wider uppercase font-mono">
            03. Coordination Directive Summary
          </h3>
          <div className="overflow-x-auto border border-[#17232D] rounded-lg">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#080D12] text-[#8495A5] border-b border-[#17232D]">
                <tr>
                  <th className="p-2.5">ID</th>
                  <th className="p-2.5">Title</th>
                  <th className="p-2.5">Priority</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Assignee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#17232D] text-[#F3F7FA] print-text-dark">
                {tasks.map((t) => (
                  <tr key={t.id}>
                    <td className="p-2.5 text-[#8495A5]">{t.id}</td>
                    <td className="p-2.5 font-semibold">{t.title}</td>
                    <td className="p-2.5 text-[#FFBF69] font-bold">{t.priority}</td>
                    <td className="p-2.5 text-[#9FE870]">{t.status}</td>
                    <td className="p-2.5 text-[#48DDF2]">{t.assigneeCallsign}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legal & Safety Disclaimer Footer */}
        <div className="pt-6 border-t border-[#17232D] text-[10px] font-mono text-[#8495A5] print-text-muted space-y-1">
          <p>
            SECURITY NOTICE: This document contains synthetic data generated solely for system capability testing and evaluation. It is not connected to classified systems, weapon controls, or active military infrastructure.
          </p>
          <p>
            Generated via AEGIS GRID Offline Situational Awareness Console · Client-Side Execution Verified.
          </p>
        </div>
      </div>
    </div>
  );
};
