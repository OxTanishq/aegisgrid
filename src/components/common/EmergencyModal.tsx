/**
 * AEGIS GRID — Emergency SOS & Sound-Event Distress Confirmation Modal
 */

import React, { useState, useEffect } from 'react';
import { useAegis } from '../../context/AegisContext';
import {
  AlertTriangle,
  Volume2,
  X,
  ShieldAlert,
  Clock,
  MapPin,
  Send,
  CheckCircle2,
} from 'lucide-react';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ isOpen, onClose }) => {
  const {
    userProfile,
    liveUserPosition,
    triggerEmergencySOS,
    distressModalOpen,
    soundDistressMetrics,
    confirmSoundEmergency,
    dismissSoundAlert,
  } = useAegis();

  const [countdown, setCountdown] = useState<number | null>(5);
  const [emergencyReason, setEmergencyReason] = useState<string>('Medical Injury / Physical Assistance');
  const [customNote, setCustomNote] = useState<string>('');

  // 5-second auto countdown for quick emergency broadcast
  useEffect(() => {
    if (!isOpen) {
      setCountdown(5);
      return;
    }

    if (countdown === null || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => (prev !== null && prev > 1 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, countdown]);

  const handleSendInstantSOS = async () => {
    const fullMessage = `${emergencyReason}${customNote ? `: ${customNote}` : ''}`;
    await triggerEmergencySOS(fullMessage);
    onClose();
  };

  // 1. Candidate Sound Event Distress Confirmation (if triggered by mic)
  if (distressModalOpen && soundDistressMetrics) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
        <div className="w-full max-w-md bg-[#111922] border-2 border-[#FF6464] rounded-2xl p-6 shadow-2xl space-y-5 animate-scaleUp">
          <div className="flex items-center gap-3 pb-3 border-b border-[#17232D]">
            <div className="p-3 bg-[#FF6464]/20 rounded-xl text-[#FF6464] animate-pulse">
              <Volume2 className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-[#FF6464] tracking-wider uppercase block">
                LOCAL SOUND DETECTOR ALERT
              </span>
              <h3 className="text-lg font-black font-display text-[#F3F7FA]">
                Possible Distress Noise Detected
              </h3>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#080D12] border border-[#17232D] space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-[#8495A5]">Confidence:</span>
              <span className="text-[#FFBF69] font-bold">{soundDistressMetrics.confidencePct}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8495A5]">Sound Level:</span>
              <span className="text-[#F3F7FA] font-bold">{soundDistressMetrics.currentDb} dB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8495A5]">Processing:</span>
              <span className="text-[#9FE870] font-bold">100% On-Device (Private)</span>
            </div>
          </div>

          <p className="text-xs text-[#8495A5] leading-relaxed">
            The on-device listener detected a sharp acoustic spike. Are you in need of emergency assistance?
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={dismissSoundAlert}
              className="py-3 bg-[#17232D] hover:bg-[#1f2f3d] text-xs font-bold font-display text-[#8495A5] hover:text-[#F3F7FA] rounded-xl transition-all"
            >
              False Alarm (I’m OK)
            </button>
            <button
              onClick={confirmSoundEmergency}
              className="py-3 bg-[#FF6464] hover:bg-[#ff4d4d] text-[#080D12] font-black font-display text-xs rounded-xl shadow-lg shadow-[#FF6464]/30 transition-all"
            >
              YES, BROADCAST SOS
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Manual Emergency SOS Trigger Dialog
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-lg bg-[#111922] border-2 border-[#FF6464] rounded-2xl p-6 shadow-2xl space-y-5 animate-scaleUp">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#17232D]">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FF6464]/20 rounded-xl text-[#FF6464]">
              <ShieldAlert className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-[#FF6464] tracking-wider uppercase block">
                PRIORITY TACTICAL ALERT
              </span>
              <h3 className="text-xl font-black font-display text-[#F3F7FA]">
                Confirm Emergency SOS Broadcast
              </h3>
            </div>
          </div>

          <button onClick={onClose} className="text-[#8495A5] hover:text-[#F3F7FA] p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Identity & Live Location Banner */}
        <div className="p-3.5 rounded-xl bg-[#080D12] border border-[#17232D] space-y-1.5 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-[#8495A5]">Operator:</span>
            <span className="text-[#48DDF2] font-bold">
              {userProfile.callsign} ({userProfile.displayName})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8495A5]">GPS Coordinates:</span>
            <span className="text-[#F3F7FA] font-bold">
              {liveUserPosition ? `${liveUserPosition.lat.toFixed(4)}, ${liveUserPosition.lng.toFixed(4)}` : '35.3314 N, 120.6985 W'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8495A5]">GPS Accuracy:</span>
            <span className="text-[#9FE870] font-bold">
              {liveUserPosition?.accuracy || 5} meters
            </span>
          </div>
        </div>

        {/* Emergency Category */}
        <div className="space-y-1.5 text-xs">
          <label className="text-[#8495A5] font-bold block">Assistance Category</label>
          <select
            value={emergencyReason}
            onChange={(e) => setEmergencyReason(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#080D12] border border-[#17232D] text-[#F3F7FA] rounded-xl outline-none"
          >
            <option value="Medical Injury / Physical Assistance">Medical Injury / Physical Assistance</option>
            <option value="Severe Hazard / Blocked Route">Severe Hazard / Blocked Route</option>
            <option value="Communication Equipment Failure">Communication Equipment Failure</option>
            <option value="Impaired Mobility / Gear Lost">Impaired Mobility / Gear Lost</option>
            <option value="Immediate Extraction Needed">Immediate Extraction Needed</option>
          </select>
        </div>

        {/* Additional Note */}
        <div className="space-y-1.5 text-xs">
          <label className="text-[#8495A5] font-bold block">Situation Details (Optional)</label>
          <input
            type="text"
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder="e.g. Left leg injured, resting next to boulder..."
            className="w-full px-3.5 py-2 bg-[#080D12] border border-[#17232D] text-[#F3F7FA] rounded-xl outline-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#17232D]">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-[#17232D] hover:bg-[#1f2f3d] text-xs font-bold font-display text-[#8495A5] hover:text-[#F3F7FA] rounded-xl transition-all"
          >
            Cancel
          </button>

          <button
            onClick={handleSendInstantSOS}
            className="flex-1 py-3 bg-[#FF6464] hover:bg-[#ff4d4d] text-[#080D12] font-black font-display text-xs rounded-xl shadow-lg shadow-[#FF6464]/30 transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4 stroke-[3]" />
            <span>
              TRANSMIT EMERGENCY SOS NOW {countdown !== null && countdown > 0 ? `(${countdown}s)` : ''}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
