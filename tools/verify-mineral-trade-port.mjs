/** 무역소 10종 광물 등록·거래 검증 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const catalog = [
  'ore_ferrite', 'ore_silicate', 'ore_carbon', 'ore_nickel', 'ore_titanium',
  'ore_crystal', 'ore_platinum', 'ore_orichalcum', 'ore_neutronium', 'ore_voidstone',
];

const defs = readFileSync(resolve(ROOT, 'src/data/generated/csvItemDefs.ts'), 'utf8');

console.log('id\ttradeable\tsellable\tTRADE_GOODS\tbuyTab');
for (const id of catalog) {
  const re = new RegExp(`"${id}":\\s*\\{[\\s\\S]*?\\n  \\},`);
  const m = defs.match(re);
  const chunk = m?.[0] ?? '';
  const tradeable = /tradeable: true/.test(chunk);
  const sellable = /sellable: true/.test(chunk);
  const rawMat = /kind: "raw_material"/.test(chunk);
  const mineralCat = /category: "mineral"/.test(chunk);
  const buyTab = rawMat && mineralCat ? 'equipment' : '?';
  console.log([id, tradeable, sellable, tradeable, buyTab].join('\t'));
}

const pools = [
  [1, 4], [5, 4], [6, 7], [10, 7], [11, 8], [16, 10], [21, 10],
];
console.log('\nzone\tbuyCatalogCount\tminerals');
const names = ['', 'ore_ferrite', 'ore_silicate', 'ore_carbon', 'ore_nickel', 'ore_titanium', 'ore_crystal', 'ore_platinum', 'ore_orichalcum', 'ore_neutronium', 'ore_voidstone'];
for (const [z, maxIdx] of [[1,4],[5,4],[6,7],[10,7],[11,8],[16,10],[21,10]]) {
  let min = 1;
  if (z >= 16) min = 7;
  else if (z >= 11) min = 6;
  else if (z >= 6) min = 4;
  const ids = names.slice(min, maxIdx + 1);
  console.log(`${z}\t${ids.length}\t${ids.join(', ')}`);
}
