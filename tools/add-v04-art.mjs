// Przebudowa kolejki grafik pod koncepcję v0.4 (postacie human-scale, ruch realistyczny) — idempotentnie:
//   * bracia: zestaw póz zgodny z docs/design/08 §9 + pływanie, drabiny, rampy, lądowania, podciąganie; usuwa pozy v0.3
//     (glide, wall_slide, roll, climb_grate, spring_launch, ground_pound, wall_jump, climb_wire)
//   * kategoria „mechanics”: elementy v0.4 (drabina, drzwi pełnej wielkości, winda, przekaźniki, lustro, filar, węzeł, głaz-osłona, woda, kieszeń powietrza…)
//   * scope.json: pomija zasoby v0.3 niezgodne z v0.4 (sprężyna, kratka, łańcuch, wywietrznik, pęknięta posadzka)
// Użycie: node tools/add-v04-art.mjs && node tools/art-roadmap.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const P = join(root, 'tools', 'art-prompts.json'), Q = join(root, 'tools', 'art-poses.json'), M = join(root, 'tools', 'art-mechanics.json'), S = join(root, 'art-tasks', 'scope.json');
const assets = JSON.parse(readFileSync(P, 'utf8')), poses = JSON.parse(readFileSync(Q, 'utf8'));
const mech = JSON.parse(readFileSync(M, 'utf8'));

// ------------------------------------------------------------------------------------------ pozy braci
const OBSOLETE = ['glide', 'wall_slide', 'roll', 'climb_grate', 'spring_launch', 'ground_pound', 'wall_jump', 'climb_wire'];
// stan → [opis, klatki, kto: M/D/MD, odniesienie dodatkowe (klucz w EXTRA_REF)]
const NEW = {
  turn: ['turning around in mid-stride: weight on the planted foot, torso and head rotating, tool pouch swinging, one step of deceleration', 4, 'MD'],
  walk_uphill: ['walking up a gentle 26-degree slope: torso leaning slightly forward into the incline, rear leg pushing off, front knee raised higher than on flat ground, feet placed on an upward-rising line to the right (draw no ground, only the body posed for rising ground)', 8, 'MD'],
  walk_downhill: ['walking down a gentle 26-degree slope: torso leaning slightly back, short braced steps with the heel landing first, arms out a little for balance, feet placed on a downward-falling line to the right (draw no ground)', 8, 'MD'],
  run_uphill: ['running up a slope: strong forward lean, knees driving high, arms pumping, effort visible in the face, body posed for rising ground (draw no ground)', 8, 'MD'],
  run_downhill: ['running down a slope in control: leaning back against momentum, long braking strides, arms out for balance, body posed for falling ground (draw no ground)', 8, 'MD'],
  jump_rise: ['rising phase of a normal jump: legs tucking, front arm swinging up, back arm back, eyes fixed forward at the landing spot, realistic human proportions (no cartoon stretch)', 3, 'MD'],
  fall_long: ['falling from a dangerous height: arms thrown up and apart, legs bicycling, wide alarmed eyes and open mouth, clothes and tool pouch flapping upward', 4, 'MD'],
  land_stumble: ['stumbling after a hard landing: one knee nearly touching the floor, one hand brushing the ground, other arm out for balance, wincing, small dust puff', 5, 'MD'],
  land_hard: ['crashing into a very hard landing from too high: crouched on both knees with a hand on the floor, head bowed, wincing, impact dust ring', 5, 'MD'],
  vault: ['vaulting over a waist-high crate or pipe: one hand planted on top, body turned sideways, legs swinging over, tool pouch held clear', 6, 'MD'],
  ledge_pull_up: ['pulling himself up onto a ledge: elbows over the edge, one knee already on the ledge, face straining, body mostly above the edge line', 6, 'MD'],
  crawl: ['crawling low through a narrow passage on hands and knees, helmet low, one hand reaching forward, tool belt scraping', 6, 'MD'],
  ladder_idle: ['holding a vertical ladder with both hands at head height and feet on rungs, standing still, seen from the side facing the ladder, looking up', 2, 'MD', 'ladder'],
  ladder_climb_up: ['climbing UP a vertical ladder: facing the ladder, alternating hand and foot reaching up one rung, body close to the rails, seen from the side', 8, 'MD', 'ladder'],
  ladder_climb_down: ['climbing DOWN a vertical ladder: facing the ladder, one foot lowering to the next rung, hands sliding down the rails, seen from the side', 8, 'MD', 'ladder'],
  ladder_top_exit: ['stepping off the top of a ladder onto a platform: one hand on the rail, one leg already over the edge, body rising', 4, 'MD', 'ladder'],
  ladder_jump_off: ['pushing off a ladder sideways into a jump: both hands just released, legs launching, body turning away from the ladder', 3, 'MD', 'ladder'],
  lift_ride: ['standing on a moving service lift platform: knees slightly bent for the motion, one hand on the safety railing, calm focused look', 4, 'MD', 'lift'],
  swim_tread: ['treading water at the surface: head and shoulders high, arms sweeping in small circles, legs cycling below, calm breathing (draw no water: the game draws the water over the lower body)', 6, 'MD'],
  swim_dive: ['diving downward head-first under water at a steep angle, arms stretched forward, legs together kicking, helmet pointing down, a few bubbles', 5, 'MD'],
  swim_up: ['kicking upward toward the surface: body vertical, one arm reaching above the head, legs kicking, bubbles streaming upward', 6, 'MD'],
  swim_gasp: ['bursting up to the surface and gasping for air: head tilted back, mouth wide open, arms spread wide, water droplets flying (draw no water surface)', 6, 'MD'],
  swim_low_air: ['running out of breath under water: cheeks puffed, eyes wide and urgent, one hand reaching upward, a trail of bubbles escaping, helmet slightly tilted', 4, 'MD'],
  swim_drown: ['out of air: hands at the throat, face strained, tiny bubbles, body starting to go limp but still upright, readable as hurt and desperate', 4, 'MD'],
  wade: ['wading through chest-deep water: knees lifting high, arms held out to the sides pushing against the water, slow heavy stride (draw no water)', 8, 'MD'],
  door_enter: ['pushing open a full-size door with one hand while turning shoulders toward it, other hand on the frame, stepping across the threshold, seen from the side', 6, 'MD', 'door'],
  carry: ['carrying a heavy toolbox against the belly with both arms, walking with a slightly backward lean and careful steps', 8, 'MD'],
  tool_defense: ['holding the broad wrench crosswise in front of the body in both hands as a block, feet apart, braced against an impact', 4, 'MD'],
  downed: ['knocked down and sitting on the floor, back against an invisible wall, head drooping, helmet askew, one hand on the knee, tool beside him', 4, 'MD'],
};

const removed = [], added = [];
for (const [cid, who] of [['CHARACTERS-001', 'M'], ['CHARACTERS-002', 'D']]) {
  const proto = poses.find((p) => p.asset_id === cid && p.state === 'idle'); if (!proto) throw new Error('brak pozy wzorcowej ' + cid);
  const head = proto.prompt_en.split('\nANIMATION STATE JOB:')[0];
  for (let i = poses.length - 1; i >= 0; i--) if (poses[i].asset_id === cid && OBSOLETE.includes(poses[i].state)) { removed.push(poses[i].job_id); poses.splice(i, 1); }
  for (const [state, [desc, frames, kto]] of Object.entries(NEW)) {
    if (!kto.includes(who) || poses.some((p) => p.asset_id === cid && p.state === state)) continue;
    poses.push({
      job_id: `${cid}__${state}`, asset_id: cid, state, target_frames: frames,
      prompt_en: `${head}\nANIMATION STATE JOB: Produce a single readable key pose for state ${state.replace(/_/g, ' ')}: the character is ${desc}. Keep exact costume, helmet, height, realistic adult human proportions, art line, reference model, anchor point and side-facing view. Further in-between frames should be generated/edited as a controlled animation production process. Do not pack poses into an inaccurate contact sheet.`,
    });
    added.push(`${cid}__${state}`);
  }
}

// ------------------------------------------------------------------------------------------ elementy v0.4 (kategoria mechanics)
const tile = assets.find((a) => a.asset_id === 'PLANET_TILES-002');
const STYLE = tile.prompt_en.split('\nSUBJECT:')[0], NEG = tile.negative_prompt_en, PAL = '#71C878, #7BCEEC, #F5C04A, #275E55, #F7FFF0';
const MECH = [   // [klucz, nazwa, opis, rozmiar, dostawa]
  ['ladder', 'Rung ladder - climbable', 'A sturdy vertical steel rung ladder, two rails with evenly spaced round rungs every 24 px of a 32 px grid, rubber-insulated blue rail caps, subtle wear, tileable vertically; slim enough that a human-sized character can stand in front of it. Side-on view.', '256x512', 'transparent sprite; seamless vertically'],
  ['door', 'Full-size cable door', 'A full-size 2.3 m tall industrial door-terminal frame seen side-on from the front: dark graphite frame, rounded top, an inner glowing panel in neutral cyan (colour will be tinted per cable colour in game), a slot above the door for a symbol plate, a rubber threshold. A human can walk through it.', '256x512', 'transparent sprite; frame and panel on separate readable shapes'],
  ['lift', 'Service lift platform', 'A broad industrial service lift platform seen side-on: a thick steel deck with yellow-black edge stripes, two thin guide rails above and below, a small round power indicator lamp (unlit), and a low safety railing on one side; 3 tiles wide.', '512x256', 'transparent sprite'],
  [null, 'Ordered relay switch - off', 'A chest-high relay switch post with a glass crystal on top and a chunky pull lever; the crystal is dark and unlit. The lit state will be a separate asset.', '256x256', 'transparent sprite'],
  [null, 'Ordered relay switch - lit', 'The same chest-high relay switch post as the ordered relay switch, now activated: the crystal glows warm yellow and the lever is down, soft glow halo.', '256x256', 'transparent sprite'],
  [null, 'Network symbol plate - lightning', 'A square metal sign plate with a bold glowing lightning-bolt glyph in light cyan, engraved bevel, rounded corners, no text.', '256x256', 'transparent sprite'],
  [null, 'Network symbol plate - moon', 'A square metal sign plate with a bold glowing crescent-moon glyph in pale green, engraved bevel, rounded corners, no text.', '256x256', 'transparent sprite'],
  [null, 'Network symbol plate - leaf', 'A square metal sign plate with a bold glowing leaf glyph in warm yellow, engraved bevel, rounded corners, no text.', '256x256', 'transparent sprite'],
  [null, 'Network symbol plate - star', 'A square metal sign plate with a bold glowing five-pointed star glyph in coral red, engraved bevel, rounded corners, no text.', '256x256', 'transparent sprite'],
  [null, 'Standing beam mirror', 'A full-height 2 m standing mirror on a steel base: polished oval reflective glass in a thin brass frame, slightly angled, a soft cyan sheen across the glass; reads clearly as something to be turned toward a beam.', '256x512', 'transparent sprite'],
  [null, 'Breakable stone pillar', 'A thick 2.5 m stone pillar with carved rings and faint hairline cracks, slightly weathered, wider at the base; clearly breakable by a charging beast. Side-on.', '256x512', 'transparent sprite'],
  [null, 'Energy node - rune switch', 'A wall-mounted round energy node: a dark stone disc with an engraved rune and a socket in the middle; dormant (no glow) with faint cyan engraving; reads as something to be switched on.', '256x256', 'transparent sprite'],
  [null, 'Cover boulder - two tiles tall', 'A rounded grey-peach boulder 64 px tall and 64 px wide that a human can just jump over, flat bottom for standing on the ground, same stone as the planet ground tile.', '256x256', 'transparent sprite'],
  [null, 'Balcony walkway with railing', 'A balcony walkway section seen side-on: a thick one-way deck plank at the bottom with a thin guard railing posts and rail on top; modular, tileable horizontally, 3 tiles wide.', '512x256', 'transparent sprite; seamless horizontally'],
  [null, 'Water surface strip', 'A horizontal strip of water surface seen side-on: translucent turquoise body below a gentle sparkling wave line with soft foam, tileable horizontally; no characters.', '512x128', 'transparent, seamless horizontally'],
  [null, 'Air pocket - breathing bubble', 'A large shimmering air bubble about 1.2 m across with a bright rim and a small vent pipe feeding it, glimmering inside, where a swimmer can take a breath underwater.', '256x256', 'transparent sprite'],
  [null, 'Ramp 26 degrees - interior floor', 'A gentle 26-degree interior ramp tile pair (low edge left, high edge right) in industrial steel-plate material with a subtle non-slip texture and a yellow edge stripe, joining flat floor tiles seamlessly at both ends.', '512x256', 'seamless modular tile'],
];
const nextId = (() => { let n = 0; for (const a of assets) if (a.category === 'mechanics') n = Math.max(n, +a.asset_id.split('-')[1]); return () => 'MECHANICS-' + String(++n).padStart(3, '0'); })();
let addedAssets = 0;
for (const [key, name, subject, size, deliv] of MECH) {
  let a = assets.find((x) => x.category === 'mechanics' && x.name === name);
  if (!a) {
    a = {
      asset_id: nextId(), name, category: 'mechanics', planet: 'Lumenia', source_size: size, palette: PAL, reference_asset_id: null,
      prompt_en: `${STYLE}\nSUBJECT: ${name}. ${subject}\nPALETTE: ${PAL}.\nRENDERING AND COMPOSITION: HD 2D environment art at side-on gameplay angle, hand-painted shapes, human-scale (a character is 70 px tall on a 32 px grid, 40 px = 1 m), no interface, no characters, no readable text.\nDELIVERY: ${deliv}; requested source canvas ${size}. One standalone asset only; do not include unrelated objects or multiple characters.`,
      negative_prompt_en: NEG,
    };
    assets.push(a); addedAssets++;
  }
  if (key) mech[key] = a.asset_id;
}
writeFileSync(P, JSON.stringify(assets)); writeFileSync(Q, JSON.stringify(poses));
const EXTRA_REF = { ladder: mech.ladder, lift: 'INTERACTABLES-010', door: mech.door };
const poseRefs = {}; for (const [state, v] of Object.entries(NEW)) if (v[3]) poseRefs[state] = EXTRA_REF[v[3]];
writeFileSync(M, JSON.stringify({ ...mech, pose_refs: poseRefs }));

// ------------------------------------------------------------------------------------------ zakres
const scope = JSON.parse(readFileSync(S, 'utf8'));
const obsoleteAssets = ['Spring pad', 'Climbing grate', 'Hanging chain rope', 'Wind vent', 'Cracked floor slab'].map((n) => assets.find((a) => a.category === 'mechanics' && a.name === n)?.asset_id).filter(Boolean);
scope.skip_ids = [...new Set([...(scope.skip_ids ?? []), ...obsoleteAssets])];
scope._v04 = 'v0.4: pominięte zasoby v0.3 niezgodne z fizyką v0.4 (sprężyna, kratka, łańcuch, wywietrznik, pęknięta posadzka). Pozy braci: patrz tools/add-v04-art.mjs.';
writeFileSync(S, JSON.stringify(scope, null, 2) + '\n');
console.log(`usunięto póz v0.3: ${removed.length}; dodano póz v0.4: ${added.length}; dodano zasobów mechanics: ${addedAssets}; pominięto zasobów v0.3: ${obsoleteAssets.length}`);
