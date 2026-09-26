import fs from 'node:fs';

const csv = fs.readFileSync('tables/content/npc_ai_captains.csv', 'utf8');
const lines = csv.split(/\r?\n/).filter(Boolean);
const header = lines[0].split(',');
const profileIdx = header.lastIndexOf('profileKo');
const idIdx = 0;
const nameIdx = 1;
const factionIdx = 4;

const re = /로봇|기계|안드로이드|홀로|연산 함장|연산 집합|세라믹|비인간|합성체|외계|클론|사이보그|드론|무성|격자|제어 로봇|제어로봇|인공|유기질이 아닌|마모/;

const rows = [];
for (let i = 1; i < lines.length; i += 1) {
  const cols = [];
  let cur = '';
  let q = false;
  for (const ch of lines[i]) {
    if (ch === '"') q = !q;
    else if (ch === ',' && !q) {
      cols.push(cur);
      cur = '';
    } else cur += ch;
  }
  cols.push(cur);
  const id = cols[idIdx];
  const profile = cols[profileIdx] || '';
  const faction = cols[factionIdx] || '';
  const hit = re.test(profile) || /ancients|ai_robot|vector|genesis/.test(`${id} ${faction}`);
  if (hit) {
    rows.push({
      id,
      name: cols[nameIdx],
      faction,
      snippet: profile.replace(/\s+/g, ' ').slice(0, 160),
    });
  }
}
fs.writeFileSync('tools/content-tables/_nonhuman-flag-candidates.json', JSON.stringify(rows, null, 2));
console.log(`candidates=${rows.length}`);
for (const r of rows) console.log(`${r.id}\t${r.faction}\t${r.name}`);
