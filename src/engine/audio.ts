/** Syntezator dźwięku i muzyki (WebAudio) — całość oryginalna, bez plików audio. */
export type SfxName =
  | 'jump' | 'land' | 'swing' | 'hit' | 'stomp' | 'pet' | 'can' | 'golden' | 'oneup' | 'spark' | 'teleport'
  | 'petrify' | 'checkpoint' | 'switch' | 'bossHit' | 'bossDie' | 'star' | 'powerup' | 'hurt' | 'die'
  | 'clear' | 'gameover' | 'menu' | 'select' | 'free' | 'crate' | 'beam' | 'warn' | 'break' | 'ecoport' | 'rock' | 'flash';

interface Track { bpm: number; wave: OscillatorType; lead: string; bass: string[]; drums: string; vol?: number; }

const T: Record<string, Track> = {
  title:  { bpm: 108, wave: 'square', lead: 'C5 . E5 . G5 . C6 . A5 . F5 . A5 . C6 . G5 . E5 . G5 . B5 . C6 . . . . . . .', bass: ['C2', 'F2', 'G2', 'C2'], drums: 'k...h...' },
  map:    { bpm: 100, wave: 'triangle', lead: 'E5 . G5 . A5 . G5 . F5 . A5 . C6 . A5 . D5 . F5 . G5 . F5 . E5 . G5 . C5 . . .', bass: ['C2', 'F2', 'G2', 'C2'], drums: 'k.......' },
  w1:     { bpm: 132, wave: 'square', lead: 'E5 G5 C6 G5 E5 G5 A5 . G5 E5 C5 E5 G5 . . . F5 A5 C6 A5 F5 A5 B5 . D6 B5 G5 B5 C6 . . .', bass: ['C2', 'A1', 'F2', 'G2'], drums: 'k.h.s.h.' },
  w2:     { bpm: 120, wave: 'sawtooth', lead: 'A4 . A4 C5 . A4 E5 . D5 . D5 F5 . D5 A5 . C5 . C5 E5 . C5 G5 . E5 . D5 . C5 . B4 .', bass: ['A1', 'D2', 'C2', 'E2'], drums: 'k.hks.h.', vol: 0.8 },
  w3:     { bpm: 126, wave: 'square', lead: 'G5 A5 B5 D6 B5 A5 G5 . F5 G5 A5 C6 A5 G5 F5 . E5 G5 B5 E6 B5 G5 E5 . D5 F#5 A5 D6 A5 F#5 D5 .', bass: ['G2', 'F2', 'E2', 'D2'], drums: 'k.h.sh.h' },
  w4:     { bpm: 100, wave: 'triangle', lead: 'D5 . F5 A5 . G5 F5 . E5 . G5 B5 . A5 G5 . F5 . A5 C6 . B5 A5 . G5 A5 B5 A5 G5 F5 E5 .', bass: ['D2', 'E2', 'F2', 'G2'], drums: 'k.......', vol: 1.1 },
  w5:     { bpm: 112, wave: 'square', lead: 'E5 F5 . A5 . G#5 F5 . E5 . F5 . G#5 B5 . . A5 . G#5 . F5 . E5 . D5 . E5 F5 E5 . . .', bass: ['E2', 'E2', 'A1', 'E2'], drums: 'k..hs.h.' },
  w6:     { bpm: 92, wave: 'triangle', lead: 'B4 . D5 . F#5 . E5 . D5 . B4 . A4 . . . G4 . B4 . D5 . C#5 . B4 . A4 . F#4 . . .', bass: ['B1', 'B1', 'G1', 'F#1'], drums: 'k.......', vol: 1.1 },
  w7:     { bpm: 140, wave: 'sawtooth', lead: 'E5 E5 G5 E5 B5 E5 A5 E5 D5 D5 F#5 D5 A5 D5 G5 D5 C5 C5 E5 C5 G5 C5 F#5 C5 B4 B4 D5 B4 F#5 B4 E5 .', bass: ['E2', 'D2', 'C2', 'B1'], drums: 'k.hksh.h', vol: 0.75 },
  w8:     { bpm: 96, wave: 'sawtooth', lead: 'C5 . . Eb5 . . D5 . C5 . . B4 . . . . Ab4 . . C5 . . Bb4 . G4 . . B4 . . . .', bass: ['C2', 'C2', 'Ab1', 'G1'], drums: 'k...k...', vol: 0.75 },
  w0:     { bpm: 124, wave: 'square', lead: 'C5 E5 C5 G4 C5 E5 G5 . F5 A5 F5 C5 F5 A5 C6 . G5 B5 G5 D5 G5 B5 D6 . C6 . G5 . E5 . C5 .', bass: ['C2', 'F2', 'G2', 'C2'], drums: 'k.h.s.h.' },
  boss:   { bpm: 150, wave: 'sawtooth', lead: 'A4 C5 E5 A5 G5 E5 C5 E5 G4 B4 D5 G5 F5 D5 B4 D5 F4 A4 C5 F5 E5 C5 A4 C5 E4 G#4 B4 E5 D5 B4 G#4 B4', bass: ['A1', 'G1', 'F1', 'E1'], drums: 'kkhksh.h', vol: 0.75 },
  star:   { bpm: 190, wave: 'square', lead: 'C5 E5 G5 C6 G5 E5 C5 E5 D5 F5 A5 D6 A5 F5 D5 F5 E5 G5 B5 E6 B5 G5 E5 G5 C6 G5 E5 C5 G5 E5 C5 .', bass: ['C2', 'D2', 'E2', 'C2'], drums: 'khkhshkh' },
};
export const TRACKS = Object.keys(T);

const NOTE: Record<string, number> = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
export function noteFreq(n: string): number {
  const m = /^([A-G][b#]?)(-?\d)$/.exec(n);
  if (!m) return 0;
  return 440 * Math.pow(2, (NOTE[m[1]] + (parseInt(m[2], 10) + 1) * 12 - 69) / 12);
}

export class AudioEngine {
  ctx: AudioContext | null = null;
  private master!: GainNode; private musicBus!: GainNode; private sfxBus!: GainNode;
  musicVol = 0.6; sfxVol = 0.8;
  private track: string | null = null; private step = 0; private nextT = 0; private timer: number | null = null;
  onSfx: ((n: SfxName) => void) | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private lastSfx = new Map<string, number>();

  unlock(): void {
    if (this.ctx) { if (this.ctx.state === 'suspended') void this.ctx.resume(); return; }
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    const c = this.ctx!;
    this.master = c.createGain(); this.master.gain.value = 0.9; this.master.connect(c.destination);
    this.musicBus = c.createGain(); this.sfxBus = c.createGain();
    this.musicBus.connect(this.master); this.sfxBus.connect(this.master);
    this.applyVolumes();
    const len = c.sampleRate; this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    if (this.track) { const t = this.track; this.track = null; this.music(t); }
  }
  setVolumes(music: number, sfx: number): void { this.musicVol = music; this.sfxVol = sfx; this.applyVolumes(); }
  private applyVolumes(): void { if (!this.ctx) return; this.musicBus.gain.value = this.musicVol * 0.28; this.sfxBus.gain.value = this.sfxVol * 0.7; }
  duck(on: boolean): void { if (this.ctx) this.musicBus.gain.setTargetAtTime(this.musicVol * (on ? 0.1 : 0.28), this.ctx.currentTime, 0.05); }

  // ---------- muzyka ----------
  music(name: string | null): void {
    if (name === this.track) return;
    this.track = name; this.step = 0;
    if (this.timer !== null) { clearInterval(this.timer); this.timer = null; }
    if (!name || !this.ctx || !T[name]) return;
    this.nextT = this.ctx.currentTime + 0.08;
    this.timer = window.setInterval(() => this.schedule(), 40);
  }
  get current(): string | null { return this.track; }
  private schedule(): void {
    const c = this.ctx; const tr = this.track ? T[this.track] : null;
    if (!c || !tr) return;
    const stepDur = 60 / tr.bpm / 2;
    const lead = tr.lead.split(' ');
    while (this.nextT < c.currentTime + 0.18) {
      const i = this.step % lead.length, t = this.nextT;
      const vol = tr.vol ?? 1;
      const n = lead[i];
      if (n !== '.' && n !== '-') {
        let len = 1; while (lead[(i + len) % lead.length] === '-' && len < 4) len++;
        this.tone(noteFreq(n), t, stepDur * 0.9 * len, tr.wave, 0.5 * vol, this.musicBus);
      }
      const bar = Math.floor(i / 8) % tr.bass.length, pos = i % 8;
      if (pos === 0 || pos === 2 || pos === 4 || pos === 6) {
        const root = tr.bass[bar]; const f = noteFreq(root) * (pos === 4 ? 1.5 : 1);
        this.tone(f, t, stepDur * 1.6, 'triangle', 0.7 * vol, this.musicBus);
      }
      const dch = tr.drums[i % tr.drums.length];
      if (dch === 'k') this.kick(t); else if (dch === 's') this.noise(t, 0.09, 0.3, 1800); else if (dch === 'h') this.noise(t, 0.03, 0.12, 7000);
      this.nextT += stepDur; this.step++;
    }
  }
  private kick(t: number): void {
    const c = this.ctx!; const o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    g.gain.setValueAtTime(0.8, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    o.connect(g).connect(this.musicBus); o.start(t); o.stop(t + 0.16);
  }

  // ---------- prymitywy ----------
  private tone(f: number, t: number, dur: number, type: OscillatorType, vol: number, dest: AudioNode, f1?: number, att = 0.005): void {
    const c = this.ctx!; const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(Math.max(20, f), t);
    if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + att);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(dest); o.start(t); o.stop(t + dur + 0.02);
  }
  private noise(t: number, dur: number, vol: number, freq: number, dest?: AudioNode, q = 0.7): void {
    const c = this.ctx!; if (!this.noiseBuf) return;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = freq > 3000 ? 'highpass' : 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(dest ?? this.musicBus); s.start(t); s.stop(t + dur + 0.02);
  }

  // ---------- efekty ----------
  sfx(n: SfxName): void {
    this.onSfx?.(n);
    const c = this.ctx; if (!c) return;
    const now = c.currentTime;
    const minGap = n === 'petrify' ? 1 : n === 'pet' || n === 'can' ? 0.025 : 0.04;
    if ((this.lastSfx.get(n) ?? -9) > now - minGap) return;
    this.lastSfx.set(n, now);
    const d = this.sfxBus, tn = (f: number, dur: number, type: OscillatorType, vol: number, f1?: number, dl = 0) => this.tone(f, now + dl, dur, type, vol, d, f1);
    const nz = (dur: number, vol: number, freq: number, dl = 0) => this.noise(now + dl, dur, vol, freq, d);
    switch (n) {
      case 'jump': tn(300, 0.16, 'square', 0.35, 620); break;
      case 'land': nz(0.05, 0.25, 500); break;
      case 'swing': nz(0.1, 0.35, 2400); tn(260, 0.08, 'sawtooth', 0.15, 120); break;
      case 'hit': tn(180, 0.1, 'square', 0.4, 70); nz(0.06, 0.4, 900); break;
      case 'stomp': tn(420, 0.09, 'square', 0.4, 160); break;
      case 'pet': nz(0.03, 0.4, 5200); tn(1180, 0.07, 'sine', 0.35, 1500); break;               // plastikowy „klik”
      case 'can': tn(1760, 0.22, 'triangle', 0.45); tn(2637, 0.3, 'sine', 0.2, undefined, 0.012); break; // metaliczny „ping”
      case 'golden': tn(1568, 0.12, 'triangle', 0.4); tn(2093, 0.12, 'triangle', 0.4, undefined, 0.08); tn(3136, 0.35, 'sine', 0.35, undefined, 0.16); break;
      case 'oneup': [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tn(f, 0.14, 'square', 0.32, undefined, i * 0.08)); break;
      case 'spark': tn(900, 0.1, 'sine', 0.3, 1800); nz(0.05, 0.15, 6000); break;
      case 'teleport': tn(200, 0.55, 'sawtooth', 0.25, 1600); tn(1760, 0.1, 'sine', 0.3, undefined, 0.55); break;
      case 'petrify': tn(70, 0.22, 'sine', 0.6, 50); break;
      case 'checkpoint': tn(660, 0.1, 'square', 0.3); tn(990, 0.2, 'square', 0.3, undefined, 0.1); break;
      case 'switch': nz(0.03, 0.5, 1200); tn(150, 0.06, 'square', 0.3); break;
      case 'bossHit': tn(120, 0.25, 'sawtooth', 0.5, 40); nz(0.2, 0.5, 700); break;
      case 'bossDie': for (let i = 0; i < 8; i++) { nz(0.18, 0.4, 600 + i * 150, i * 0.12); tn(500 - i * 50, 0.2, 'sawtooth', 0.3, 80, i * 0.12); } break;
      case 'star': [523, 659, 784, 988, 784, 659].forEach((f, i) => tn(f, 0.08, 'square', 0.3, undefined, i * 0.06)); break;
      case 'powerup': tn(392, 0.1, 'square', 0.3); tn(523, 0.1, 'square', 0.3, undefined, 0.08); tn(784, 0.2, 'square', 0.3, undefined, 0.16); break;
      case 'hurt': tn(400, 0.25, 'sawtooth', 0.4, 90); break;
      case 'die': [440, 392, 330, 262, 196].forEach((f, i) => tn(f, 0.16, 'square', 0.35, undefined, i * 0.11)); break;
      case 'clear': [523, 659, 784, 1047].forEach((f, i) => tn(f, 0.2, 'square', 0.32, undefined, i * 0.13)); [1047, 1319, 1568].forEach((f, i) => tn(f, 0.5, 'triangle', 0.3, undefined, 0.6 + i * 0.01)); break;
      case 'gameover': [392, 330, 262, 196, 131].forEach((f, i) => tn(f, 0.3, 'triangle', 0.5, undefined, i * 0.25)); break;
      case 'menu': tn(880, 0.04, 'square', 0.15); break;
      case 'select': tn(660, 0.05, 'square', 0.25); tn(990, 0.08, 'square', 0.25, undefined, 0.05); break;
      case 'free': [659, 784, 988, 1319].forEach((f, i) => tn(f, 0.12, 'triangle', 0.35, undefined, i * 0.07)); break;
      case 'crate': tn(220, 0.08, 'square', 0.35, 330); nz(0.05, 0.3, 1500); break;
      case 'beam': tn(110, 0.8, 'sawtooth', 0.25, 90); tn(112, 0.8, 'sawtooth', 0.25, 92); break;
      case 'warn': tn(1000, 0.07, 'square', 0.2); tn(1000, 0.07, 'square', 0.2, undefined, 0.12); break;
      case 'break': nz(0.2, 0.5, 400); nz(0.12, 0.4, 1500, 0.04); break;
      case 'ecoport': [784, 988, 1175, 1568].forEach((f, i) => tn(f, 0.1, 'square', 0.28, undefined, i * 0.07)); nz(0.3, 0.2, 3000, 0.3); break;
      case 'rock': nz(0.25, 0.5, 300); tn(90, 0.2, 'sine', 0.5, 40); break;
      case 'flash': tn(2000, 0.04, 'square', 0.15); break;
    }
  }
}
