import React, { useState, useMemo } from 'react';
import { useAegis } from '../../context/AegisContext';
import { Alert, AlertSeverity } from '../../types';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Trash2,
  Filter,
  ShieldAlert,
  Clock,
  Radio,
  X,
  Check,
} from 'lucide-react';

export const AlertsView: React.FC = () => {
  const {
    alerts,
    acknowledgeAlert,
    dismissAlert,
    clearResolvedAlerts,
    addToast,
    settings,
    updateSettings,
  } = useAegis();

  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Request browser notification permission
  const handleRequestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      addToast('warning', 'Notifications Unsupported', 'Your browser does not support Web Notifications.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await updateSettings({ browserNotifications: true });
        addToast('success', 'Notifications Enabled', 'Tactical priority alerts will notify your system.');
        new Notification('AEGIS GRID Alert System', {
          body: 'Local notification test successful. Operational link active.',
          icon: '/icon.svg',
        });
      } else {
        await updateSettings({ browserNotifications: false });
        addToast('info', 'Permission Denied', 'Alerts will display in-app only.');
      }
    } catch (err) {
      console.warn('Notification permission error:', err);
    }
  };

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
      if (statusFilter === 'unresolved' && a.resolved) return false;
      if (statusFilter === 'resolved' && !a.resolved) return false;
      return true;
    });
  }, [alerts, severityFilter, statusFilter]);

  const unresolvedCount = alerts.filter((a) => !a.resolved).length;
  const criticalCount = alerts.filter((a) => !a.resolved && a.severity === 'Critical').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#17232D] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#8495A5] mb-1">
            <span>NOTIFICATIONS & SAFETY</span>
            <span>·</span>
            <span>{unresolvedCount} PENDING ATTENTION</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#F3F7FA] font-display flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-[#FFBF69]" />
            Safety Alerts & Warnings
          </h1>
          <p className="text-xs text-[#8495A5] mt-1">
            Stay aware of urgent team messages, low battery warnings, or radio interruptions.
          </p>
        </div>

        {/* Notification permission button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRequestNotificationPermission}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#17232D] hover:bg-[#1f2f3d] text-xs font-bold font-display text-[#48DDF2] rounded-xl transition-all border border-[#48DDF2]/30 active:scale-95"
          >
            <Bell className="w-4 h-4" />
            {settings.browserNotifications ? 'Notifications Active' : 'Enable Device Alerts'}
          </button>

          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#111922] hover:bg-[#FF6464]/20 text-[#8495A5] hover:text-[#FF6464] text-xs font-bold font-display rounded-xl transition-all border border-[#17232D]"
          >
            <Trash2 className="w-4 h-4" />
            Clear Resolved
          </button>
        </div>
      </div>

      {/* KPI Alert Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-[#111922] border border-[#17232D]">
          <span className="text-[11px] font-medium text-[#8495A5] block mb-1">Critical Incidents</span>
          <span className={`text-xl font-mono font-bold ${criticalCount > 0 ? 'text-[#FF6464]' : 'text-[#9FE870]'}`}>
            {criticalCount}
          </span>
          <span className="text-[10px] text-[#8495A5] block mt-0.5">Immediate intervention required</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#111922] border border-[#17232D]">
          <span className="text-[11px] font-medium text-[#8495A5] block mb-1">Unresolved Total</span>
          <span className="text-xl font-mono font-bold text-[#FFBF69]">{unresolvedCount}</span>
          <span className="text-[10px] text-[#8495A5] block mt-0.5">Pending operative acknowledgment</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#111922] border border-[#17232D]">
          <span className="text-[11px] font-medium text-[#8495A5] block mb-1">Resolved History</span>
          <span className="text-xl font-mono font-bold text-[#9FE870]">
            {alerts.filter((a) => a.resolved).length}
          </span>
          <span className="text-[10px] text-[#8495A5] block mt-0.5">Archived local events</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#111922] border border-[#17232D] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {(['unresolved', 'resolved', 'all'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-mono capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-[#17232D] text-[#F3F7FA] font-bold border border-[#48DDF2]/30'
                  : 'text-[#8495A5] hover:text-[#F3F7FA]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#080D12] border border-[#17232D] text-xs text-[#8495A5] hover:text-[#F3F7FA] rounded-lg px-2.5 py-1.5 outline-none font-mono"
          >
            <option value="all">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="Warning">Warning</option>
            <option value="Informational">Informational</option>
          </select>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-[#111922] border border-[#17232D] text-xs text-[#8495A5] space-y-2">
            <CheckCircle2 className="w-8 h-8 text-[#9FE870] mx-auto" />
            <p className="text-sm font-semibold text-[#F3F7FA]">No alerts matching selection.</p>
            <p>All monitored system invariants nominal.</p>
          </div>
        ) : (
          filteredAlerts.map((alt) => {
            let borderColor = 'border-[#17232D]';
            let badgeColor = 'text-[#48DDF2] bg-[#48DDF2]/10 border-[#48DDF2]/20';
            if (alt.severity === 'Critical') {
              borderColor = 'border-[#FF6464]/30 bg-[#FF6464]/5';
              badgeColor = 'text-[#FF6464] bg-[#FF6464]/10 border-[#FF6464]/20';
            } else if (alt.severity === 'Warning') {
              borderColor = 'border-[#FFBF69]/30 bg-[#FFBF69]/5';
              badgeColor = 'text-[#FFBF69] bg-[#FFBF69]/10 border-[#FFBF69]/20';
            }

            return (
              <div
                key={alt.id}
                onClick={() => setSelectedAlert(alt)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${borderColor} hover:border-[#48DDF2]/50 bg-[#111922] flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    <span className={`px-2 py-0.5 rounded font-bold uppercase border ${badgeColor}`}>
                      {alt.severity}
                    </span>
                    <span className="text-[#8495A5] uppercase">TYPE: {alt.type}</span>
                    <span className="text-[#8495A5]">·</span>
                    <span className="text-[#8495A5]">
                      {new Date(alt.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#F3F7FA]">{alt.title}</h3>
                  <p className="text-xs text-[#8495A5] leading-relaxed max-w-3xl">
                    {alt.message}
                  </p>
                </div>

                {/* Status and Action Buttons */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#17232D]"
                >
                  {!alt.acknowledged && (
                    <button
                      onClick={() => acknowledgeAlert(alt.id)}
                      className="px-3 py-1.5 rounded bg-[#17232D] hover:bg-[#1f2f3d] text-xs font-mono text-[#F3F7FA] transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}

                  {!alt.resolved ? (
                    <button
                      onClick={() => dismissAlert(alt.id)}
                      className="px-3 py-1.5 rounded bg-[#9FE870]/15 hover:bg-[#9FE870]/25 text-[#9FE870] border border-[#9FE870]/30 text-xs font-mono font-semibold transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Resolve
                    </button>
                  ) : (
                    <span className="text-xs font-mono text-[#9FE870] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Resolved
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#111922] border border-[#17232D] rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-[#17232D]">
              <div>
                <span className="text-xs font-mono text-[#FFBF69] uppercase tracking-wide">
                  {selectedAlert.severity} ALERT · {selectedAlert.type}
                </span>
                <h3 className="text-base font-bold text-[#F3F7FA] mt-0.5">
                  {selectedAlert.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-[#8495A5] hover:text-[#F3F7FA]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-[#8495A5]">
              <p className="bg-[#080D12] p-3 rounded-lg border border-[#17232D] text-[#F3F7FA]">
                {selectedAlert.message}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-[#080D12] border border-[#17232D]">
                  <span className="text-[10px] text-[#8495A5] block">TIMESTAMP</span>
                  <span className="text-[#F3F7FA]">
                    {new Date(selectedAlert.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="p-2 rounded bg-[#080D12] border border-[#17232D]">
                  <span className="text-[10px] text-[#8495A5] block">ACKNOWLEDGED</span>
                  <span className={selectedAlert.acknowledged ? 'text-[#9FE870]' : 'text-[#FFBF69]'}>
                    {selectedAlert.acknowledged ? 'YES' : 'PENDING'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#17232D] flex items-center justify-between">
              {!selectedAlert.acknowledged && (
                <button
                  onClick={() => {
                    acknowledgeAlert(selectedAlert.id);
                    setSelectedAlert((prev) => prev ? { ...prev, acknowledged: true } : null);
                  }}
                  className="px-3 py-1.5 bg-[#17232D] hover:bg-[#1f2f3d] text-xs font-mono text-[#F3F7FA] rounded"
                >
                  Acknowledge Alert
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                {!selectedAlert.resolved && (
                  <button
                    onClick={() => {
                      dismissAlert(selectedAlert.id);
                      setSelectedAlert(null);
                    }}
                    className="px-4 py-1.5 text-xs font-semibold text-[#080D12] bg-[#9FE870] hover:bg-[#9FE870]/90 rounded"
                  >
                    Mark Resolved
                  </button>
                )}
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="px-3 py-1.5 text-xs text-[#8495A5] hover:text-[#F3F7FA] bg-[#17232D] rounded"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear Confirmation */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#111922] border border-[#17232D] rounded-xl p-5 shadow-2xl space-y-4">
            <h4 className="text-sm font-semibold text-[#FF6464] flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Clear Resolved Alerts?
            </h4>
            <p className="text-xs text-[#8495A5]">
              This will remove all resolved alerts from your local IndexedDB storage ledger.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 text-xs text-[#8495A5] hover:text-[#F3F7FA] bg-[#17232D] rounded"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowClearConfirm(false);
                  await clearResolvedAlerts();
                }}
                className="px-4 py-1.5 text-xs font-semibold text-[#080D12] bg-[#FF6464] hover:bg-[#FF6464]/90 rounded"
              >
                Confirm Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
