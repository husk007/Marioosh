/** Stan rozgrywki: liczniki, życia, postęp. Czysta logika (testowalna bez przeglądarki). */
import { MAX_LIVES } from './constants';
import { SaveData, writeSlot, type LevelRecord } from './save';

export type PackageKind = 'pet' | 'can' | 'golden';
export interface PickupResult { counted: boolean; lifeGained: boolean; score: number }

export class Session {
  collected: Set<string>; freed: Set<string>; shards: Set<string>; notes: Set<string>; secrets: Set<string>;
  /** zmienne w obrębie bieżącego podejścia do poziomu (do rankingu i ekranu wyników) */
  run = { pets: 0, cans: 0, golden: 0, freed: 0, startScore: 0, time: 0, carriedPackages: 0 };
  /** zdarzenie dla UI (np. „+1 życie”) */
  onLife: (() => void) | null = null;
  constructor(public data: SaveData, public slot: number) {
    this.collected = new Set(data.collected); this.freed = new Set(data.freed); this.shards = new Set(data.shards);
    this.notes = new Set(data.notes); this.secrets = new Set(data.secrets);
  }
  get coop(): boolean { return this.data.mode === 'coop'; }
  get score(): number { return this.data.score; }
  get lives(): [number, number] { return this.data.lives; }
  get packages(): number { return this.data.packageCount; }

  addScore(n: number): void { this.data.score += n; }

  /** Dodaje życie (indeks gracza). Nadmiar ponad MAX_LIVES zamienia się na 2000 pkt. */
  addLife(p: 0 | 1): boolean {
    if (this.data.lives[p] >= MAX_LIVES) { this.addScore(2000); return false; }
    this.data.lives[p]++; this.onLife?.(); return true;
  }

  /**
   * Zbiera opakowanie o unikalnym id. Zwraca counted=false, jeśli id było już zebrane (antyduplikacja).
   * Złota puszka = JEDNO fizyczne opakowanie (próg życia) i 750 pkt / 2,50 zł.
   */
  collectPackage(id: string, kind: PackageKind, p: 0 | 1): PickupResult {
    if (this.collected.has(id)) return { counted: false, lifeGained: false, score: 0 };
    this.collected.add(id);
    const score = kind === 'pet' ? 100 : kind === 'can' ? 150 : 750;
    const grosze = kind === 'golden' ? 250 : 50;
    this.data.score += score; this.data.depositGrosze += grosze; this.data.packageCount += 1;
    if (kind === 'pet') this.run.pets++; else if (kind === 'can') this.run.cans++; else this.run.golden++;
    this.run.carriedPackages++;
    void p;   // v0.4: opakowania to wartość kaucji, nie dają żyć
    return { counted: true, lifeGained: false, score };
  }

  /** Jednorazowy unikat (bateria, kryształ, zapiski…) — zwraca true, jeśli nowy. */
  collectUnique(id: string): boolean {
    if (this.collected.has(id)) return false;
    this.collected.add(id); return true;
  }
  freeResident(id: string): boolean {
    if (this.freed.has(id)) return false;
    this.freed.add(id); this.run.freed++; this.data.score += 1000; return true;
  }
  /** EcoPort „przyjmuje” plecak: kaucja zrealizowana; pierwszy raz w poziomie daje 500 pkt. */
  deposit(): number {
    const grosze = this.data.depositGrosze - this.data.depositRealised;
    this.data.depositRealised = this.data.depositGrosze; this.run.carriedPackages = 0; return grosze;
  }

  beginLevel(): void { this.run = { pets: 0, cans: 0, golden: 0, freed: 0, startScore: this.data.score, time: 0, carriedPackages: 0 }; }

  completeLevel(id: string, time: number, timeBonus: number): LevelRecord {
    const prev = this.data.levels[id];
    this.data.score += timeBonus;
    const rec: LevelRecord = {
      done: true, bestScore: Math.max(prev?.bestScore ?? 0, this.data.score - this.run.startScore), bestTime: prev?.bestTime ? Math.min(prev.bestTime, time) : time,
      pets: Math.max(prev?.pets ?? 0, this.run.pets), cans: Math.max(prev?.cans ?? 0, this.run.cans), golden: Math.max(prev?.golden ?? 0, this.run.golden),
      freed: [1, 2, 3].filter((n) => this.freed.has(`${id}-S${n}`)).length,
    };
    this.data.levels[id] = rec; return rec;
  }
  /** Odblokowanie świata (Warp Zone odblokowuje docelowy świat; wszystkie ≤ max pozostają dostępne). */
  unlockWorld(w: number): boolean {
    if (w > this.data.unlockedWorld) { this.data.unlockedWorld = Math.min(8, w); return true; }
    return false;
  }
  isLevelUnlocked(world: number, stage: number): boolean {
    if (world > this.data.unlockedWorld) return false;
    if (stage === 1) return true;
    return !!this.data.levels[`W${world}-L${stage - 1}`]?.done || this.hasWarpedTo(world);
  }
  private hasWarpedTo(world: number): boolean { return world < this.data.unlockedWorld; }

  /** Atomowy zapis całego stanu. */
  persist(seconds = 0): void {
    this.data.collected = [...this.collected]; this.data.freed = [...this.freed]; this.data.shards = [...this.shards];
    this.data.notes = [...this.notes]; this.data.secrets = [...this.secrets]; this.data.playSeconds += seconds;
    writeSlot(this.slot, this.data);
  }
}
