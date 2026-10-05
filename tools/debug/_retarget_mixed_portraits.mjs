import fs from 'node:fs';

const csvPath = 'tables/content/npc_ai_ships.csv';
const genPath = 'src/data/generated/csvNpcCapitalShips.ts';
const csv = fs.readFileSync(csvPath, 'utf8');
const nl = csv.includes('\r\n') ? '\r\n' : '\n';
const lines = csv.split(/\r?\n/);

function retarget(id, from, to) {
  const i = lines.findIndex((l) => l.split(',')[1] === id);
  if (i < 0) throw new Error(`csv miss ${id}`);
  if (!lines[i].includes(from)) throw new Error(`from miss ${id}`);
  const count = lines[i].split(from).length - 1;
  if (count !== 1) throw new Error(`count ${count} ${id}`);
  lines[i] = lines[i].replace(from, to);
}

retarget('npc_red_fleet_3', 'assets/images/ship/npc_red_fleet_1.png', 'assets/images/ship/npc_red_fleet_3.png');
for (const id of ['npc_vega_red_5', 'npc_vega_red_7', 'npc_vega_red_9', 'npc_vega_red_10', 'npc_vega_red_12']) {
  retarget(id, 'assets/images/ship/npc_vega_red_4.png', 'assets/images/ship/npc_vega_red_5.png');
}
fs.writeFileSync(csvPath, lines.join(nl));

let gen = fs.readFileSync(genPath, 'utf8');
function patchGen(id, from, to) {
  const needle = `id: "${id}"`;
  const at = gen.indexOf(needle);
  if (at < 0) throw new Error(`gen miss ${id}`);
  const window = gen.slice(at, at + 2500);
  const key = `portraitImageAssetKey: "${from}"`;
  const rel = window.indexOf(key);
  if (rel < 0) throw new Error(`portrait miss ${id}`);
  const abs = at + rel;
  gen = `${gen.slice(0, abs)}portraitImageAssetKey: "${to}"${gen.slice(abs + key.length)}`;
}
patchGen('npc_red_fleet_3', 'assets/images/ship/npc_red_fleet_1.png', 'assets/images/ship/npc_red_fleet_3.png');
for (const id of ['npc_vega_red_5', 'npc_vega_red_7', 'npc_vega_red_9', 'npc_vega_red_10', 'npc_vega_red_12']) {
  patchGen(id, 'assets/images/ship/npc_vega_red_4.png', 'assets/images/ship/npc_vega_red_5.png');
}
fs.writeFileSync(genPath, gen);
console.log('patched');
