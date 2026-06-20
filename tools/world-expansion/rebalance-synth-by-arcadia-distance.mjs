/**
 * synth_system_colonization.csv — 아르카디아 BFS hop·유클리드 거리 기준 zone/combat 리밸런스 (1안)
 *
 * - synth_XXX ordinal = 영구 ID (변경 없음)
 * - zoneIndex / targetCombatLevel / enemyAffinityKind / hostileShipCount = 거리 순위 → play_scenario 곡선
 * - 21 시나리오 행성 테이블은 수정하지 않음
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const SYNTH_CSV = resolve(ROOT, 'tables/balance/synth_system_colonization.csv');
const SCENARIO_CSV = resolve(ROOT, 'tables/balance/play_scenario_zone_planets.csv');
const REPORT_PATH = resolve(ROOT, 'tools/world-expansion/reports/synth-arcadia-rebalance-latest.md');

const { GALAXY_SYSTEMS } = await import('../../src/data/galaxy100.ts');

const ARCADIA = 'arcadia';
const SYNTH_ZONE_MAX = 16;

function parseCsv(text) {
  const rows = [];
  let i = 0;
  let field = '';
  let row = [];
  let inQuotes = false;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
      } else field += ch;
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ',') {
      row.push(field);
      field = '';
      i += 1;
      continue;
    }
    if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function csvEscape(value) {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function bfsDistances(fromId) {
  const dist = new Map([[fromId, 0]]);
  const q = [fromId];
  for (let qi = 0; qi < q.length; qi += 1) {
    const id = q[qi];
    const d = dist.get(id);
    for (const n of GALAXY_SYSTEMS[id]?.connections ?? []) {
      if (!GALAXY_SYSTEMS[n] || dist.has(n)) continue;
      dist.set(n, d + 1);
      q.push(n);
    }
  }
  return dist;
}

function euclid(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function rankToZoneIndex(rank, total) {
  if (total <= 1) return 1;
  const t = (rank - 1) / (total - 1);
  return Math.max(1, Math.min(SYNTH_ZONE_MAX, 1 + Math.round(t * (SYNTH_ZONE_MAX - 1))));
}

function buildScenarioByZone() {
  const rows = parseCsv(readFileSync(SCENARIO_CSV, 'utf8'));
  const header = rows[0].map((h) => h.replace(/^\uFEFF/, '').trim());
  const idx = Object.fromEntries(header.map((k, i) => [k, i]));
  const byZone = new Map();
  for (const cols of rows.slice(1)) {
    const zone = Number(cols[idx.zoneIndex]);
    if (!Number.isFinite(zone)) continue;
    byZone.set(zone, {
      hostileShipCount: Number(cols[idx.hostileShipCount]) || 1,
      targetCombatLevel: Number(cols[idx.targetCombatLevel]) || 1,
      enemyAffinityKind: cols[idx.enemyAffinityKind] || 'light',
    });
  }
  if (byZone.size === 0) {
    throw new Error('play_scenario_zone_planets.csv: no zones loaded');
  }
  return byZone;
}

function synthSuffix(id) {
  const raw = id.slice('synth_'.length);
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? String(n).padStart(3, '0') : raw;
}

function buildDescriptions(id, hop, suffix) {
  const unreachable = hop >= 999;
  const hopLabel = unreachable ? null : String(hop);
  return {
    systemDescriptionKo: unreachable
      ? `미개척-${suffix} — 은하 항로망에서 일시 비표시·격리된 미개척 성계.`
      : `아르카디아에서 ${hopLabel}성계 거리의 미개척-${suffix}. 항로와 연결되어 있으나 아직 본격 개척되지 않았다.`,
    planetDescriptionKo: `미개척-${suffix} — 아크코어 항로 개방·단계적 개척 프로토콜 대상 행성.`,
    systemDescriptionEn: unreachable
      ? `Synth-${suffix} — isolated frontier system (hidden from current route map).`
      : `Unexplored system synth-${suffix}, ${hopLabel} jump(s) from Arcadia via trade routes. Awaiting phased colonization.`,
    planetDescriptionEn: `Synth-${suffix} — frontier planet under ArcCore phased colonization protocol.`,
  };
}

const hops = bfsDistances(ARCADIA);
const arcPos = GALAXY_SYSTEMS[ARCADIA].position;
const scenarioByZone = buildScenarioByZone();

const raw = readFileSync(SYNTH_CSV, 'utf8').trim();
const table = parseCsv(raw);
const header = table[0].map((h) => h.replace(/^\uFEFF/, '').trim());
const col = Object.fromEntries(header.map((k, i) => [k, i]));

const dataRows = table.slice(1).filter((cols) => cols[col.synthSystemId]?.startsWith('synth_'));

const ranked = dataRows.map((cols) => {
  const id = cols[col.synthSystemId];
  const sys = GALAXY_SYSTEMS[id];
  const hop = hops.has(id) ? hops.get(id) : 999;
  const euc = sys ? euclid(sys.position, arcPos) : 999;
  const unreachable = hop >= 999;
  return { cols, id, hop, euc, unreachable };
});

ranked.sort((a, b) => {
  if (a.unreachable !== b.unreachable) return a.unreachable ? 1 : -1;
  return a.hop - b.hop || a.euc - b.euc || a.id.localeCompare(b.id);
});

const total = ranked.length;
const changes = [];
const outRows = [header];

for (let i = 0; i < ranked.length; i += 1) {
  const { cols, id, hop, euc } = ranked[i];
  const rank = i + 1;
  const zoneIndex = rankToZoneIndex(rank, total);
  const scenario =
    scenarioByZone.get(zoneIndex)
    ?? scenarioByZone.get(Math.min(zoneIndex, 21))
    ?? { hostileShipCount: 1, targetCombatLevel: 2, enemyAffinityKind: 'light' };
  const suffix = synthSuffix(id);
  const desc = buildDescriptions(id, hop, suffix);

  const next = [...cols];
  while (next.length < header.length) next.push('');

  const oldZone = Number(next[col.zoneIndex]);
  const oldCombat = Number(next[col.targetCombatLevel]);

  next[col.zoneIndex] = String(zoneIndex);
  next[col.targetCombatLevel] = String(scenario.targetCombatLevel);
  next[col.enemyAffinityKind] = scenario.enemyAffinityKind;
  next[col.hostileShipCount] = String(scenario.hostileShipCount);
  next[col.systemDescriptionKo] = desc.systemDescriptionKo;
  next[col.planetDescriptionKo] = desc.planetDescriptionKo;
  next[col.systemDescriptionEn] = desc.systemDescriptionEn;
  next[col.planetDescriptionEn] = desc.planetDescriptionEn;

  outRows.push(next);

  changes.push({
    id,
    hop,
    euc: euc.toFixed(3),
    rank,
    oldZone,
    zoneIndex,
    combat: scenario.targetCombatLevel,
    affinity: scenario.enemyAffinityKind,
    name: next[col.systemNameKo],
  });
}

const sortedOut = [header, ...outRows.slice(1).sort((a, b) => {
  const oa = Number(a[col.synthOrdinal]) || 0;
  const ob = Number(b[col.synthOrdinal]) || 0;
  return oa - ob;
})];

const csvBody = sortedOut.map((row) => row.map(csvEscape).join(',')).join('\n');
writeFileSync(SYNTH_CSV, `${csvBody}\n`, 'utf8');

let inversions = 0;
const byHop = [...changes].sort((a, b) => a.hop - b.hop || Number(a.euc) - Number(b.euc) || a.id.localeCompare(b.id));
for (let i = 1; i < byHop.length; i += 1) {
  if (byHop[i].zoneIndex < byHop[i - 1].zoneIndex) inversions += 1;
}

const s73 = changes.find((c) => c.id === 'synth_073');
const reportLines = [
  '# Synth Arcadia-distance rebalance',
  '',
  `Generated: ${new Date().toISOString()}`,
  `Systems: ${total} · zone cap: 1..${SYNTH_ZONE_MAX}`,
  `Monotonic zone inversions (sorted by hop): ${inversions}`,
  '',
  '## synth_073 (fresh-start seed)',
  '',
  '```json',
  JSON.stringify(s73 ?? null, null, 2),
  '```',
  '',
  '## Top 15 closest (after rebalance)',
  '',
  '| id | hop | rank | zone | combat | affinity | name |',
  '|---|---:|---:|---:|---:|---|---|',
];

for (const c of byHop.slice(0, 15)) {
  reportLines.push(
    `| ${c.id} | ${c.hop} | ${c.rank} | ${c.zoneIndex} | ${c.combat} | ${c.affinity} | ${c.name} |`,
  );
}

reportLines.push('', '## Largest zone drops (ordinal was too high)', '', '| id | hop | oldZone | newZone | name |', '|---|---:|---:|---:|---|');
const drops = [...changes]
  .filter((c) => c.oldZone > c.zoneIndex)
  .sort((a, b) => (b.oldZone - b.zoneIndex) - (a.oldZone - a.zoneIndex))
  .slice(0, 15);
for (const c of drops) {
  reportLines.push(`| ${c.id} | ${c.hop} | ${c.oldZone} | ${c.zoneIndex} | ${c.name} |`);
}

mkdirSync(resolve(ROOT, 'tools/world-expansion/reports'), { recursive: true });
writeFileSync(REPORT_PATH, `${reportLines.join('\n')}\n`, 'utf8');

console.log(`[rebalance-synth] wrote ${total} rows → ${SYNTH_CSV}`);
console.log(`[rebalance-synth] changed ${changes.length} balance rows · inversions ${inversions}`);
if (s73) {
  console.log(`[rebalance-synth] synth_073: hop=${s73.hop} zone ${s73.oldZone}→${s73.zoneIndex} combat=${s73.combat}`);
}
console.log(`[rebalance-synth] report → ${REPORT_PATH}`);
