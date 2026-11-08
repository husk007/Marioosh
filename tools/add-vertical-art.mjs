// Dopisuje do biblioteki grafik zasoby potrzebne przebudowanej (pionowej) grze — idempotentnie:
//   * kategoria „mechanics”: kafelki i elementy nowych mechanik (zbocza, sprężyna, kratka, lina, lód, olej, piasek, pęknięta posadzka, wiatr)
//   * nowe pozy Marioosha i Darioosha (szybowanie, zwis, ślizg po ścianie, toczenie, wspinaczka po kratce, pływanie, wyrzut ze sprężyny, uderzenie w ziemię, odbicie od ściany)
// Użycie: node tools/add-vertical-art.mjs   (potem: node tools/art-roadmap.mjs — odświeża kolejkę i Art Station)
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const P = join(root, 'tools', 'art-prompts.json'), Q = join(root, 'tools', 'art-poses.json');
const assets = JSON.parse(readFileSync(P, 'utf8')), poses = JSON.parse(readFileSync(Q, 'utf8'));
const tile = assets.find((a) => a.asset_id === 'PLANET_TILES-002');
const STYLE = tile.prompt_en.split('\nSUBJECT:')[0];
const NEG = tile.negative_prompt_en;
const PAL = '#71C878, #7BCEEC, #F5C04A, #275E55, #F7FFF0';

const MECH = [
  ['Slope 45 degrees - ground ramp', 'A smooth 45-degree rising ground ramp tile (low edge on the left, high edge on the right) with the same rounded grass top, soil cutaway and peach limestone core as the planet ground tile, so it joins flat tiles seamlessly. Top surface is a clean diagonal line from the bottom-left corner to the top-right corner; everything below the line is solid ground, everything above is transparent.', '256x256', 'seamless transparent slope tile; the diagonal runs exactly corner to corner of the 256x256 canvas, mirrored for the left-rising variant in code'],
  ['Slope 26 degrees - gentle ramp pair', 'Two gentle 26-degree ground ramp tiles side by side as a 512x256 pair: first rises from 0 to half height, second from half to full height, same materials as the planet ground tile and joining flat tiles seamlessly.', '512x256', 'two seamless transparent slope tiles side by side; each 256x256'],
  ['Spring pad', 'A chunky friendly spring pad: a steel coil spring inside a rounded insulated housing with a glowing cyan rim and a bright orange pressure plate on top, shown at rest. Reads clearly as a bounce pad at small size. Side-on view, sits on the ground line.', '256x256', 'transparent sprite; feet baseline at the bottom edge, three animation states later (rest, pressed, extended)'],
  ['Climbing grate', 'A wall of metal climbing grate: evenly spaced round steel bars forming a square mesh with rubber-insulated blue junction clips, subtly worn, slightly translucent so the background shows through the gaps. Seamless vertically and horizontally.', '256x256', 'seamless transparent tile; the bars must read as something you can grab'],
  ['Hanging chain rope', 'A vertical hanging rope-and-chain tile: braided rope with small steel links and a cyan insulation sleeve every few links; clearly a thin climbable line against the background. Seamless vertically.', '256x256', 'seamless vertical transparent tile; the rope runs through the center of the canvas'],
  ['Ice surface', 'A slippery ice ground tile: glassy pale-cyan crystal top with a bright specular streak and frosted core, rounded safe edges, same silhouette as the planet ground tile top. Reads instantly as slippery.', '256x256', 'seamless transparent tile; same top line as a flat ground tile'],
  ['Oil slick surface', 'An oil-slick ground tile: dark glossy iridescent oil film with purple and teal rainbow sheen over a dark soil core, same silhouette as the planet ground tile top. Reads instantly as very slippery. Not toxic-looking, child-friendly.', '256x256', 'seamless transparent tile; same top line as a flat ground tile'],
  ['Sand surface', 'A soft sand ground tile: warm golden dune texture with small ripples and tiny cyan glass specks, same silhouette as the planet ground tile top. Reads instantly as slow, soft ground.', '256x256', 'seamless transparent tile; same top line as a flat ground tile'],
  ['Wind vent', 'A rounded floor wind vent: a grilled circular fan housing with soft cyan swirling air streaks rising above it, signalling an upward gust. Side-on, sits on the ground line.', '256x256', 'transparent sprite; air streaks fade out toward the top'],
  ['Cracked floor slab', 'A cracked breakable floor tile: the same ground tile with a network of glowing orange hairline cracks and a slightly raised stressed top, clearly a weak spot that a heavy ground-pound would break. Seamless with the planet ground tile.', '256x256', 'seamless transparent tile; the cracks must read clearly at small size'],
];
const nextId = (() => { let n = 0; for (const a of assets) if (a.category === 'mechanics') n = Math.max(n, +a.asset_id.split('-')[1]); return () => 'MECHANICS-' + String(++n).padStart(3, '0'); })();
let added = 0;
for (const [name, subject, size, deliv] of MECH) {
  if (assets.some((a) => a.category === 'mechanics' && a.name === name)) continue;
  assets.push({
    asset_id: nextId(), name, category: 'mechanics', planet: 'Lumenia', source_size: size, palette: PAL, reference_asset_id: null,
    prompt_en: `${STYLE}\nSUBJECT: ${name}. ${subject}\nPALETTE: ${PAL}.\nRENDERING AND COMPOSITION: Seamless or modular HD 2D environment art at side-on gameplay angle, hand-painted shapes, no interface, no characters, no readable text.\nDELIVERY: ${deliv}; requested source canvas ${size}. One standalone asset only; do not include unrelated objects or multiple characters.`,
    negative_prompt_en: NEG,
  }); added++;
}
const idOf = (name) => assets.find((a) => a.category === 'mechanics' && a.name === name).asset_id;

const NEW_POSES = {   // stan → [opis, klatki, kto]
  glide: ['floating down with arms spread wide and slightly raised like a parachute, legs relaxed, hair and tool pouch lifted by the air', 6, 'MD'],
  ledge_hang: ['hanging from a ledge edge by both hands, body dangling against the wall, legs bent, looking up with effort; the ledge is at the top of the frame', 4, 'MD'],
  wall_slide: ['sliding down a vertical wall with one palm and both shoes pressed to it, body leaning back, small friction sparks at the contact point', 4, 'MD'],
  roll: ['curled into a fast rolling ball while sliding down a slope, helmet tucked, speed streaks behind', 6, 'MD'],
  climb_grate: ['climbing a metal mesh wall seen from the side, one hand and one foot gripping the bars, reaching upward', 8, 'MD'],
  swim: ['swimming forward in water with a strong kick, body streamlined, small bubbles trailing', 8, 'MD'],
  spring_launch: ['shot upward off a spring pad with arms stretched overhead and legs together, stretched body, small motion lines below', 4, 'MD'],
  ground_pound: ['plunging straight down with the broad wrench held below like a hammer, knees tucked, impact streaks above', 4, 'M'],
  wall_jump: ['kicking off a vertical wall in a wide spring, body twisting away from the wall, one foot just leaving it', 4, 'D'],
};
const EXTRA = { climb_grate: 'MECHANICS-GRATE', spring_launch: 'MECHANICS-SPRING', ground_pound: 'MECHANICS-CRACK' };
let addedPoses = 0;
for (const [cid, who] of [['CHARACTERS-001', 'M'], ['CHARACTERS-002', 'D']]) {
  const proto = poses.find((p) => p.asset_id === cid && p.state === 'climb_wire'); if (!proto) throw new Error('brak pozy wzorcowej ' + cid);
  const head = proto.prompt_en.split('\nANIMATION STATE JOB:')[0];
  for (const [state, [desc, frames, kto]] of Object.entries(NEW_POSES)) {
    if (!kto.includes(who) || poses.some((p) => p.asset_id === cid && p.state === state)) continue;
    poses.push({ job_id: `${cid}__${state}`, asset_id: cid, state, target_frames: frames, prompt_en: `${head}\nANIMATION STATE JOB: Produce a single readable key pose for state ${state.replace(/_/g, ' ')}: the character is ${desc}. Keep exact costume, height, art line, reference model, anchor point and side-facing view. Further in-between frames should be generated/edited as a controlled animation production process. Do not pack poses into an inaccurate contact sheet.` });
    addedPoses++;
  }
}
writeFileSync(P, JSON.stringify(assets)); writeFileSync(Q, JSON.stringify(poses));
writeFileSync(join(root, 'tools', 'art-mechanics.json'), JSON.stringify({ grate: idOf('Climbing grate'), spring: idOf('Spring pad'), crack: idOf('Cracked floor slab') }));
console.log(`dopisano: ${added} zasobów „mechanics”, ${addedPoses} póz`);
