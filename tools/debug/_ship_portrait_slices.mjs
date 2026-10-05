import fs from 'node:fs';
import path from 'node:path';

const rows = JSON.parse(fs.readFileSync('tools/debug/_ship_portrait_manifest.json', 'utf8'));
const keep = new Set(['Player_freighter', 'Player_npc_red_fleet_1']);
const dir = 'assets/images/ship';

function hint(r) {
  const name = `${r.name} ${r.id} ${r.hull}`;
  let role = 'slim white-grey patrol corvette';
  if (r.hull.includes('line')) role = 'broad-shouldered line warship with forward cannon housings';
  if (r.hull.includes('raider')) role = 'swept-wing raider with exposed thrusters';
  if (r.hull.includes('siege')) role = 'heavy siege hull with dorsal battery houses and a thick belly';
  if (r.hull.includes('carrier')) role = 'light carrier with a hangar jaw, not a round escape pod';
  if (r.hull.includes('research')) role = 'research hull with sensor dishes and clean laboratory panels';
  if (/화물|cargo/.test(name)) role = 'boxy armed freighter with cargo containers along the flanks';
  if (/arc_seed|ARC/.test(name)) role = 'escort transport with a single tall beacon mast';
  const hp = r.hp;
  const bulk = hp >= 1500 ? 'monumental, cranes look tiny' : hp >= 700 ? 'capital, nearly fills the bay' : hp >= 450 ? 'fills most of the frame' : hp >= 250 ? 'medium, hangar floor still visible' : 'small in a large hangar';
  const plate = r.armor >= 18 ? 'very thick stacked armor plates' : r.armor >= 13 ? 'layered armor plates' : 'thin armor skin';
  const shield = r.shield >= 220 ? 'strong blue shield glow along the rim' : r.shield >= 100 ? 'modest blue shield emitters' : 'dim shield lights';
  let paint = 'white and pale-grey metal, dark panel seams';
  if (/red|크림|레드|약탈|혈|홍월|침입|사냥|강습|차단/.test(name)) paint = 'charcoal and white armor with deep red accent panels';
  if (/blue|블루|수호|경비|연합/.test(name)) paint = 'white armor with blue running lights';
  return `${r.name}. ${role}. ${bulk}. ${plate}. ${shield}. ${paint}.`;
}

const pending = rows.filter((r) => !keep.has(r.id) && !fs.existsSync(path.join(dir, `${r.id}.png`)));
const slices = [[], [], [], []];
pending.forEach((r, i) => {
  slices[i % 4].push({ id: r.id, name: r.name, hint: hint(r) });
});
for (let i = 0; i < 4; i += 1) {
  const file = `tools/debug/_ship_batch_${i}.json`;
  fs.writeFileSync(file, JSON.stringify(slices[i], null, 2));
  console.log(file, slices[i].length);
}
console.log('pending', pending.length);
