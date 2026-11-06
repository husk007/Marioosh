/** Syntezator dźwięku i muzyki (WebAudio) — całość oryginalna, bez plików audio. */
export type SfxName =
  | 'jump' | 'land' | 'swing' | 'hit' | 'stomp' | 'pet' | 'can' | 'golden' | 'oneup' | 'spark' | 'teleport'
  | 'petrify' | 'checkpoint' | 'switch' | 'bossHit' | 'bossDie' | 'star' | 'powerup' | 'hurt' | 'die'
  | 'clear' | 'gameover' | 'menu' | 'select' | 'free' | 'crate' | 'beam' | 'warn' | 'break' | 'ecoport' | 'rock' | 'flash';

interface Track { bpm: number; wave: OscillatorType; lead: string; bass: string[]; drums: string; vol?: number; q?: string; }

const T: Record<string, Track> = {
  title:  { bpm: 108, q: 'MMMM', wave: 'square', lead: 'C5 . E5 . G5 . C6 . A5 . F5 . A5 . C6 . G5 . E5 . G5 . B5 . C6 . . . . . . .', bass: ['C2', 'F2', 'G2', 'C2'], drums: 'k...h...' },
  map:    { bpm: 100, q: 'MMMM', wave: 'triangle', lead: 'E5 . G5 . A5 . G5 . F5 . A5 . C6 . A5 . D5 . F5 . G5 . F5 . E5 . G5 . C5 . . .', bass: ['C2', 'F2', 'G2', 'C2'], drums: 'k.......' },
  w1:     { bpm: 132, q: 'MmMM', wave: 'square', lead: 'E5 G5 C6 G5 E5 G5 A5 . G5 E5 C5 E5 G5 . . . F5 A5 C6 A5 F5 A5 B5 . D6 B5 G5 B5 C6 . . .', bass: ['C2', 'A1', 'F2', 'G2'], drums: 'k.h.s.h.' },
  w2:     { bpm: 120, q: 'mmMm', wave: 'sawtooth', lead: 'A4 . A4 C5 . A4 E5 . D5 . D5 F5 . D5 A5 . C5 . C5 E5 . C5 G5 . E5 . D5 . C5 . B4 .', bass: ['A1', 'D2', 'C2', 'E2'], drums: 'k.hks.h.', vol: 0.8 },
  w3:     { bpm: 126, q: 'MMmM', wave: 'square', lead: 'G5 A5 B5 D6 B5 A5 G5 . F5 G5 A5 C6 A5 G5 F5 . E5 G5 B5 E6 B5 G5 E5 . D5 F#5 A5 D6 A5 F#5 D5 .', bass: ['G2', 'F2', 'E2', 'D2'], drums: 'k.h.sh.h' },
  w4:     { bpm: 100, q: 'mmMM', wave: 'triangle', lead: 'D5 . F5 A5 . G5 F5 . E5 . G5 B5 . A5 G5 . F5 . A5 C6 . B5 A5 . G5 A5 B5 A5 G5 F5 E5 .', bass: ['D2', 'E2', 'F2', 'G2'], drums: 'k.......', vol: 1.1 },
  w5:     { bpm: 112, q: 'mmmm', wave: 'square', lead: 'E5 F5 . A5 . G#5 F5 . E5 . F5 . G#5 B5 . . A5 . G#5 . F5 . E5 . D5 . E5 F5 E5 . . .', bass: ['E2', 'E2', 'A1', 'E2'], drums: 'k..hs.h.' },
  w6:     { bpm: 92, q: 'mMMm', wave: 'triangle', lead: 'B4 . D5 . F#5 . E5 . D5 . B4 . A4 . . . G4 . B4 . D5 . C#5 . B4 . A4 . F#4 . . .', bass: ['B1', 'B1', 'G1', 'F#1'], drums: 'k.......', vol: 1.1 },
  w7:     { bpm: 140, q: 'mMMm', wave: 'sawtooth', lead: 'E5 E5 G5 E5 B5 E5 A5 E5 D5 D5 F#5 D5 A5 D5 G5 D5 C5 C5 E5 C5 G5 C5 F#5 C5 B4 B4 D5 B4 F#5 B4 E5 .', bass: ['E2', 'D2', 'C2', 'B1'], drums: 'k.hksh.h', vol: 0.75 },
  w8:     { bpm: 96, q: 'mMMM', wave: 'sawtooth', lead: 'C5 . . Eb5 . . D5 . C5 . . B4 . . . . Ab4 . . C5 . . Bb4 . G4 . . B4 . . . .', bass: ['C2', 'C2', 'Ab1', 'G1'], drums: 'k...k...', vol: 0.75 },
  w0:     { bpm: 124, q: 'MMMM', wave: 'square', lead: 'C5 E5 C5 G4 C5 E5 G5 . F5 A5 F5 C5 F5 A5 C6 . G5 B5 G5 D5 G5 B5 D6 . C6 . G5 . E5 . C5 .', bass: ['C2', 'F2', 'G2', 'C2'], drums: 'k.h.s.h.' },
  boss:   { bpm: 150, q: 'mMMM', wave: 'sawtooth', lead: 'A4 C5 E5 A5 G5 E5 C5 E5 G4 B4 D5 G5 F5 D5 B4 D5 F4 A4 C5 F5 E5 C5 A4 C5 E4 G#4 B4 E5 D5 B4 G#4 B4', bass: ['A1', 'G1', 'F1', 'E1'], drums: 'kkhksh.h', vol: 0.75 },
  star:   { bpm: 190, q: 'MMMM', wave: 'square', lead: 'C5 E5 G5 C6 G5 E5 C5 E5 D5 F5 A5 D6 A5 F5 D5 F5 E5 G5 B5 E6 B5 G5 E5 G5 C6 G5 E5 C5 G5 E5 C5 .', bass: ['C2', 'D2', 'E2', 'C2'], drums: 'khkhshkh' },
};
export const TRACKS = Object.keys(T);

const NOTE: Record<string, number> = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
export function noteFreq(n: string): number {
  const m = /^([A-G][b#]?)(-?\d)$/.exec(n);
  if (!m) return 0;
  return 440 * Math.pow(2, (NOTE[m[1]] + (parseInt(m[2], 10) + 1) * 12 - 69) / 12);
}

const TEMPO = 0.78; // spokojniejsze tempo niż w pierwszej wersji

export class AudioEngine {
  ctx: AudioContext | null = null;
  private master!: GainNode; private musicBus!: GainNode; private musicIn!: GainNode; private sfxBus!: GainNode;
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
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.2;
    this.master = c.createGain(); this.master.gain.value = 0.9; this.master.connect(comp); comp.connect(c.destination);
    this.musicBus = c.createGain(); this.sfxBus = c.createGain();
    this.musicBus.connect(this.master); this.sfxBus.connect(this.master);
    // tor muzyki: suchy sygnał + pogłos + miękkie echo
    this.musicIn = c.createGain(); this.musicIn.connect(this.musicBus);
    const conv = c.createConvolver(); conv.buffer = this.impulse(2.2, 2.6);
    const send = c.createGain(); send.gain.value = 0.34; this.musicIn.connect(send); send.connect(conv); conv.connect(this.musicBus);
    const dl = c.createDelay(1); dl.delayTime.value = 0.36; const fb = c.createGain(); fb.gain.value = 0.3; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
    const ds = c.createGain(); ds.gain.value = 0.2; this.musicIn.connect(ds); ds.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(this.musicBus);
    this.applyVolumes();
    const len = c.sampleRate; this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    if (this.track) { const t = this.track; this.track = null; this.music(t); }
  }
  private impulse(sec: number, decay: number): AudioBuffer {
    const c = this.ctx!; const n = Math.floor(c.sampleRate * sec); const b = c.createBuffer(2, n, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay); }
    return b;
  }
  setVolumes(music: number, sfx: number): void { this.musicVol = music; this.sfxVol = sfx; this.applyVolumes(); }
  private applyVolumes(): void { if (!this.ctx) return; this.musicBus.gain.value = this.musicVol * 0.3; this.sfxBus.gain.value = this.sfxVol * 0.7; }
  duck(on: boolean): void { if (this.ctx) this.musicBus.gain.setTargetAtTime(this.musicVol * (on ? 0.1 : 0.3), this.ctx.currentTime, 0.05); }

  // ---------- muzyka ----------
  music(name: string | null): void {
    if (name === this.track) return;
    this.track = name; this.step = 0;
    if (this.timer !== null) { clearInterval(this.timer); this.timer = null; }
    if (!name || !this.ctx || !T[name]) return;
    this.nextT = this.ctx.currentTime + 0.1;
    this.timer = window.setInterval(() => this.schedule(), 40);
  }
  get current(): string | null { return this.track; }
  private schedule(): void {
    const c = this.ctx; const tr = this.track ? T[this.track] : null;
    if (!c || !tr) return;
    const stepDur = 60 / (tr.bpm * TEMPO) / 2;
    const lead = tr.lead.split(' ');
    const dest = this.musicIn; const vol = tr.vol ?? 1; const hard = this.track === 'boss' || this.track === 'star';
    while (this.nextT < c.currentTime + 0.2) {
      const i = this.step % lead.length, t = this.nextT;
      const bar = Math.floor(i / 8) % tr.bass.length, pos = i % 8;
      const root = noteFreq(tr.bass[bar]); const minor = (tr.q ?? 'MMMM')[bar % (tr.q ?? 'MMMM').length] === 'm';
      const chord = [0, minor ? 3 : 4, 7, 12].map((s) => root * 4 * Math.pow(2, s / 12)); // oktawy 3–4
      // pad — miękki akord na cały takt
      if (pos === 0) for (const f of chord.slice(0, 3)) this.pad(f, t, stepDur * 8.4, 0.11 * vol, dest);
      // melodia — dzwonkowy / fletowy dźwięk zależnie od barwy utworu
      const n = lead[i];
      if (n !== '.' && n !== '-') {
        let len = 1; while (lead[(i + len) % lead.length] === '-' && len < 4) len++;
        this.lead(noteFreq(n), t, stepDur * len, tr.wave, 0.5 * vol, dest);
      } else if (n === '.' && !hard && pos % 2 === 1) {
        // delikatne arpeggio wypełnia pauzy w melodii
        this.pluck(chord[(i >> 1) % 4] * 2, t, stepDur * 2.2, 0.09 * vol, dest);
      }
      // bas — okrągły, bez ostrych krawędzi
      if (pos === 0) this.bass(root, t, stepDur * 3.6, 0.8 * vol, dest);
      else if (pos === 4) this.bass(root * 1.5, t, stepDur * 2.6, 0.55 * vol, dest);
      else if (pos === 6 && hard) this.bass(root, t, stepDur * 1.4, 0.5 * vol, dest);
      // perkusja — delikatna
      const dch = tr.drums[i % tr.drums.length];
      if (dch === 'k') this.kick(t, hard ? 0.7 : 0.45); else if (dch === 's') this.noise(t, 0.09, hard ? 0.16 : 0.07, 1800, dest, 0.9); else if (dch === 'h') this.noise(t, 0.03, hard ? 0.07 : 0.035, 7500, dest);
      this.nextT += stepDur; this.step++;
    }
  }
  private lead(f: number, t: number, dur: number, wave: OscillatorType, vol: number, dest: AudioNode): void {
    const c = this.ctx!;
    const flt = c.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = wave === 'sawtooth' ? 1700 : 3200; flt.Q.value = 0.4;
    const g = c.createGain(); const d = Math.max(dur * 1.5, 0.25);
    const sustained = wave === 'triangle';
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol * 0.5, t + (sustained ? 0.04 : 0.012));
    if (sustained) { g.gain.setTargetAtTime(vol * 0.38, t + 0.06, 0.2); g.gain.setTargetAtTime(0.0001, t + dur * 0.95, 0.1); } else g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    flt.connect(g).connect(dest);
    const mk = (type: OscillatorType, mul: number, v: number, det: number): void => {
      const o = c.createOscillator(); const og = c.createGain(); og.gain.value = v; o.type = type; o.frequency.value = f * mul; o.detune.value = det;
      if (sustained && dur > 0.3) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 5; lg.gain.value = f * 0.004; l.connect(lg).connect(o.frequency); l.start(t + 0.15); l.stop(t + d + 0.1); }
      o.connect(og).connect(flt); o.start(t); o.stop(t + d + 0.1);
    };
    mk(wave === 'sawtooth' ? 'sawtooth' : 'triangle', 1, 0.7, -4); mk('sine', 1, 0.5, 5); if (wave !== 'sawtooth') mk('sine', 2, 0.18, 0);
  }
  private pluck(f: number, t: number, dur: number, vol: number, dest: AudioNode): void { this.tone(f, t, dur, 'sine', vol, dest, undefined, 0.008); this.tone(f * 2, t, dur * 0.4, 'sine', vol * 0.25, dest, undefined, 0.004); }
  private pad(f: number, t: number, dur: number, vol: number, dest: AudioNode): void {
    const c = this.ctx!; const flt = c.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = 1100;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.3); g.gain.setTargetAtTime(0.0001, t + dur * 0.7, dur * 0.12);
    flt.connect(g).connect(dest);
    for (const det of [-6, 6]) { const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = f; o.detune.value = det; o.connect(flt); o.start(t); o.stop(t + dur + 0.6); }
  }
  private bass(f: number, t: number, dur: number, vol: number, dest: AudioNode): void {
    this.tone(f, t, dur, 'sine', vol * 0.9, dest, undefined, 0.012); this.tone(f * 2, t, dur * 0.5, 'triangle', vol * 0.18, dest, undefined, 0.01);
  }
  private kick(t: number, v = 0.45): void {
    const c = this.ctx!; const o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.14);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    o.connect(g).connect(this.musicIn); o.start(t); o.stop(t + 0.22);
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
    s.connect(f).connect(g).connect(dest ?? this.musicIn); s.start(t); s.stop(t + dur + 0.02);
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
