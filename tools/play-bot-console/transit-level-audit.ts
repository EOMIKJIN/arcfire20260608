/**
 * 이동중 전투 적 레벨 배치 전수 조사 (읽기 전용 · 김플레이).
 * 아르카디아 기준 홉 거리 · 성계 zone · 조우 확률 · 목적지 전용적 함장 · 무기 TCL · 선체 스케일 HP.
 *   npx tsx tools/play-bot-console/transit-level-audit.ts [playerLevel]
 */
(globalThis as { __DEV__?: boolean }).__DEV__ = false;

import { writeFileSync, mkdirSync } from 'node:fs';
import { GALAXY_SYSTEMS_PRECOMPUTED as GALAXY_SYSTEMS } from '../../src/data/generated/galaxySystems100.generated';
import {
  resolveCombatEncounterTargetLevel,
  resolveTransitCombatEncounterTargetLevel,
} from '../../src/arcCore/balance/balanceTableRegistry';
import { resolveTransitEncounterChance } from '../../src/missions/missionCombatEncounter';
import {
  resolveTransitHostileCaptainForSystem,
  resolveTransitHostileHullScalePlanetId,
} from '../../src/npc/transitHostileCaptainResolve';
import { getNpcCapitalShip, listNpcCaptains } from '../../src/npc/npcFleetRegistry';
import { applyPlanetHostileHullScale } from '../../src/combat/planetHostileHullScale';
const START = 'arcadia';
const playerLevel = Number(process.argv[2] ?? 5);

const hop = new Map<string, number>([[START, 0]]);
const queue = [START];
while (queue.length) {
  const id = queue.shift()!;
  for (const n of GALAXY_SYSTEMS[id]?.connections ?? []) {
    if (hop.has(n) || !GALAXY_SYSTEMS[n]) continue;
    hop.set(n, hop.get(id)! + 1);
    queue.push(n);
  }
}

const dedicatedCount = new Map<string, number>();
for (const c of listNpcCaptains()) {
  if (!c.id.startsWith('npc_cpt_enemy_')) continue;
  const systems = new Set([c.baseSystemId, ...c.activitySystemIds].filter(Boolean) as string[]);
  for (const s of systems) dedicatedCount.set(s, (dedicatedCount.get(s) ?? 0) + 1);
}

type Row = Record<string, string | number>;
const rows: Row[] = [];
for (const [sid, h] of [...hop.entries()].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))) {
  const sys = GALAXY_SYSTEMS[sid]!;
  const destTcl = resolveCombatEncounterTargetLevel('__transit__', sid);
  const weaponTcl = resolveTransitCombatEncounterTargetLevel(sid, playerLevel);
  const captain = resolveTransitHostileCaptainForSystem(sid);
  const ship = captain?.assignedShipId ? getNpcCapitalShip(captain.assignedShipId) : undefined;
  const hullPlanet = resolveTransitHostileHullScalePlanetId(sid, captain?.id ?? null);
  const scaled = ship ? applyPlanetHostileHullScale(hullPlanet, ship.combat) : undefined;
  rows.push({
    hop: h,
    systemId: sid,
    name: sys.name,
    zone: sys.zone,
    sysEnemyLv: sys.enemyLevel,
    encounterPct: Math.round(resolveTransitEncounterChance(sys.zone, false, undefined, null, sid) * 100),
    destTcl,
    weaponTcl,
    captain: captain?.id ?? '-',
    captainLv: captain?.progression?.initialLevel ?? '-',
    dedicated: dedicatedCount.get(sid) ?? 0,
    ship: ship?.id ?? '-',
    baseHp: ship?.combat.maxHp ?? 0,
    baseShield: ship?.combat.maxShield ?? 0,
    hullPlanet,
    hp: scaled?.maxHp ?? 0,
    shield: scaled?.maxShield ?? 0,
    armor: scaled?.armor ?? 0,
    exp: ship?.combat.expReward ?? 0,
  });
}

const keys = Object.keys(rows[0] ?? {});
const csv = [keys.join(','), ...rows.map((r) => keys.map((k) => String(r[k]).replace(/,/g, ' ')).join(','))].join('\n');
mkdirSync('tools/play-bot-console/out/transit-level-audit', { recursive: true });
const out = `tools/play-bot-console/out/transit-level-audit/transit-level-audit-pl${playerLevel}.csv`;
writeFileSync(out, `\uFEFF${csv}\n`);
console.log(`rows=${rows.length} unreachable=${Object.keys(GALAXY_SYSTEMS).length - hop.size} -> ${out}`);
