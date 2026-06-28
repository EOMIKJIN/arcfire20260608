/**
 * 미션 퀘스트 배치 전수 감사 — buy_goods · defeat_enemy 플레이 가능성
 * 실행: npm run audit:mission-quest-placements
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const TABLE_DIR = resolve(ROOT, 'tables', 'content');

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

function loadCsv(name) {
  const path = resolve(TABLE_DIR, name);
  if (!existsSync(path)) return [];
  const raw = readFileSync(path, 'utf8').trim();
  const rows = parseCsv(raw);
  if (rows.length < 2) return [];
  const header = rows[0].map((h) => String(h).replace(/^\uFEFF/, ''));
  return rows.slice(1).map((cols) => {
    const out = {};
    for (let i = 0; i < header.length; i += 1) out[header[i]] = cols[i] ?? '';
    return out;
  });
}

const objectives = loadCsv('mission_objectives.csv');
const placements = loadCsv('mission_quest_placements.csv');
const combatOps = loadCsv('mission_quest_combat_ops.csv');
const planets = loadCsv('planets.csv');
const itemDefs = loadCsv('item_defs.csv');
const enemyTemplates = loadCsv('enemy_templates.csv');
const combatCaptains = loadCsv('mission_combat_captains.csv');
const missions = loadCsv('missions.csv');

const tradePortPlanetIds = new Set(
  planets.filter((p) => String(p.hasTradePort).toLowerCase() === 'true').map((p) => p.id.trim()),
);
const tradeableItemIds = new Set(
  itemDefs.filter((d) => String(d.tradeable).toLowerCase() === 'true').map((d) => d.id.trim()),
);
const enemyTemplateIds = new Set(enemyTemplates.map((e) => e.id.trim()));
const missionById = new Map(missions.map((m) => [m.id.trim(), m]));

const placementByObjective = new Map(placements.map((p) => [p.objectiveId.trim(), p]));
const combatOpByObjective = new Map(combatOps.map((c) => [c.objectiveId.trim(), c]));

const errors = [];
const warnings = [];

function err(msg) {
  errors.push(msg);
}
function warn(msg) {
  warnings.push(msg);
}

const buyObjectives = objectives.filter((o) => o.type === 'buy_goods');
const defeatObjectives = objectives.filter((o) => o.type === 'defeat_enemy');

for (const obj of buyObjectives) {
  const oid = obj.id.trim();
  const placement = placementByObjective.get(oid);
  if (!placement) {
    err(`buy_goods objective ${oid} (${obj.missionId}): mission_quest_placements.csv 행 없음`);
    continue;
  }
  if (placement.itemId.trim() !== obj.targetId.trim()) {
    err(`${oid}: placement.itemId(${placement.itemId}) !== objective.targetId(${obj.targetId})`);
  }
  const planetId = placement.planetId.trim();
  if (!tradePortPlanetIds.has(planetId)) {
    console.log(`  [info] ${oid}: ${planetId} — CSV 무역소 없음 · 퀘스트 전용 무역 SUB-STAGE 허용`);
  }
  if (!tradeableItemIds.has(placement.itemId.trim())) {
    err(`${oid}: itemId ${placement.itemId} — tradeable 아님 또는 item_defs 없음`);
  }
  const qty = Number.parseInt(String(obj.quantity ?? '1'), 10);
  const stock = Number.parseInt(String(placement.stockQty ?? '0'), 10);
  if (!Number.isFinite(stock) || stock < qty) {
    err(`${oid}: stockQty(${stock}) < objective.quantity(${qty})`);
  }
  if (String(placement.questTag ?? '').trim() !== 'quest') {
    warn(`${oid}: questTag가 'quest'가 아님 — ${placement.questTag}`);
  }
}

for (const obj of defeatObjectives) {
  const oid = obj.id.trim();
  const op = combatOpByObjective.get(oid);
  if (!op) {
    err(`defeat_enemy objective ${oid} (${obj.missionId}): mission_quest_combat_ops.csv 행 없음`);
    continue;
  }
  if (op.encounterPolicy.trim() !== 'transit_guaranteed') {
    warn(`${oid}: encounterPolicy=${op.encounterPolicy} (권장: transit_guaranteed)`);
  }
  const enemyId = obj.targetId.trim();
  if (!enemyTemplateIds.has(enemyId)) {
    err(`${oid}: enemy template ${enemyId} — enemy_templates.csv 없음`);
  }
  const anchor = op.anchorPlanetId?.trim() ?? '';
  const mission = missionById.get(obj.missionId.trim());
  const captainPlanet = anchor || mission?.offerPlanetId?.trim() || '';
  const hasCaptain = combatCaptains.some(
    (row) =>
      row.enemyTemplateId.trim() === enemyId
      && (row.planetId.trim() === captainPlanet || row.planetId.trim() === '' || !row.planetId),
  );
  if (!hasCaptain) {
    err(`${oid}: mission_combat_captains 매핑 없음 — enemy=${enemyId} planet=${captainPlanet || '(default)'}`);
  }
}

for (const p of placements) {
  const oid = p.objectiveId.trim();
  if (!objectives.some((o) => o.id.trim() === oid && o.type === 'buy_goods')) {
    warn(`placement ${p.id}: objectiveId ${oid} — buy_goods objective 없음(고아 행)`);
  }
}

for (const c of combatOps) {
  const oid = c.objectiveId.trim();
  if (!objectives.some((o) => o.id.trim() === oid && o.type === 'defeat_enemy')) {
    warn(`combat_op ${c.id}: objectiveId ${oid} — defeat_enemy objective 없음(고아 행)`);
  }
}

console.log('=== audit:mission-quest-placements ===');
console.log(`buy_goods objectives: ${buyObjectives.length}`);
console.log(`defeat_enemy objectives: ${defeatObjectives.length}`);
console.log(`placements: ${placements.length} · combat_ops: ${combatOps.length}`);

if (warnings.length > 0) {
  console.log('\n[WARN]');
  warnings.forEach((w) => console.log(`  - ${w}`));
}

if (errors.length > 0) {
  console.log('\n[FAIL]');
  errors.forEach((e) => console.log(`  - ${e}`));
  process.exit(1);
}

console.log('\nPASS — 모든 buy_goods/defeat_enemy 목표에 퀘스트 배치·전투 운영 행 존재');
