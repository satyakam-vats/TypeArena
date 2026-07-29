export class SoundManager {
  private ctx: AudioContext | null = null;
  private volume: number = 0.5;
  private isEnabled: boolean = false;

  constructor() {}

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.ctx;
  }

  setVolume(volume: number) {
    this.volume = volume;
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (enabled && this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private playTone(frequency: number, type: OscillatorType, duration: number, volMultiplier: number = 1) {
    if (!this.isEnabled || this.volume <= 0) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      
      gain.gain.setValueAtTime(this.volume * volMultiplier, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.error("Audio error", e);
    }
  }

  playKeystroke() {
    this.playTone(800, 'sine', 0.02, 0.2);
  }

  playError() {
    this.playTone(150, 'sawtooth', 0.1, 0.4);
  }

  playCountdown() {
    this.playTone(600, 'sine', 0.1, 0.3);
  }

  playComplete() {
    if (!this.isEnabled || this.volume <= 0) return;
    try {
      const ctx = this.getContext();
      
      const playNote = (freq: number, startTime: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(this.volume * 0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.3);
      };

      playNote(523.25, ctx.currentTime);
      playNote(659.25, ctx.currentTime + 0.15);
    } catch (e) {
      console.error("Audio error", e);
    }
  }

  playClick() {
    this.playTone(1000, 'sine', 0.03, 0.2);
  }
}

export const soundManager = new SoundManager();
