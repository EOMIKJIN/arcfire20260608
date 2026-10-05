import fs from 'node:fs';

const done = new Set((process.argv[2] || '').split(',').filter(Boolean));
const keep = new Set(['Player_freighter', 'Player_npc_red_fleet_1']);
const rows = JSON.parse(fs.readFileSync('tools/debug/_ship_portrait_manifest.json', 'utf8'));
const pending = rows.filter((r) => !done.has(r.id) && !keep.has(r.id));
console.log('pending', pending.length);
for (const r of pending.slice(0, 12)) {
  console.log([r.id, r.name, r.arch, r.hull, r.hp, r.shield, r.armor].join('\t'));
}
