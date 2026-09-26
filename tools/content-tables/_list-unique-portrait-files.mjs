import fs from 'node:fs';

const csv = fs.readFileSync('tables/content/npc_ai_captains.csv', 'utf8');
const lines = csv.split(/\r?\n/).filter((l) => l && !l.startsWith('id,'));
const ids = [];
for (const line of lines) {
  const id = line.split(',')[0];
  if (id) ids.push(id);
}
fs.writeFileSync(
  'tools/content-tables/_all-captain-ids.json',
  JSON.stringify(ids, null, 2),
);
console.log(`captains=${ids.length}`);
