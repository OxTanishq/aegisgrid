/**
 * AEGIS GRID — Tactical Emergency Audio Alert Synthesizer
 * Uses Web Audio API oscillators to generate emergency chimes and alarms without external audio files.
 */

class EmergencyAudioAlert {
  private audioCtx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  // Play high-priority SOS emergency siren sweep
  public playEmergencyAlert(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sine';

      // Urgent two-tone European / tactical warble (880Hz to 660Hz)
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.setValueAtTime(660, now + 0.25);
      osc1.frequency.setValueAtTime(880, now + 0.5);
      osc1.frequency.setValueAtTime(660, now + 0.75);

      osc2.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(330, now + 0.25);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.25, now + 0.05);
      gain.gain.setValueAtTime(0.25, now + 0.85);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.1);
      osc2.stop(now + 1.1);
    } catch (e) {
      console.warn('Audio alert playback error:', e);
    }
  }

  // Play subtle tactical radio ping
  public playRadioPing(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.12);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {}
  }
}

export const emergencyAudio = new EmergencyAudioAlert();
