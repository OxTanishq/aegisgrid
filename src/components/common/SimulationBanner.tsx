import React, { useState } from 'react';
import { useAegis } from '../../context/AegisContext';
import {
  Play,
  Pause,
  Zap,
  Wifi,
  WifiOff,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Clock,
  Radio,
} from 'lucide-react';

export const SimulationBanner: React.FC = () => {
  const {
    isSimulationRunning,
    toggleSimulationRunning,
    simulationSpeed,
    setSimulationSpeed,
    isSimulatedOffline,
    toggleSimulatedOffline,
    isBrowserOnline,
    triggerManualEvent,
    resetToSeedData,
    appUptimeSeconds,
  } = useAegis();

  const [showEventMenu, setShowEventMenu] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#111922] border-b border-[#17232D] text-xs px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2.5 z-40 select-none">
      {/* Left: Simulation Notice and Network State */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded font-mono text-[11px] font-bold tracking-wider bg-[#FFBF69]/10 text-[#FFBF69] border border-[#FFBF69]/20">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FFBF69]" />
          OFFLINE DEMO PLATFORM
        </span>

        {/* Network status badges */}
        <div className="flex items-center gap-2 text-[#8495A5] text-[11px] font-mono">
          <span title="Click 'Simulate Offline' button to test losing connection">
            NETWORK LINK:{' '}
            <strong className={isSimulatedOffline ? 'text-[#FF6464]' : 'text-[#9FE870]'}>
              {isSimulatedOffline ? 'OFFLINE' : 'ONLINE'}
            </strong>
          </span>
          <span className="text-[#17232D]">|</span>
          <span title="Actual Device WiFi or Internet Connection">
            DEVICE INTERNET:{' '}
            <strong className={isBrowserOnline ? 'text-[#48DDF2]' : 'text-[#FFBF69]'}>
              {isBrowserOnline ? 'CONNECTED' : 'DISCONNECTED'}
            </strong>
          </span>
          <span className="text-[#17232D]">|</span>
          <span className="hidden sm:inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#8495A5]" />
            TIMER: {formatUptime(appUptimeSeconds)}
          </span>
        </div>
      </div>

      {/* Right: Simulation Controls */}
      <div className="flex items-center gap-2 flex-wrap ml-auto">
        {/* Toggle Simulated Offline */}
        <button
          onClick={toggleSimulatedOffline}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
            isSimulatedOffline
              ? 'bg-[#FF6464]/15 text-[#FF6464] border border-[#FF6464]/30 hover:bg-[#FF6464]/25'
              : 'bg-[#17232D] text-[#8495A5] hover:text-[#F3F7FA] border border-transparent'
          }`}
          title="Simulate losing connection to test offline message queueing"
        >
          {isSimulatedOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
          <span className="hidden md:inline">{isSimulatedOffline ? 'Restore Connection' : 'Simulate Offline'}</span>
        </button>

        {/* Simulation Play / Pause */}
        <button
          onClick={toggleSimulationRunning}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-colors ${
            isSimulationRunning
              ? 'bg-[#9FE870]/15 text-[#9FE870] border border-[#9FE870]/30 hover:bg-[#9FE870]/25'
              : 'bg-[#FFBF69]/15 text-[#FFBF69] border border-[#FFBF69]/30 hover:bg-[#FFBF69]/25'
          }`}
          title={isSimulationRunning ? 'Pause background team updates' : 'Resume background team updates'}
        >
          {isSimulationRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isSimulationRunning ? 'Updates: On' : 'Updates: Paused'}</span>
        </button>

        {/* Speed Selector */}
        <div className="flex items-center bg-[#080D12] border border-[#17232D] rounded-lg p-0.5">
          {([1, 2, 5] as const).map((spd) => (
            <button
              key={spd}
              onClick={() => setSimulationSpeed(spd)}
              className={`px-2 py-0.5 text-[10px] font-mono rounded-md transition-colors ${
                simulationSpeed === spd
                  ? 'bg-[#17232D] text-[#48DDF2] font-black'
                  : 'text-[#8495A5] hover:text-[#F3F7FA]'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Trigger Event Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowEventMenu(!showEventMenu)}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#17232D] hover:bg-[#1f2f3d] text-[#48DDF2] rounded-lg text-xs font-mono font-bold transition-colors border border-[#48DDF2]/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Test Events</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showEventMenu && (
            <div className="absolute right-0 mt-1 w-56 bg-[#111922] border border-[#17232D] rounded-xl shadow-2xl py-1 z-50 text-xs font-mono">
              <button
                onClick={() => {
                  triggerManualEvent('checkin');
                  setShowEventMenu(false);
                }}
                className="w-full text-left px-3.5 py-2 text-[#F3F7FA] hover:bg-[#17232D] flex items-center gap-2"
              >
                <Radio className="w-3.5 h-3.5 text-[#9FE870]" />
                Receive Teammate Check-in
              </button>
              <button
                onClick={() => {
                  triggerManualEvent('message');
                  setShowEventMenu(false);
                }}
                className="w-full text-left px-3.5 py-2 text-[#F3F7FA] hover:bg-[#17232D] flex items-center gap-2"
              >
                <Zap className="w-3.5 h-3.5 text-[#48DDF2]" />
                Receive Teammate Message
              </button>
              <button
                onClick={() => {
                  triggerManualEvent('alert');
                  setShowEventMenu(false);
                }}
                className="w-full text-left px-3.5 py-2 text-[#F3F7FA] hover:bg-[#17232D] flex items-center gap-2"
              >
                <WifiOff className="w-3.5 h-3.5 text-[#FFBF69]" />
                Receive Safety Alert
              </button>
            </div>
          )}
        </div>

        {/* Reset Demo State Button */}
        <button
          onClick={() => setShowResetConfirm(true)}
          className="flex items-center gap-1 px-2.5 py-1 bg-[#17232D]/60 hover:bg-[#FF6464]/20 hover:text-[#FF6464] text-[#8495A5] rounded-lg text-xs transition-colors"
          title="Reset demo data to initial factory state"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Reset</span>
        </button>
      </div>

      {/* Confirmation Modal for Reset */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#111922] border border-[#FF6464]/40 rounded-2xl p-5 shadow-2xl space-y-4">
            <h4 className="text-sm font-bold text-[#FF6464] flex items-center gap-2 font-display">
              <RotateCcw className="w-4 h-4" />
              Reset Demonstration State?
            </h4>
            <p className="text-xs text-[#8495A5] leading-relaxed">
              This will restore all 12 participants, tasks, messages, squads, and alerts back to the original demo values.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 text-xs text-[#8495A5] hover:text-[#F3F7FA] bg-[#17232D] rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowResetConfirm(false);
                  await resetToSeedData();
                }}
                className="px-4 py-1.5 text-xs font-black text-[#080D12] bg-[#FF6464] hover:bg-[#FF6464]/90 rounded-lg"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
