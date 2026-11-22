// All sound is synthesised with WebAudio: no audio files, no network.
export class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.alarmOn = false;
    this.alarmNodes = null;
  }

  unlock() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
      } catch (e) {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  tone(freq, dur, type, vol, slideTo) {
    if (!this.ctx || this.muted) return;
    try {
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      g.gain.setValueAtTime(vol || 0.12, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(this.ctx.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
    } catch (e) { /* headless or blocked: stay silent */ }
  }

  noise(dur, vol, filterFreq) {
    if (!this.ctx || this.muted) return;
    try {
      const t = this.ctx.currentTime;
      const len = Math.floor(this.ctx.sampleRate * dur);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = filterFreq || 1200;
      const g = this.ctx.createGain();
      g.gain.value = vol || 0.1;
      src.connect(f).connect(g).connect(this.ctx.destination);
      src.start(t);
    } catch (e) { /* silent */ }
  }

  step(sneaking) {
    this.tone(sneaking ? 140 : 180, 0.05, 'triangle', sneaking ? 0.02 : 0.035);
  }

  pickup(kind) {
    if (kind === 'gem') { this.tone(880, 0.12, 'sine', 0.14); this.tone(1320, 0.18, 'sine', 0.1); }
    else if (kind === 'coin') this.tone(1568, 0.1, 'square', 0.06);
    else if (kind === 'bar') { this.tone(660, 0.1, 'triangle', 0.12); this.tone(990, 0.14, 'triangle', 0.1); }
    else this.tone(1046, 0.2, 'sine', 0.14);
  }

  coin() {
    this.tone(2400, 0.08, 'square', 0.05, 1800);
    setTimeout(() => this.tone(1800, 0.1, 'square', 0.05, 1200), 90);
  }

  smoke() {
    this.noise(0.5, 0.12, 900);
  }

  vaultTick() {
    this.tone(1200, 0.05, 'square', 0.05);
  }

  vaultOpen() {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.18, 'sine', 0.12), i * 90));
  }

  caught() {
    this.tone(220, 0.5, 'sawtooth', 0.16, 55);
    this.noise(0.3, 0.14, 500);
  }

  win() {
    [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => this.tone(f, 0.25, 'triangle', 0.12), i * 110));
  }

  alarmStart() {
    if (!this.ctx || this.muted || this.alarmOn) return;
    try {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.value = 620;
      g.gain.value = 0.03;
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.value = 2.2;
      lfoGain.gain.value = 180;
      lfo.connect(lfoGain).connect(o.frequency);
      o.connect(g).connect(this.ctx.destination);
      o.start();
      lfo.start();
      this.alarmNodes = { o, lfo, g };
      this.alarmOn = true;
    } catch (e) { /* silent */ }
  }

  alarmStop() {
    if (!this.alarmNodes) return;
    try {
      this.alarmNodes.o.stop();
      this.alarmNodes.lfo.stop();
      this.alarmNodes.g.disconnect();
    } catch (e) { /* already stopped */ }
    this.alarmNodes = null;
    this.alarmOn = false;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this.alarmStop();
    return this.muted;
  }
}
