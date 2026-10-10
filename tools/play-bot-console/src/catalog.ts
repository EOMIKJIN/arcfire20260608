import { PlanetOccupationSeeds_FROM_BALANCE_CSV } from '../../../src/data/balance/generated/csvPlanetOccupationSeeds';
import { PlayScenarioZonePlanets_FROM_BALANCE_CSV } from '../../../src/data/balance/generated/csvPlayScenarioZonePlanets';
import { PlanetDevelopmentCatalog_FROM_BALANCE_CSV } from '../../../src/data/balance/generated/csvPlanetDevelopmentCatalog';
import { STAR_SYSTEMS_FROM_CSV } from '../../../src/data/generated/csvSystems';
import { MISSIONS_FROM_CSV } from '../../../src/data/generated/csvMissions';
import { MAIN_STORY_QUESTS_FROM_CSV } from '../../../src/data/generated/csvMainStorySpine';
import { PLAYER_LEVEL_EXP_FROM_CSV } from '../../../src/data/generated/csvPlayerLevelExp';
import { SKILLS_FROM_CSV } from '../../../src/data/generated/csvSkills';
import { ITEM_DEFS_FROM_CSV } from '../../../src/data/generated/csvItemDefs';
import { CAPITAL_WEAPON_LIST_FROM_CSV } from '../../../src/data/generated/csvWeapons';
import { listAdjacentSystemIds } from '../../../src/arcCore/territorial/territorialSupplyLine';
import { resolveCombatWeaponSlotForWeaponId } from '../../../src/game/combatWeaponSlots';
import { resolveShipEquipmentSlotForItemDef } from '../../../src/game/shipEquipment/shipEquipmentModel';
import type { Mission, Skill } from '../../../src/types';
import { galaxyBfsNext, galaxyHops, galaxyPrimaryPlanet, galaxySystemOf } from './galaxyGraph';

/** 테이블 정본 — 크림슨 레기온 수도. */
export const CRIMSON_CAPITAL_PLANET_ID = 'core_prime';
export const CRIMSON_CAPITAL_SYSTEM_ID = 'arcfire_core';
/** 시작 블루 허브 · 무역+조선+점령전투 ON — 집중 개발 성계. */
export const FOCUS_PLANET_ID = 'solar_station';
export const FOCUS_SYSTEM_ID = 'solar_port';
export const DEV_MAX_LEVEL = 15;

export const STORY_IDS: readonly string[] = Array.from({ length: 30 }, (_, i) => {
  const n = String(i + 1).padStart(3, '0');
  return `story_${n}`;
});

let storyLevelGates: number[] | null = null;

/** 현재 레벨보다 높은 다음 본편 요구 레벨. 없으면 0. */
export function nextStoryLevelGate(level: number): number {
  if (!storyLevelGates) {
    storyLevelGates = [];
    for (let i = 0; i < STORY_IDS.length; i += 1) {
      const m = MISSIONS_FROM_CSV[STORY_IDS[i]!];
      if (m) storyLevelGates.push(m.levelRequired ?? 1);
    }
  }
  for (let i = 0; i < storyLevelGates.length; i += 1) {
    if (storyLevelGates[i]! > level) return storyLevelGates[i]!;
  }
  return 0;
}

/** 챕터1 기명 사이드 — 2단계에서 순회. 039–055 금지. */
export const CHAPTER1_SIDE_IDS: readonly string[] = [
  'sandbox_034',
  'sandbox_035',
  'sandbox_036',
  'sandbox_037',
  'sandbox_038',
  'sandbox_056',
  'sandbox_057',
  'sandbox_058',
  'sandbox_059',
  'sandbox_060',
  'sandbox_061',
  'sandbox_062',
  'sandbox_063',
];

const tclByPlanet = new Map<string, number>();
for (const row of PlayScenarioZonePlanets_FROM_BALANCE_CSV) {
  tclByPlanet.set(row.primaryPlanetId, Number(row.targetCombatLevel) || 1);
}

const tradeByPlanet = new Map<string, boolean>();
const shipyardByPlanet = new Map<string, boolean>();
const planetToSystem = new Map<string, string>();
const systemPrimary = new Map<string, string>();

for (const sysId of Object.keys(STAR_SYSTEMS_FROM_CSV)) {
  const sys = STAR_SYSTEMS_FROM_CSV[sysId as keyof typeof STAR_SYSTEMS_FROM_CSV];
  if (!sys) continue;
  for (const p of sys.planets) {
    planetToSystem.set(p.id, sys.id);
    tradeByPlanet.set(p.id, p.hasTradePort === true);
    shipyardByPlanet.set(p.id, p.hasShipyard === true);
    if (!systemPrimary.has(sys.id)) systemPrimary.set(sys.id, p.id);
  }
}

for (const seed of PlanetOccupationSeeds_FROM_BALANCE_CSV) {
  planetToSystem.set(seed.planetId, seed.systemId);
  if (!systemPrimary.has(seed.systemId)) systemPrimary.set(seed.systemId, seed.planetId);
}

export function lookupSystemId(planetId: string): string | null {
  return planetToSystem.get(planetId) ?? galaxySystemOf(planetId);
}

export function lookupPrimaryPlanet(systemId: string): string | null {
  return systemPrimary.get(systemId) ?? galaxyPrimaryPlanet(systemId);
}

export function lookupTcl(planetId: string): number {
  return tclByPlanet.get(planetId) ?? 8;
}

export function lookupHasTrade(planetId: string): boolean {
  return tradeByPlanet.get(planetId) === true;
}

export function lookupHasShipyard(planetId: string): boolean {
  return shipyardByPlanet.get(planetId) === true;
}

/** 실기 `missionNeighborReach` 와 동일 토큰. */
export const NEIGHBOR_SYSTEM_PLACEHOLDER = '__neighbor_system__';
/** 실기 `patchBarInstanceObjectiveTargetId` 탐사 행성 토큰. */
export const DISCOVERY_PLANET_PLACEHOLDER = '__discovery_planet__';

export const RESOLVED_QUEST_PLACEHOLDERS: readonly string[] = [
  NEIGHBOR_SYSTEM_PLACEHOLDER,
  DISCOVERY_PLANET_PLACEHOLDER,
];

export function isQuestPlaceholderToken(id: string | null | undefined): boolean {
  const s = (id ?? '').trim();
  return s.length >= 4 && s.startsWith('__') && s.endsWith('__');
}

export function isResolvedQuestPlaceholder(id: string): boolean {
  return RESOLVED_QUEST_PLACEHOLDERS.includes(id);
}

export function neighborHopPlanet(fromSystemId: string): string | null {
  const adj = listAdjacentSystemIds(fromSystemId);
  if (!adj.length) return null;
  return lookupPrimaryPlanet(adj[0]);
}

/** 수락 성계에서 1~3홉 첫 행성. 실기 discoveryPlanetId 축약. */
export function discoveryHopPlanet(fromSystemId: string, excludePlanetId?: string): string | null {
  const origin = fromSystemId.trim();
  if (!origin) return null;
  const exclude = excludePlanetId?.trim() ?? '';
  const seen = new Set<string>([origin]);
  let frontier = [origin];
  for (let hop = 1; hop <= 3; hop += 1) {
    const next: string[] = [];
    for (let i = 0; i < frontier.length; i += 1) {
      const adj = listAdjacentSystemIds(frontier[i]!);
      for (let j = 0; j < adj.length; j += 1) {
        const n = adj[j]!;
        if (seen.has(n)) continue;
        seen.add(n);
        next.push(n);
        const p = lookupPrimaryPlanet(n);
        if (p && p !== exclude) return p;
      }
    }
    frontier = next;
    if (!frontier.length) break;
  }
  return null;
}

export function listUnresolvedMissionPlaceholders(): Array<{ missionId: string; token: string }> {
  const out: Array<{ missionId: string; token: string }> = [];
  const ids = Object.keys(MISSIONS_FROM_CSV);
  for (let i = 0; i < ids.length; i += 1) {
    const m = MISSIONS_FROM_CSV[ids[i]!];
    if (!m) continue;
    const objs = m.objectives ?? [];
    for (let j = 0; j < objs.length; j += 1) {
      const token = objs[j]?.targetId ?? '';
      if (isQuestPlaceholderToken(token) && !isResolvedQuestPlaceholder(token)) {
        out.push({ missionId: m.id, token });
      }
    }
  }
  return out;
}

export function missionHasUnresolvedPlaceholder(missionId: string): boolean {
  const m = MISSIONS_FROM_CSV[missionId];
  if (!m) return false;
  const objs = m.objectives ?? [];
  for (let i = 0; i < objs.length; i += 1) {
    const token = objs[i]?.targetId ?? '';
    if (isQuestPlaceholderToken(token) && !isResolvedQuestPlaceholder(token)) return true;
  }
  return false;
}

export function getMission(id: string): Mission | null {
  return MISSIONS_FROM_CSV[id] ?? null;
}

export function levelFromTotalExp(totalExp: number): number {
  let lvl = 1;
  for (let i = 0; i < PLAYER_LEVEL_EXP_FROM_CSV.length; i += 1) {
    const row = PLAYER_LEVEL_EXP_FROM_CSV[i];
    if (totalExp >= row.currentExp) lvl = row.level;
  }
  return lvl;
}

export function nextLevelExp(level: number): number | null {
  const row = PLAYER_LEVEL_EXP_FROM_CSV.find((r) => r.level === level);
  return row?.nextLevelExp ?? null;
}

const nextHopCache = new Map<string, string | null>();

export function bfsNextSystem(fromSystem: string, toSystem: string): string | null {
  if (fromSystem === toSystem) return null;
  const key = `${fromSystem}>${toSystem}`;
  if (nextHopCache.has(key)) return nextHopCache.get(key) ?? null;
  const q: string[] = [fromSystem];
  const prev = new Map<string, string | null>();
  prev.set(fromSystem, null);
  let qi = 0;
  let found: string | null = null;
  while (qi < q.length) {
    const cur = q[qi];
    qi += 1;
    const adj = listAdjacentSystemIds(cur);
    for (let i = 0; i < adj.length; i += 1) {
      const n = adj[i];
      if (prev.has(n)) continue;
      prev.set(n, cur);
      if (n === toSystem) {
        let walk = n;
        let p = prev.get(walk) ?? null;
        while (p && p !== fromSystem) {
          walk = p;
          p = prev.get(walk) ?? null;
        }
        found = walk;
        qi = q.length;
        break;
      }
      q.push(n);
    }
  }
  const result = found ?? galaxyBfsNext(fromSystem, toSystem);
  nextHopCache.set(key, result);
  return result;
}

const hopCache = new Map<string, number>();

export function hopsBetween(fromSystem: string, toSystem: string): number {
  if (fromSystem === toSystem) return 0;
  const key = `${fromSystem}>${toSystem}`;
  const hit = hopCache.get(key);
  if (hit !== undefined) return hit;
  const q: string[] = [fromSystem];
  const dist = new Map<string, number>([[fromSystem, 0]]);
  let qi = 0;
  let found = -1;
  while (qi < q.length) {
    const cur = q[qi];
    qi += 1;
    const d = dist.get(cur) ?? 0;
    const adj = listAdjacentSystemIds(cur);
    for (let i = 0; i < adj.length; i += 1) {
      const n = adj[i];
      if (dist.has(n)) continue;
      dist.set(n, d + 1);
      if (n === toSystem) {
        found = d + 1;
        qi = q.length;
        break;
      }
      q.push(n);
    }
  }
  const hops = found >= 0 ? found : galaxyHops(fromSystem, toSystem);
  hopCache.set(key, hops);
  return hops;
}

export function objectivePlanetId(type: string, targetId: string): string | null {
  if (type === 'reach_planet') {
    if (isQuestPlaceholderToken(targetId)) return null;
    return targetId || null;
  }
  if (type === 'reach_system') {
    if (targetId === NEIGHBOR_SYSTEM_PLACEHOLDER) return null;
    return lookupPrimaryPlanet(targetId);
  }
  if (
    type === 'talk_npc'
    || type === 'deliver_cargo'
    || type === 'buy_goods'
    || type === 'collect_item'
    || type === 'defeat_enemy'
  ) {
    const parts = targetId.split('|');
    if (parts.length >= 2) return parts[1] || null;
  }
  return null;
}

function isForbiddenGapSandbox(id: string): boolean {
  const m = /^sandbox_(\d+)$/.exec(id);
  if (!m) return false;
  const n = Number(m[1]);
  return n >= 39 && n <= 55;
}

const skeletonBindMissionIds = new Set(
  MAIN_STORY_QUESTS_FROM_CSV
    .filter((row) => row.contentStatus === 'skeleton' && Boolean(row.bindMissionId))
    .map((row) => row.bindMissionId as string),
);

function isSkeletonMainStoryMission(id: string): boolean {
  return skeletonBindMissionIds.has(id);
}

function missionRank(id: string): number {
  if (id.startsWith('story_')) return 0;
  if (id.startsWith('sandbox_')) return 1;
  if (id.startsWith('mission_')) return 2;
  if (id.startsWith('tq_')) return 3;
  return 4;
}

let playableMissionIds: string[] | null = null;

/** CSV에 있는 수행 가능 퀘스트. 039–055 공백·본선 skeleton bind는 제외. */
export function listPlayableMissionIds(): string[] {
  if (playableMissionIds) return playableMissionIds;
  playableMissionIds = Object.keys(MISSIONS_FROM_CSV)
    .filter((id) => !isForbiddenGapSandbox(id) && !isSkeletonMainStoryMission(id))
    .sort((a, b) => missionRank(a) - missionRank(b) || a.localeCompare(b));
  return playableMissionIds;
}

const SKILL_LIST: Skill[] = Object.values(SKILLS_FROM_CSV);

export function listSkills(): Skill[] {
  return SKILL_LIST;
}

export type GearCandidate = {
  id: string;
  name: string;
  slot: string;
  price: number;
  score: number;
  levelReq: number;
};

let gearCache: GearCandidate[] | null = null;

/**
 * 무기 장착 칸 — 실기 `resolveCombatWeaponSlotForWeaponId`(combatWeaponSlots.ts:46) WEAPON_1..4 를
 * 트윈 함선 무장 키(liveCombat hullGunSlots)로 옮긴다. 레이저=1 · 미사일=2 · 로켓=3 · 그 외=4.
 * 예전 트윈은 무기 아이템을 'weapon' 칸에 따로 둬 함선 기본 4문 위에 5번째 포로 더했다(과대).
 * 장비는 실기 `resolveShipEquipmentSlotForItemDef`(shipEquipmentModel.ts:119) 칸 — 장갑판·외장장갑=ARMOR, 실드증폭=EX_02.
 */
const WEAPON_SLOT_KEY: Record<string, string> = {
  WEAPON_1: 'weapon_laser',
  WEAPON_2: 'weapon_missile',
  WEAPON_3: 'weapon_close',
  WEAPON_4: 'weapon_aux',
};

function weaponGearSlot(weaponId: string): string {
  const slot = resolveCombatWeaponSlotForWeaponId(weaponId);
  return (slot && WEAPON_SLOT_KEY[slot]) || 'weapon_aux';
}

export function listGearCandidates(): GearCandidate[] {
  if (gearCache) return gearCache;
  const out: GearCandidate[] = [];
  const ids = Object.keys(ITEM_DEFS_FROM_CSV);
  for (let i = 0; i < ids.length; i += 1) {
    const it = ITEM_DEFS_FROM_CSV[ids[i]];
    if (it.id.includes('_wave')) continue;
    if (!it.capitalShipMountable || !it.tradeable) continue;
    if (it.kind !== 'equipment' && it.type !== 'weapon_module' && it.type !== 'ship_equipment') continue;
    const attrs = it.attrs ?? {};
    const isWeapon = it.type === 'weapon_module';
    const slot = isWeapon
      ? weaponGearSlot(String(attrs.weaponId ?? it.id.replace(/^weapon_item_/, '')))
      : resolveShipEquipmentSlotForItemDef(it.id) ?? String(attrs.equipmentCategory ?? 'module');
    const grade = Number(attrs.equipmentGrade) || 1;
    const mul = Number(attrs.equipmentPerformanceMul) || 1;
    const levelReq = Number(isWeapon ? attrs.weaponRequiredLevel : attrs.equipmentRequiredLevel) || 1;
    const extra = Number(attrs.speedBonusPct ?? attrs.firepower ?? 0) || 0;
    out.push({
      id: it.id,
      name: it.name,
      slot,
      price: Math.max(1, it.basePrice | 0),
      score: grade * 100 + mul * 40 + extra + it.basePrice / 5000,
      levelReq,
    });
  }
  const wids = Object.keys(CAPITAL_WEAPON_LIST_FROM_CSV);
  for (let i = 0; i < wids.length; i += 1) {
    const w = CAPITAL_WEAPON_LIST_FROM_CSV[wids[i]];
    if (w.id.includes('_wave')) continue;
    if (!w.tradePortListed) continue;
    const dps = (w.damage * Math.max(1, w.salvoCount) * 1000) / Math.max(200, w.cooldownMs);
    out.push({
      id: w.id,
      name: w.name,
      slot: weaponGearSlot(w.id),
      price: Math.max(1, w.purchasePrice | 0),
      score: dps * 12 + w.requiredLevel * 4 + w.rangePx / 40,
      levelReq: w.requiredLevel || 1,
    });
  }
  out.sort((a, b) => b.score - a.score);
  gearCache = out;
  return out;
}

const gearById = new Map<string, GearCandidate>();

export function gearScoreOf(id: string): number {
  if (gearById.size === 0) {
    const rows = listGearCandidates();
    for (let i = 0; i < rows.length; i += 1) gearById.set(rows[i].id, rows[i]);
  }
  return gearById.get(id)?.score ?? 0;
}

const TRADE_HUBS: string[] = [];
for (const id of tradeByPlanet.keys()) {
  if (tradeByPlanet.get(id) === true) TRADE_HUBS.push(id);
}

export function nearestTradePlanet(fromPlanetId: string): string {
  if (lookupHasTrade(fromPlanetId)) return fromPlanetId;
  const fromSys = lookupSystemId(fromPlanetId) ?? 'arcadia';
  let best = 'solar_station';
  let bestH = 1e9;
  for (let i = 0; i < TRADE_HUBS.length; i += 1) {
    const id = TRADE_HUBS[i];
    if (!lookupHasTrade(id)) continue;
    const sys = lookupSystemId(id);
    if (!sys) continue;
    const h = hopsBetween(fromSys, sys);
    if (h < bestH) {
      bestH = h;
      best = id;
    }
  }
  return best;
}

export function itemBasePrice(itemId: string): number {
  const id = itemId.split('|')[0] || itemId;
  const def = ITEM_DEFS_FROM_CSV[id];
  if (def && def.basePrice > 0) return def.basePrice | 0;
  return 420;
}

export type DevModuleRow = { id: string; labelKo: string; installCost: number };

let devCache: DevModuleRow[] | null = null;

export function listDevModules(): DevModuleRow[] {
  if (devCache) return devCache;
  devCache = PlanetDevelopmentCatalog_FROM_BALANCE_CSV
    .filter((r) => r.enabled === 'true' && r.id.length > 0)
    .map((r) => ({
      id: r.id,
      labelKo: r.labelKo,
      installCost: Math.max(0, Number(r.installCostCredits) || 0),
    }));
  return devCache;
}

export const CORE_PLANET_IDS = PlanetOccupationSeeds_FROM_BALANCE_CSV
  .filter((s) => !s.planetId.startsWith('synth_'))
  .map((s) => s.planetId);

export const CORE_PLANET_SET = new Set<string>(CORE_PLANET_IDS);

export { PlanetOccupationSeeds_FROM_BALANCE_CSV };
