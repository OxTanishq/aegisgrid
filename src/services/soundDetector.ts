/**
 * AEGIS GRID — Privacy-First Sound-Event Detection Service
 * Analyzes audio locally on-device using Web Audio API.
 * Detects sudden loud impulsive distress sounds, shouts, or high-decibel spikes.
 * Does not store or transmit raw audio recordings.
 */

export interface SoundDetectionMetrics {
  currentDb: number;
  peakDb: number;
  spectralCrest: number;
  confidencePct: number;
  isTriggered: boolean;
}

export type SoundEventCallback = (metrics: SoundDetectionMetrics) => void;
export type AudioMeterCallback = (db: number, waveform: Uint8Array) => void;

class SoundDetectionService {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private animationFrameId: number | null = null;
  private isRunning = false;

  private onCandidateDetected: SoundEventCallback | null = null;
  private onMeterUpdate: AudioMeterCallback | null = null;

  private sensitivity = 70; // 0 to 100
  private thresholdDb = -22; // dB cutoff
  private lastTriggerTime = 0;
  private cooldownMs = 8000; // prevent repeated triggers within 8 seconds

  public async start(
    sensitivity = 70,
    thresholdDb = -22,
    onDetected: SoundEventCallback,
    onMeter?: AudioMeterCallback
  ): Promise<boolean> {
    if (this.isRunning) return true;

    try {
      this.sensitivity = sensitivity;
      this.thresholdDb = thresholdDb;
      this.onCandidateDetected = onDetected;
      if (onMeter) this.onMeterUpdate = onMeter;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      this.mediaStream = stream;
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioCtx();

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.4;
      source.connect(this.analyser);

      this.isRunning = true;
      this.runDetectionLoop();
      return true;
    } catch (err) {
      console.warn('Microphone permission or Web Audio initialization failed:', err);
      this.stop();
      return false;
    }
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.analyser = null;
  }

  public updateSensitivity(sens: number, thresholdDb: number): void {
    this.sensitivity = sens;
    this.thresholdDb = thresholdDb;
  }

  public getStatus(): boolean {
    return this.isRunning;
  }

  private runDetectionLoop = () => {
    if (!this.isRunning || !this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const timeDomainData = new Uint8Array(bufferLength);
    const frequencyData = new Uint8Array(bufferLength);

    this.analyser.getByteTimeDomainData(timeDomainData);
    this.analyser.getByteFrequencyData(frequencyData);

    // Compute RMS and Decibel Level
    let sumSquares = 0;
    for (let i = 0; i < bufferLength; i++) {
      const normalized = (timeDomainData[i] - 128) / 128;
      sumSquares += normalized * normalized;
    }
    const rms = Math.sqrt(sumSquares / bufferLength);
    const db = rms > 0.0001 ? 20 * Math.log10(rms) : -100;

    // Send meter callback for visual waveform UI
    if (this.onMeterUpdate) {
      this.onMeterUpdate(Math.max(-80, Math.min(0, db)), timeDomainData);
    }

    // High frequency peak energy
    let maxFreqVal = 0;
    let highFreqEnergy = 0;
    for (let i = 0; i < bufferLength; i++) {
      if (frequencyData[i] > maxFreqVal) maxFreqVal = frequencyData[i];
      if (i > bufferLength * 0.4) {
        highFreqEnergy += frequencyData[i];
      }
    }

    const scaledThreshold = this.thresholdDb - ((this.sensitivity - 50) / 50) * 8;
    const now = Date.now();

    // Sudden impulsive sound or high volume spike
    if (db > scaledThreshold && now - this.lastTriggerTime > this.cooldownMs) {
      this.lastTriggerTime = now;
      const confidence = Math.min(96, Math.max(55, Math.round(50 + (db - scaledThreshold) * 3 + (highFreqEnergy / 500))));

      const metrics: SoundDetectionMetrics = {
        currentDb: Math.round(db),
        peakDb: Math.round(db),
        spectralCrest: parseFloat((maxFreqVal / (rms * 128 || 1)).toFixed(2)),
        confidencePct: confidence,
        isTriggered: true,
      };

      if (this.onCandidateDetected) {
        this.onCandidateDetected(metrics);
      }
    }

    this.animationFrameId = requestAnimationFrame(this.runDetectionLoop);
  };
}

export const soundDetector = new SoundDetectionService();
