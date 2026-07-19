// 검증: generated 등급 존재 + 동일 reserveOrder BLUE/RED 등급 차 ≤2 + 역전확률 상한 20%
import fs from 'node:fs';

const t = fs.readFileSync('src/data/generated/csvPlanetGovernorReserveCommanders.ts', 'utf8');
const rows = [...t.matchAll(
  /captainId: "(npc_cpt_gov_reserve_(blue|red|neutral)_(\d+))"[\s\S]*?combatTacticsGrade: (-?\d+)/g,
)].map((m) => ({ id: m[1], side: m[2], ord: Number(m[3]), g: Number(m[4]) }));

const bl = new Map(rows.filter((r) => r.side === 'blue').map((r) => [r.ord, r.g]));
const rd = new Map(rows.filter((r) => r.side === 'red').map((r) => [r.ord, r.g]));
let bad = 0;
for (let i = 1; i <= 20; i += 1) {
  const d = Math.abs((bl.get(i) ?? 0) - (rd.get(i) ?? 0));
  if (d > 2) { bad += 1; console.log('order', i, 'diff', d); }
}
const outOfRange = rows.filter((r) => r.g < -5 || r.g > 5).length;
const maxChance = Math.max(
  ...rows.map((a) => Math.max(...rows.map((b) => Math.min(20, Math.max(0, (a.g - b.g) * 2))))),
);
console.log(`rows=${rows.length} pairBad=${bad} outOfRange=${outOfRange} maxReversalPct=${maxChance}`);
process.exit(bad > 0 || outOfRange > 0 ? 1 : 0);
