/* ==========================================================================
   TypeVault - Procedural Mechanical Keyboard Sound Synthesizer
   ========================================================================== */

class SoundSynthesizer {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.volume = 0.4;
    this.soundType = 'blue'; // 'blue', 'brown', 'linear', 'beep'
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setConfig(enabled, soundType, volume) {
    this.enabled = enabled;
    this.soundType = soundType;
    this.volume = typeof volume === 'number' ? Math.max(0, Math.min(1, volume)) : 0.4;
  }

  playKey(isError = false, isSpace = false) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    if (isError) {
      this.playErrorBuzz();
      return;
    }

    if (isSpace) {
      this.playSpaceClack();
      return;
    }

    switch (this.soundType) {
      case 'blue':
        this.playClickyBlue();
        break;
      case 'brown':
        this.playTactileBrown();
        break;
      case 'linear':
        this.playThockyLinear();
        break;
      case 'beep':
        this.playSubtleBeep();
        break;
      default:
        this.playClickyBlue();
    }
  }

  playClickyBlue() {
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // High transient snap
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1800 + Math.random() * 400, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.035);

    gain.gain.setValueAtTime(this.volume * 0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.045);
  }

  playTactileBrown() {
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(650 + Math.random() * 150, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.04);

    gain.gain.setValueAtTime(this.volume * 0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  playThockyLinear() {
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, t);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320 + Math.random() * 80, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.05);

    gain.gain.setValueAtTime(this.volume * 0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.055);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  playSpaceClack() {
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280 + Math.random() * 50, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.06);

    gain.gain.setValueAtTime(this.volume * 0.85, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.065);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  playErrorBuzz() {
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);

    gain.gain.setValueAtTime(this.volume * 0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.085);
  }

  playSubtleBeep() {
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);

    gain.gain.setValueAtTime(this.volume * 0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.035);
  }
}

export const Sound = new SoundSynthesizer();
