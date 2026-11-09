/**
 * W1-L4 „Przetwornia Żukoroga” (docs/design/09 §4): wielopoziomowa hala mocy → arena Rogomira.
 * Hala: schody na taras z rozdzielnicą A → zejście → winda techniczna na pomost z rozdzielnicą B → brama (2 rozdzielnice) → arena.
 * Arena: jeden ciągły pomost z trzema generatorami, drabiny przy ścianach i w środku; Rogomir szarżuje po podłodze POD pomostem (pomost jest bezpieczny),
 * a po odłączeniu wszystkich trzech generatorów (okno 28 s) traci pancerz — gdy utknie, uderz go kluczem. Trafienie podłącza generatory z powrotem.
 * Brak skakania po głowach: kontakt z Rogomirem zawsze rani, poza chwilą, gdy utknął.
 */
import { AuthoredRoom, Canvas, assemble, cx, feet } from '../authored';
import type { LevelData } from '../types';
import { TILE } from '../constants';

export function buildW1L4(): LevelData {
  const c = new Canvas(112, 18);
  c.rect(0, 0, 111, 2, '#'); c.ground(0, 111, 15);
  c.rect(0, 3, 0, 14, '#'); c.rect(111, 3, 111, 14, '#');
  // hala: taras (2,4 m) ze schodami
  c.rampUp(10, 15, 3);                      // → 16
  c.rect(16, 12, 30, 14, '#');
  c.rampDown(31, 12, 3);                    // → 37
  // winda techniczna na pomost (kolumny 38–40), przesłony w stropie podłogi pomostu; ściany boczne chronią krawędzie
  c.rect(38, 9, 50, 9, '=');
  c.rect(37, 3, 37, 9, '#'); c.rect(51, 3, 51, 9, '#');
  // brama do areny
  c.rect(56, 3, 56, 14, '1');
  // arena: jeden ciągły pomost (4 kafle nad podłogą — Rogomir przechodzi pod nim) przez całą szerokość, drabiny przy lewej ścianie, w środku i przy prawej ścianie.
  // Pomost pozwala przejść nad bossem w dowolną stronę; do ciosu schodzisz drabiną tam, gdzie boss utknął przy ścianie.
  c.rect(60, 11, 110, 11, '='); c.rect(59, 3, 59, 11, '#');
  for (const x of [62, 85, 108]) c.ladder(x, 11, 14);

  // znaczniki: hala
  c.set(2, 14, 'S'); c.set(36, 0, '?');
  for (const x of [6, 8]) c.set(x, 14, 'p');
  for (const x of [4, 5]) c.set(x, 14, 'k');
  for (const x of [17, 18]) c.set(x, 11, 'k');
  for (const x of [20, 22, 24]) c.set(x, 11, 'p');
  c.set(26, 11, 'T'); c.set(29, 11, 'W');
  for (const x of [43, 44]) c.set(x, 14, 'k');
  for (const x of [42, 43, 47]) c.set(x, 8, 'p');
  c.set(44, 8, 'k'); c.set(46, 8, 'T'); c.set(49, 8, 'V');
  c.set(52, 14, 'p'); c.set(53, 14, 'K');
  c.set(4 + 0, 14, 'k');
  // wrogowie hali: Roguś ×3, Żukoróg ×4
  c.set(19, 11, 'r'); c.set(45, 14, 'r'); c.set(48, 14, 'r');
  c.set(7, 14, 'z'); c.set(26 + 2, 11, 'z'); c.set(42, 14, 'z'); c.set(54, 14, 'z');
  // arena
  c.set(59, 14, 'T');
  for (const x of [64, 74]) c.set(x, 10, 'p');
  c.set(94, 10, 'p');
  c.set(68, 10, 'G'); c.set(82, 10, 'G'); c.set(100, 10, 'G');
  for (const x of [67, 85, 97]) c.set(x, 14, 'k');
  c.set(94, 14, 'B');

  const room = new AuthoredRoom('W1-L4:main', c.rows(), { name: 'main', world: 1, bossArena: { x0: 58, x1: 111 } });
  room.push({ t: 'gate', id: 'g1', cells: room.gateCells.get('g1') ?? [], need: 2 });
  const W = room.at('W'), V = room.at('V');
  room.push({ t: 'switch', id: 'W1-L4:sa', x: cx(W.tx), y: feet(W.ty), gate: 'g1', style: 'lever', symbol: 0 });
  room.push({ t: 'switch', id: 'W1-L4:sb', x: cx(V.tx), y: feet(V.ty), gate: 'g1', style: 'lever', symbol: 1 });
  room.all('G').forEach((g, i) => room.push({ t: 'switch', id: `W1-L4:gen${i + 1}`, x: cx(g.tx), y: feet(g.ty), gate: 'gen', style: 'relay', symbol: i }));
  room.push({ t: 'platform', x: 38 * TILE, y: 9 * TILE, w: 3, mode: 'v', range: 6 * TILE, speed: 70, offset: 0, dwell: 1.6 });
  room.push({ t: 'boss', k: 'rogomir', x: cx(95), y: feet(14) });
  room.autoSpecs('W1-L4', ['W1-L4-S1', 'W1-L4-S2', 'W1-L4-S3']);
  return assemble({ id: 'W1-L4', world: 1, stage: 4, boss: 'rogomir', residents: 3, hints: ['hint.fall'], budget: { pet: 12, cans: 10, golden: 0 } }, [room]);
}
