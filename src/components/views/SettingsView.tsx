/**
 * AEGIS GRID — Settings & Account Security
 * Includes Profile, Two-Step Verification (TOTP 2FA), Sound-Event Detection,
 * Device Session Management, and Offline Database Diagnostics.
 */

import React, { useState, useEffect } from 'react';
import { useAegis } from '../../context/AegisContext';
import { DemoRole } from '../../types';
import { generateBase32Secret, getOtpAuthUri } from '../../services/totp';
import {
  Settings,
  User,
  Shield,
  Sliders,
  RotateCcw,
  Database,
  Download,
  Bell,
  CheckCircle2,
  Lock,
  Key,
  Smartphone,
  Volume2,
  Trash2,
  Copy,
  AlertTriangle,
  QrCode,
  HardDrive,
  X,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    userProfile,
    updateUserProfile,
    settings,
    updateSettings,
    twoFactorState,
    enable2FA,
    disable2FA,
    verify2FACode,
    revokeSession,
    isSoundDetectionActive,
    toggleSoundDetection,
    resetToSeedData,
    addToast,
  } = useAegis();

  // Local form drafts
  const [displayName, setDisplayName] = useState(userProfile.displayName);
  const [callsign, setCallsign] = useState(userProfile.callsign);
  const [role, setRole] = useState<DemoRole>(userProfile.role);

  // 2FA Setup Modal/Drawer State
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [draftSecret, setDraftSecret] = useState('');
  const [testOtpCode, setTestOtpCode] = useState('');
  const [otpVerifyError, setOtpVerifyError] = useState(false);

  // Sound Detection Draft
  const [soundSensitivity, setSoundSensitivity] = useState(settings.soundDetection.sensitivity);
  const [autoEscalate, setAutoEscalate] = useState(settings.soundDetection.autoEscalate);

  // Storage estimation
  const [storageInfo, setStorageInfo] = useState<{
    usageMb: number;
    quotaMb: number;
    pct: number;
  }>({
    usageMb: 0,
    quotaMb: 0,
    pct: 0,
  });

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then((est) => {
        const usage = (est.usage || 0) / (1024 * 1024);
        const quota = (est.quota || 0) / (1024 * 1024);
        const pct = quota > 0 ? (usage / quota) * 100 : 0;
        setStorageInfo({
          usageMb: parseFloat(usage.toFixed(2)),
          quotaMb: parseFloat(quota.toFixed(0)),
          pct: parseFloat(pct.toFixed(2)),
        });
      });
    }
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfile({
      displayName: displayName.trim(),
      callsign: callsign.trim(),
      role,
    });
  };

  const handleOpen2FASetup = () => {
    const newSecret = generateBase32Secret(16);
    setDraftSecret(newSecret);
    setTestOtpCode('');
    setOtpVerifyError(false);
    setShow2FASetup(true);
  };

  const handleConfirm2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await enable2FA(draftSecret, testOtpCode);
    if (success) {
      setShow2FASetup(false);
    } else {
      setOtpVerifyError(true);
    }
  };

  const handleSaveSoundConfig = async () => {
    await updateSettings({
      soundDetection: {
        ...settings.soundDetection,
        sensitivity: soundSensitivity,
        autoEscalate,
      },
    });
    addToast('success', 'Sound Detection Saved', 'Microphone listener preferences updated.');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#17232D] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#8495A5] mb-1">
            <span>PREFERENCES & ACCOUNT SECURITY</span>
            <span>·</span>
            <span>TWO-STEP VERIFICATION</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#F3F7FA] font-display flex items-center gap-3">
            <Settings className="w-8 h-8 text-[#48DDF2]" />
            Settings & Security Console
          </h1>
          <p className="text-xs text-[#8495A5] mt-1">
            Manage your credentials, two-step verification, sound-event detection, and offline database storage.
          </p>
        </div>

        <button
          onClick={() => setShowResetConfirm(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-[#17232D] hover:bg-[#FF6464]/20 text-xs font-bold font-display text-[#8495A5] hover:text-[#FF6464] rounded-xl transition-all border border-[#17232D] active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Demo Data
        </button>
      </div>

      {/* 1. Two-Step Verification (2FA) & Account Security */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#111922] border border-[#17232D] space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#48DDF2]/15 text-[#48DDF2] rounded-xl">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black font-display text-[#F3F7FA]">
                Two-Step Verification (2FA)
              </h3>
              <p className="text-xs text-[#8495A5]">
                Protects mission communications with RFC 6238 time-based authenticator codes (TOTP).
              </p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border ${
              twoFactorState.enabled
                ? 'bg-[#9FE870]/20 text-[#9FE870] border-[#9FE870]/40'
                : 'bg-[#FFBF69]/20 text-[#FFBF69] border-[#FFBF69]/40'
            }`}
          >
            {twoFactorState.enabled ? 'PROTECTED (2FA ACTIVE)' : 'NOT CONFIGURED'}
          </span>
        </div>

        {/* 2FA Controls */}
        <div className="p-4 rounded-xl bg-[#080D12] border border-[#17232D] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-[#F3F7FA] font-bold block mb-0.5">
              Authenticator App (Google Authenticator / 1Password)
            </span>
            <span className="text-[#8495A5]">
              {twoFactorState.enabled
                ? 'Standard 30-second rotating 6-digit cryptographic verification enabled.'
                : 'Set up an authenticator app for secure two-step login verification.'}
            </span>
          </div>

          {twoFactorState.enabled ? (
            <button
              onClick={disable2FA}
              className="px-4 py-2 bg-[#17232D] hover:bg-[#FF6464]/20 text-xs font-bold font-display text-[#FF6464] rounded-xl transition-all border border-[#17232D]"
            >
              Disable 2FA
            </button>
          ) : (
            <button
              onClick={handleOpen2FASetup}
              className="px-4 py-2 bg-[#48DDF2] hover:bg-[#48DDF2]/90 text-[#080D12] text-xs font-black font-display rounded-xl shadow-md transition-all"
            >
              Enable Two-Step Verification
            </button>
          )}
        </div>

        {/* One-Time Backup Recovery Codes */}
        {twoFactorState.enabled && (
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold text-[#8495A5] uppercase tracking-wider block">
              Emergency One-Time Recovery Codes
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {twoFactorState.backupCodes.map((bc, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-[#080D12] border border-[#17232D] text-center font-mono text-xs text-[#F3F7FA]"
                >
                  <Key className="w-3 h-3 text-[#48DDF2] mx-auto mb-1" />
                  <span>{bc.plainCodeSnippet}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Authorized Device Sessions */}
        <div className="space-y-2 pt-2 border-t border-[#17232D]">
          <span className="text-xs font-mono font-bold text-[#8495A5] uppercase tracking-wider block">
            Authorized Device Sessions ({twoFactorState.activeSessions.length})
          </span>
          <div className="space-y-2">
            {twoFactorState.activeSessions.map((sess) => (
              <div
                key={sess.id}
                className="p-3 rounded-xl bg-[#080D12] border border-[#17232D] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <Smartphone className="w-4 h-4 text-[#48DDF2]" />
                  <div>
                    <span className="font-bold text-[#F3F7FA] block">
                      {sess.deviceName} {sess.isCurrent && '(This Browser)'}
                    </span>
                    <span className="text-[10px] font-mono text-[#8495A5]">
                      IP: {sess.ip} · Last active: {new Date(sess.lastActive).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {!sess.isCurrent && (
                  <button
                    onClick={() => revokeSession(sess.id)}
                    className="px-2.5 py-1 text-[11px] font-mono text-[#FF6464] hover:bg-[#FF6464]/10 rounded border border-[#FF6464]/30"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Privacy-First Sound-Event Detection */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#111922] border border-[#17232D] space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#FFBF69]/15 text-[#FFBF69] rounded-xl">
              <Volume2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black font-display text-[#F3F7FA]">
                Privacy-First Sound-Event Detection
              </h3>
              <p className="text-xs text-[#8495A5]">
                Acoustic analysis processed 100% on-device. Listens for sudden impulsive distress noises.
              </p>
            </div>
          </div>

          <button
            onClick={toggleSoundDetection}
            className={`px-4 py-2 rounded-xl text-xs font-black font-display transition-all ${
              isSoundDetectionActive
                ? 'bg-[#FF6464] text-[#080D12]'
                : 'bg-[#17232D] text-[#8495A5] hover:text-[#F3F7FA] border border-[#17232D]'
            }`}
          >
            {isSoundDetectionActive ? 'Stop Listening' : 'Enable Detection'}
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <div className="flex justify-between text-[#8495A5] mb-1 font-mono">
              <span>Sensitivity Threshold:</span>
              <strong className="text-[#F3F7FA]">{soundSensitivity}%</strong>
            </div>
            <input
              type="range"
              min="20"
              max="95"
              value={soundSensitivity}
              onChange={(e) => setSoundSensitivity(Number(e.target.value))}
              className="w-full accent-[#48DDF2]"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-[#080D12] border border-[#17232D]">
            <div>
              <span className="font-bold text-[#F3F7FA] block">Automated SOS Escalation</span>
              <span className="text-[11px] text-[#8495A5]">
                If a distress sound is detected and the 15s prompt is unanswered, automatically broadcast SOS.
              </span>
            </div>
            <input
              type="checkbox"
              checked={autoEscalate}
              onChange={(e) => setAutoEscalate(e.target.checked)}
              className="w-4 h-4 accent-[#48DDF2]"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveSoundConfig}
              className="px-4 py-2 bg-[#17232D] hover:bg-[#1f2f3d] text-xs font-bold font-display text-[#48DDF2] rounded-xl border border-[#48DDF2]/30"
            >
              Save Acoustic Preferences
            </button>
          </div>
        </div>
      </div>

      {/* 3. Operator Profile Settings */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#111922] border border-[#17232D] space-y-4">
        <h3 className="text-base font-black font-display text-[#F3F7FA] flex items-center gap-2">
          <User className="w-5 h-5 text-[#48DDF2]" />
          Operator Profile & Callsign
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[#8495A5] block mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 bg-[#080D12] border border-[#17232D] focus:border-[#48DDF2] rounded-lg text-[#F3F7FA] outline-none"
              />
            </div>
            <div>
              <label className="text-[#8495A5] block mb-1">Radio Callsign</label>
              <input
                type="text"
                value={callsign}
                onChange={(e) => setCallsign(e.target.value)}
                className="w-full px-3 py-2 bg-[#080D12] border border-[#17232D] focus:border-[#48DDF2] rounded-lg text-[#F3F7FA] outline-none font-mono font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-[#9FE870] hover:bg-[#9FE870]/90 text-[#080D12] font-black font-display text-xs rounded-xl shadow"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>

      {/* 4. Storage Diagnostics */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#111922] border border-[#17232D] space-y-4">
        <h3 className="text-base font-black font-display text-[#F3F7FA] flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-[#9FE870]" />
          Offline Storage Diagnostics
        </h3>

        <div className="grid grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 bg-[#080D12] rounded-xl border border-[#17232D]">
            <span className="text-[#8495A5] block text-[10px]">USED STORAGE</span>
            <strong className="text-sm text-[#48DDF2]">{storageInfo.usageMb} MB</strong>
          </div>
          <div className="p-3 bg-[#080D12] rounded-xl border border-[#17232D]">
            <span className="text-[#8495A5] block text-[10px]">QUOTA ALLOCATED</span>
            <strong className="text-sm text-[#F3F7FA]">{storageInfo.quotaMb} MB</strong>
          </div>
          <div className="p-3 bg-[#080D12] rounded-xl border border-[#17232D]">
            <span className="text-[#8495A5] block text-[10px]">CAPACITY USED</span>
            <strong className="text-sm text-[#9FE870]">{storageInfo.pct}%</strong>
          </div>
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {show2FASetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#111922] border-2 border-[#48DDF2] rounded-2xl p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-[#17232D]">
              <h4 className="text-base font-black font-display text-[#F3F7FA] flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#48DDF2]" />
                Configure Two-Step Verification
              </h4>
              <button
                onClick={() => setShow2FASetup(false)}
                className="text-[#8495A5] hover:text-[#F3F7FA]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#8495A5] leading-relaxed">
              Scan this key into Google Authenticator, Microsoft Authenticator, or 1Password, or enter the secret manually:
            </p>

            <div className="p-3.5 rounded-xl bg-[#080D12] border border-[#17232D] text-center font-mono space-y-1">
              <span className="text-[10px] text-[#8495A5] block uppercase">Base32 Secret Key</span>
              <strong className="text-base text-[#48DDF2] tracking-wider select-all block">
                {draftSecret}
              </strong>
            </div>

            <form onSubmit={handleConfirm2FA} className="space-y-3">
              <div>
                <label className="text-xs text-[#8495A5] block mb-1">
                  Enter 6-Digit Authenticator Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={testOtpCode}
                  onChange={(e) => {
                    setTestOtpCode(e.target.value);
                    setOtpVerifyError(false);
                  }}
                  placeholder="000000"
                  className="w-full text-center tracking-[0.4em] text-lg font-mono font-bold px-4 py-2 bg-[#080D12] border border-[#17232D] focus:border-[#48DDF2] rounded-xl text-[#F3F7FA] outline-none"
                />
                {otpVerifyError && (
                  <span className="text-[11px] text-[#FF6464] block mt-1">
                    Invalid code. Check your authenticator app time clock and try again.
                  </span>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#17232D]">
                <button
                  type="button"
                  onClick={() => setShow2FASetup(false)}
                  className="px-3 py-1.5 text-xs text-[#8495A5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#48DDF2] hover:bg-[#48DDF2]/90 text-[#080D12] font-black font-display text-xs rounded-xl shadow-lg"
                >
                  Confirm & Enable 2FA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Seed Confirmation */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#111922] border border-[#FF6464]/40 rounded-2xl p-5 shadow-2xl space-y-4">
            <h4 className="text-sm font-bold text-[#FF6464] flex items-center gap-2 font-display">
              <RotateCcw className="w-4 h-4" />
              Reset All Simulation Data?
            </h4>
            <p className="text-xs text-[#8495A5] leading-relaxed">
              This will reset IndexedDB back to original demonstration data and reload the page.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 text-xs text-[#8495A5]"
              >
                Cancel
              </button>
              <button
                onClick={resetToSeedData}
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
