import fs from 'node:fs';

const rows = JSON.parse(fs.readFileSync('tools/debug/_ship_portrait_manifest.json', 'utf8'));
const hull = {};
for (const r of rows) hull[r.hull] = (hull[r.hull] || 0) + 1;
console.log('hulls', hull);
console.log('--- sample ---');
for (const r of rows) {
  const d = r.desc.replace(/\s+/g, ' ').slice(0, 70);
  console.log([r.id, r.arch, r.hull, r.hp, r.shield, r.armor, r.sizeClass, r.name, d].join(' | '));
}
