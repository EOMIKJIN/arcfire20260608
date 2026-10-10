/**
 * 플레이봇 전투·연료 — 게임 표를 행동 시점에 읽는다. Skia 전투 엔진은 돌리지 않는다.
 * 궤도·웨이브 크레딧은 0. 템플릿 creditReward 는 이동중 조우만.
 * 승패는 선체 유효HP와 무기 DPS. 16% 승률 바닥은 없다.
 * A-9b(2026-10-10): 유효HP·받는 피해에 숙련 HP 배율·장비(HP/실드/장갑/피해감소/미사일 회피/재생/쿨다운)·스킬 바인드를 실기 순서대로 넣는다.
 * A-9c: 패배 굴림이면 적을 다 잡기 전에 격침된 것으로 본다(전멸시키고 파괴되는 모순 제거).
 *
 * [pss-pre-dev] hot_path=행동 1회 alloc=숫자 cache=함선·구역·무기DPS·연료정책 모듈 1회
 * [pss-pre-dev] stage=Node 트윈 risk=없음 verdict=PASS
 */
import { CapitalShipTradeListingPolicy_FROM_BALANCE_CSV } from '../../../src/data/balance/generated/csvCapitalShipTradeListingPolicy';
import { GalaxyTransitFuelPolicy_FROM_BALANCE_CSV } from '../../../src/data/balance/generated/csvGalaxyTransitFuelPolicy';
import { GalaxyTransitHullFuelMul_FROM_BALANCE_CSV } from '../../../src/data/balance/generated/csvGalaxyTransitHullFuelMul';
import { PlayScenarioZonePlanets_FROM_BALANCE_CSV } from '../../../src/data/balance/generated/csvPlayScenarioZonePlanets';
import { NPC_CAPITAL_SHIPS_FROM_CSV, NPC_CAPITAL_SHIP_COMBAT_RUNTIME_CONFIG_FROM_CSV } from '../../../src/data/generated/csvNpcCapitalShips';
import { CAPITAL_WEAPON_LIST_FROM_CSV } from '../../../src/data/generated/csvWeapons';
import { STAR_SYSTEMS_FROM_CSV } from '../../../src/data/generated/csvSystems';
import { resolveHostileEnemyWeaponLoadout } from '../../../src/combat/hostileEnemyWeaponLoadoutFromBalance';
import { isWaveTestTradeShipId } from '../../../src/economy/waveDefenseTestTradeItems';
import { findHullTierKeyForListedShip } from '../../../src/arcCore/balance/capitalShipTradeListingPolicy';
import { resolveProficiencyMultiplier } from '../../../src/combat/pilotProficiency';
import { resolvePlanetTargetEngageSec } from '../../../src/arcCore/balance/balanceTableRegistry';
import { applyMineralUpgradeToShipPerformance, calculateShipPerformance } from '../../../src/combat/ShipPerformanceCalculator';
import { applyShipEquipmentToShipPerformance } from '../../../src/game/shipEquipment/shipEquipmentCombatBridge';
import {
  aggregateShipEquipmentBonuses,
  applyShipEquipmentStatBonusToCombat,
  resolveShipEquipmentAgentKnobs,
  resolveShipEquipmentSlotForItemDef,
} from '../../../src/game/shipEquipment/shipEquipmentModel';
import { shipEquipmentPolicy } from '../../../src/game/shipEquipment/shipEquipmentEffectPolicy';
import { skillCombatPolicyNum } from '../../../src/game/skillAutoCombatPolicy';
import {
  computeMineralUpgradeEffectScalar,
  getMineralUpgradeStatDef,
} from '../../../src/game/shipyardMineralUpgrade/mineralUpgradeModel';
import { resolvePlayerCombatSkillBind } from '../../../src/game/playerOwnedSkillCombatBind';
import type { NpcCapitalCombatStats, PlayerShip } from '../../../src/types';
import { listPlanetWaveEnemySlots } from '../../../src/game/waveDefense/waveDefensePlanetEnemyIndex';
import { resolveTransitEncounterChance } from '../../../src/missions/missionCombatEncounter';
import type { MissionProgress } from '../../../src/types';
import type { WorldState } from './types';
import { getMission } from './catalog';

export const STARTER_HULL_SHIP_ID = 'Player_npc_red_fleet_1';

type ShipBody = {
  id: string;
  ehp: number;
  armor: number;
  exp: number;
  diceDps: number;
};

type ZoneFight = {
  hostile: number;
  required: number;
  variant: string;
  tcl: number;
};

const shipById = new Map<string, ShipBody>();
const hostileCurve: ShipBody[] = [];
const zoneByPlanet = new Map<string, ZoneFight>();
const zoneRows: ZoneFight[] = [];
const weaponDps = new Map<string, number>();
const enemyGunDps = new Array<number>(81).fill(0);
/** 적 무장 DPS 중 미사일 몫(0..1). ECM·디코이 회피는 미사일에만 걸린다(PlanetEdenRaidTestLayer.tsx:1027). */
const enemyMissileShare = new Array<number>(81).fill(0);
const hullFuelMul = new Map<string, number>();
/** 함선 CSV 원시 전투 스탯. 실기 calculateShipPerformance 입력. */
const shipCombatRow = new Map<string, NpcCapitalCombatStats>();

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function diceDps(count: number, sides: number, bonus: number, attackBonus: number): number {
  const expected = count * ((sides + 1) / 2) + bonus;
  const rate = 0.5 * (1 + Math.max(0, attackBonus) * 0.01);
  return Math.max(0.1, expected * rate);
}

function gunDps(id: string): number {
  const hit = weaponDps.get(id);
  if (hit !== undefined) return hit;
  const row = CAPITAL_WEAPON_LIST_FROM_CSV[id];
  const dps = row
    ? (row.damage * Math.max(1, row.salvoCount)) / Math.max(0.45, row.cooldownMs / 1000)
    : 0;
  weaponDps.set(id, dps);
  return dps;
}

for (let i = 0; i < NPC_CAPITAL_SHIPS_FROM_CSV.length; i += 1) {
  const row = NPC_CAPITAL_SHIPS_FROM_CSV[i];
  if (!row || shipById.has(row.id)) continue;
  const body: ShipBody = {
    id: row.id,
    ehp: Math.max(1, row.combat.maxHp + row.combat.maxShield),
    armor: row.combat.armor,
    exp: Math.max(0, row.combat.expReward),
    diceDps: diceDps(
      row.combat.damageDice.count,
      row.combat.damageDice.sides,
      row.combat.damageDice.bonus,
      row.combat.attackBonus,
    ),
  };
  shipById.set(row.id, body);
  shipCombatRow.set(row.id, row.combat);
  if (!row.id.startsWith('Player') && !row.id.startsWith('player_')) hostileCurve.push(body);
}
hostileCurve.sort((a, b) => a.ehp - b.ehp || a.exp - b.exp);

for (let i = 0; i < PlayScenarioZonePlanets_FROM_BALANCE_CSV.length; i += 1) {
  const row = PlayScenarioZonePlanets_FROM_BALANCE_CSV[i];
  const zone: ZoneFight = {
    hostile: Math.max(1, Number(row.hostileShipCount) || 1),
    required: Math.max(0, Number(row.requiredFleetMinDps) || 0),
    variant: row.mainStageCombatVariant,
    tcl: Math.max(1, Number(row.targetCombatLevel) || 1),
  };
  zoneRows.push(zone);
  zoneByPlanet.set(row.primaryPlanetId, zone);
}

for (let tcl = 1; tcl <= 80; tcl += 1) {
  let sum = 0;
  let missile = 0;
  for (let pattern = 0; pattern < 3; pattern += 1) {
    const load = resolveHostileEnemyWeaponLoadout(pattern, tcl);
    const m = gunDps(load.missileWeaponId);
    sum += gunDps(load.laserWeaponId) + m;
    missile += m;
  }
  enemyGunDps[tcl] = sum / 3;
  enemyMissileShare[tcl] = sum > 0 ? missile / sum : 0;
}

for (let i = 0; i < GalaxyTransitHullFuelMul_FROM_BALANCE_CSV.length; i += 1) {
  const row = GalaxyTransitHullFuelMul_FROM_BALANCE_CSV[i];
  hullFuelMul.set(row.hullTierKey, Number(row.fuelCostMul) || 1);
}

function fuelNum(key: string, fallback: number): number {
  for (let i = 0; i < GalaxyTransitFuelPolicy_FROM_BALANCE_CSV.length; i += 1) {
    const row = GalaxyTransitFuelPolicy_FROM_BALANCE_CSV[i];
    if (row.key === key) {
      const n = Number(row.value);
      return Number.isFinite(n) ? n : fallback;
    }
  }
  return fallback;
}

const FUEL = {
  base: Math.max(1, fuelNum('base_credits_per_hop', 50)),
  min: Math.max(1, fuelNum('min_credits_per_hop', 50)),
  refDist: Math.max(0.01, fuelNum('reference_hop_distance', 0.18)),
  distMin: fuelNum('distance_mul_min', 0.85),
  distMax: fuelNum('distance_mul_max', 2.25),
  distExp: Math.max(1, fuelNum('distance_curve_exponent', 1.45)),
  routeExp: Math.max(1, fuelNum('route_length_exponent', 1.18)),
  routeRef: Math.max(1, fuelNum('reference_route_hop_count', 3)),
};

function zoneOf(planetId: string, tcl: number): ZoneFight {
  const hit = zoneByPlanet.get(planetId);
  if (hit) return hit;
  let best = zoneRows[0];
  let bestGap = 1e9;
  for (let i = 0; i < zoneRows.length; i += 1) {
    const gap = Math.abs(zoneRows[i].tcl - tcl);
    if (gap < bestGap) {
      bestGap = gap;
      best = zoneRows[i];
    }
  }
  return best ?? { hostile: 1, required: 0, variant: '', tcl };
}

function hostileBody(tcl: number): ShipBody {
  const n = hostileCurve.length;
  if (n === 0) {
    return { id: '', ehp: 120, armor: 4, exp: 20, diceDps: 4 };
  }
  const idx = Math.min(n - 1, Math.max(0, Math.round(((tcl - 1) / 79) * (n - 1))));
  return hostileCurve[idx];
}

function weaponIdOf(raw: string): string {
  return raw.startsWith('weapon_item_') ? raw.slice('weapon_item_'.length) : raw;
}

type GunSlot = { key: string; id: string };

const hullGunCache = new Map<string, GunSlot[]>();

function hullGunSlots(shipId: string): GunSlot[] {
  const hit = hullGunCache.get(shipId);
  if (hit) return hit;
  const runtime = NPC_CAPITAL_SHIP_COMBAT_RUNTIME_CONFIG_FROM_CSV[shipId];
  const slots: GunSlot[] = [];
  if (runtime) {
    const laser = runtime.laserWeaponId?.trim();
    const missile = runtime.missileWeaponId?.trim();
    const close = runtime.closeRangeWeaponId?.trim();
    const aux = runtime.auxWeaponId?.trim();
    if (laser) slots.push({ key: 'weapon_laser', id: laser });
    if (missile) slots.push({ key: 'weapon_missile', id: missile });
    if (close) slots.push({ key: 'weapon_close', id: close });
    if (aux) slots.push({ key: 'weapon_aux', id: aux });
  }
  hullGunCache.set(shipId, slots);
  return slots;
}

/**
 * 함선 강화의 무기 계열별 효과(2026-10-10 %형) — 실기 PlanetEdenRaidTestLayer 타격 피해 = (선체 주사위 + 무기 피해) × 계열 배수,
 * 연사 강화 = 계열 재장전 배수(하한 effectFloor ms). 효과량은 함선 등급별(hull_upgrade_tier_policy).
 */
type FamilyMineral = { laserMul: number; missileMul: number; laserCdMul: number; missileCdMul: number };

const NO_FAMILY_MINERAL: FamilyMineral = { laserMul: 1, missileMul: 1, laserCdMul: 1, missileCdMul: 1 };

function familyMineralOf(upgrades: Record<string, number> | undefined, hullTierKey: string | null): FamilyMineral {
  if (!upgrades) return NO_FAMILY_MINERAL;
  const out = { ...NO_FAMILY_MINERAL };
  const ids = Object.keys(upgrades);
  for (let i = 0; i < ids.length; i += 1) {
    const def = getMineralUpgradeStatDef(ids[i]);
    const lv = upgrades[ids[i]] ?? 0;
    if (!def || lv <= 0) continue;
    if (def.effectKind !== 'weapon_fire_rate_cooldown') continue;
    const s = computeMineralUpgradeEffectScalar(ids[i], lv, hullTierKey);
    if (def.upgradeGroup === 'weapon_laser') out.laserCdMul *= s;
    if (def.upgradeGroup === 'weapon_missile') out.missileCdMul *= s;
  }
  return out;
}

/** 무기 1정 DPS — 함선 강화 계열 배수·연사 반영(재장전 하한 effectFloor 는 근사로 생략). */
function familyGunDps(id: string, fm: FamilyMineral): number {
  const row = CAPITAL_WEAPON_LIST_FROM_CSV[id];
  if (!row) return gunDps(id);
  const isLaser = row.kind === 'laser';
  const mul = isLaser ? fm.laserMul : fm.missileMul;
  const cd = isLaser ? fm.laserCdMul : fm.missileCdMul;
  return (gunDps(id) * mul) / Math.max(0.05, cd);
}

function playerGunDps(shipId: string, equipped: Record<string, string>, fm: FamilyMineral = NO_FAMILY_MINERAL): number {
  const slots = hullGunSlots(shipId || STARTER_HULL_SHIP_ID);
  const used = new Set<string>();
  let sum = 0;
  for (let i = 0; i < slots.length; i += 1) {
    const slot = slots[i];
    const bought = equipped[slot.key];
    const id = bought ? weaponIdOf(bought) : slot.id;
    if (id) sum += familyGunDps(id, fm);
    used.add(slot.key);
  }
  const keys = Object.keys(equipped);
  for (let i = 0; i < keys.length; i += 1) {
    if (used.has(keys[i])) continue;
    const id = equipped[keys[i]];
    if (id) sum += familyGunDps(weaponIdOf(id), fm);
  }
  return sum;
}

/**
 * 플레이어 쪽 전투 스냅샷 — 실기 `resolvePlayerFlagshipCombatBinding`(PlanetEdenRaidTestLayer.tsx:2010) 순서를 따른다.
 * 숙련(calculateShipPerformance) → [광물 강화: 트윈에 행동 없음 → 0] → 장비(applyShipEquipmentToShipPerformance)
 * → 장비 노브(피해감소·미사일 회피·선체 재생·회피 AC) → 스킬 바인드(피해감소·실드 배율·장갑·쿨다운).
 */
type PlayerSide = {
  ehp: number;
  armor: number;
  dps: number;
  /** 받는 피해 배율(장비 DR × 스킬 DR × 회피 AC 근사). */
  incomingMul: number;
  /** 적 미사일 빗나감 확률(ECM·디코이). */
  missileMiss: number;
  /** 장비 선체 재생 HP/초. */
  regenPerSec: number;
};

type PlayerSideInput = {
  hullShipId: string;
  level: number;
  equipped: Record<string, string>;
  skills: readonly string[];
  /** 이 함선의 광물 강화(함선별 · 다른 함선으로 넘기지 않음) */
  mineralUpgrades?: Record<string, number>;
  /** 함선 CSV 대신 쓸 전투 스탯(밸런스 도구 · 사다리 성능 규칙 계산용) */
  combatOverride?: NpcCapitalCombatStats;
};

/** 실기 전투 프레임 20틱/초 기준 — resolveShipEquipmentAgentKnobs 의 `/60/20` (shipEquipmentModel.ts:232). */
const COMBAT_TICKS_PER_SEC = 20;

function toEquipSlots(equipped: Record<string, string>): PlayerShip['equipSlots'] {
  const out: Record<string, { itemDefId: string; name: string }> = {};
  const keys = Object.keys(equipped);
  for (let i = 0; i < keys.length; i += 1) {
    const id = equipped[keys[i]];
    if (!id) continue;
    const slot = resolveShipEquipmentSlotForItemDef(id);
    if (!slot) continue;
    out[slot] = { itemDefId: id, name: id };
  }
  return out as PlayerShip['equipSlots'];
}

function buildPlayerSide(input: PlayerSideInput): PlayerSide {
  const shipId = input.hullShipId || STARTER_HULL_SHIP_ID;
  const body = shipById.get(shipId) ?? shipById.get(STARTER_HULL_SHIP_ID);
  const row = input.combatOverride ?? shipCombatRow.get(shipId) ?? shipCombatRow.get(STARTER_HULL_SHIP_ID);
  const rowDiceDps = input.combatOverride
    ? diceDps(row!.damageDice.count, row!.damageDice.sides, row!.damageDice.bonus, row!.attackBonus)
    : body?.diceDps;
  const prof = resolveProficiencyMultiplier(input.level);
  const skill = resolvePlayerCombatSkillBind(input.skills);
  const equipSlots = toEquipSlots(input.equipped);
  const bonuses = aggregateShipEquipmentBonuses(equipSlots);
  let ehp = body?.ehp ?? 770;
  let armor = body?.armor ?? 16;
  let maxHull = ehp;
  const hullTierKey = findHullTierKeyForListedShip(shipId);
  let fm = familyMineralOf(input.mineralUpgrades, hullTierKey);
  if (row) {
    // 실기 순서: 장비 스탯(shipStatPipeline · 숙련 전 1회) → 숙련 → 광물 강화 → 장비 runtime
    let perf = calculateShipPerformance(
      applyShipEquipmentStatBonusToCombat(row, equipSlots),
      { level: input.level, proficiencyMultiplier: prof },
    );
    perf = applyMineralUpgradeToShipPerformance(perf, input.mineralUpgrades, hullTierKey);
    perf = applyShipEquipmentToShipPerformance(perf, equipSlots);
    fm = { ...fm, laserMul: perf.combat.laserDamageMul ?? 1, missileMul: perf.combat.missileDamageMul ?? 1 };
    maxHull = perf.combat.maxHp;
    // 실드 배율·장갑 가산은 스킬 바인드 (PlanetEdenRaidTestLayer.tsx:2421-2423)
    ehp = Math.max(1, perf.combat.maxHp + Math.round(perf.combat.maxShield * skill.shieldMaxMul));
    armor = perf.combat.armor + skill.armorBonus;
  }
  const knobs = resolveShipEquipmentAgentKnobs(maxHull, bonuses);
  // 회피 AC: d20 명중 판정(PlanetEdenRaidTestLayer.tsx:1044) — AC 1 = 명중 5%p 감소 근사. 하한 0.5.
  const acMul = Math.max(0.5, 1 - knobs.acBonus * 0.05);
  // 실기 피해식 equipmentMul(0.65..1) × skillMul(0.6..1) (PlanetEdenRaidTestLayer.tsx:1115-1123)
  // 하한은 실기와 같은 CSV 정책(ship_equipment_effect_policy · skill_auto_combat_policy)
  const incomingMul = Math.max(shipEquipmentPolicy('knob_incoming_damage_mul_floor'), Math.min(1, knobs.incomingDamageMul))
    * Math.max(skillCombatPolicyNum('incoming_damage_mul_floor'), Math.min(1, skill.incomingDamageMul))
    * acMul;
  // 쿨다운: 장비 cdFactor(정책 하한..1) × 스킬 weaponCooldownMul. 0.4 = 트윈 근사 하한(실기는 무기별 ms 하한)
  const cdMul = Math.max(0.4, Math.max(
    shipEquipmentPolicy('runtime_cooldown_factor_min'),
    Math.min(1, 1 - bonuses.cooldownReductionPct / 100),
  ) * skill.weaponCooldownMul);
  // 선체 주사위 피해도 타격마다 계열 배수를 받는다 — 두 계열 평균으로 근사
  const diceMul = (fm.laserMul + fm.missileMul) / 2;
  const dps = ((rowDiceDps ?? 12) * diceMul + playerGunDps(shipId, input.equipped, fm) / cdMul) * prof;
  return {
    ehp,
    armor,
    dps,
    incomingMul,
    missileMiss: knobs.missileMissChance,
    regenPerSec: knobs.hullRegenPerTick * COMBAT_TICKS_PER_SEC,
  };
}

let sideKey = '';
let sideCache: PlayerSide | null = null;

/** 플레이어 전투 스냅샷 키 — 함선·레벨·스킬 수·장착. 바뀔 때만 다시 계산(가치 비교 캐시 공용). */
export function playerCombatSig(world: WorldState): string {
  const eqKeys = Object.keys(world.equipped);
  let sig = `${world.hullShipId || STARTER_HULL_SHIP_ID}|${world.level}|${world.learnedSkills.length}`;
  for (let i = 0; i < eqKeys.length; i += 1) sig += `|${eqKeys[i]}=${world.equipped[eqKeys[i]]}`;
  const up = world.hullUpgrades;
  if (up) {
    const upKeys = Object.keys(up);
    for (let i = 0; i < upKeys.length; i += 1) sig += `|u:${upKeys[i]}=${up[upKeys[i]]}`;
  }
  return sig;
}

function playerSide(world: WorldState): PlayerSide {
  const sig = playerCombatSig(world);
  if (sig === sideKey && sideCache) return sideCache;
  sideKey = sig;
  sideCache = buildPlayerSide({
    hullShipId: world.hullShipId || STARTER_HULL_SHIP_ID,
    level: world.level,
    equipped: world.equipped,
    skills: world.learnedSkills,
    mineralUpgrades: world.hullUpgrades,
  });
  return sideCache;
}

/** 밸런스 도구용 — 함선 스탯·레벨·강화를 직접 넣은 전투력 지표(playerCombatPower 와 같은 식). */
export function combatPowerOfSide(input: PlayerSideInput): number {
  const side = buildPlayerSide(input);
  const mit = clamp(side.armor / 100, 0, 0.5);
  const taken = (1 - mit) * side.incomingMul * (1 - 0.5 * side.missileMiss);
  return (side.ehp * side.dps) / Math.max(0.05, taken);
}

export type { PlayerSideInput };

/**
 * 함대와 무관한 전투력 지표 = 유효HP × DPS ÷ 받는 피해 배율. 승률 여유(liveSec/killSec)에 비례한다.
 * 함선·장비 가치(전투력 상승÷가격) 비교용.
 */
export function playerCombatPower(
  world: WorldState,
  patch?: {
    hullShipId?: string;
    equipped?: Record<string, string>;
    skills?: readonly string[];
    mineralUpgrades?: Record<string, number>;
  },
): number {
  const curHull = world.hullShipId || STARTER_HULL_SHIP_ID;
  const hull = patch?.hullShipId ?? curHull;
  const side = patch
    ? buildPlayerSide({
      hullShipId: hull,
      level: world.level,
      equipped: patch.equipped ?? world.equipped,
      skills: patch.skills ?? world.learnedSkills,
      // 함선별 강화 — 다른 함선은 강화 0에서 시작(넘겨주지 않음)
      mineralUpgrades: patch.mineralUpgrades ?? (hull === curHull ? world.hullUpgrades : undefined),
    })
    : playerSide(world);
  const mit = clamp(side.armor / 100, 0, 0.5);
  const taken = (1 - mit) * side.incomingMul * (1 - 0.5 * side.missileMiss);
  return (side.ehp * side.dps) / Math.max(0.05, taken);
}

type FleetSnap = {
  ehpEach: number;
  ehpTotal: number;
  dps: number;
  /** dps 중 미사일 무장 몫. */
  missileDps: number;
  expShips: number[];
  ehpShips: number[];
};

const fleetCache = new Map<string, FleetSnap>();

function fleetOf(planetId: string, tcl: number): FleetSnap {
  const key = `${planetId}:${tcl | 0}`;
  const hit = fleetCache.get(key);
  if (hit) return hit;
  const slots = listPlanetWaveEnemySlots(planetId);
  const bodies: ShipBody[] = [];
  for (let i = 0; i < slots.length; i += 1) {
    const body = shipById.get(slots[i].shipId);
    if (body) bodies.push(body);
  }
  if (bodies.length === 0) {
    const zone = zoneOf(planetId, tcl);
    const one = hostileBody(tcl);
    for (let i = 0; i < zone.hostile; i += 1) bodies.push(one);
  }
  const tclIdx = Math.max(1, Math.min(80, tcl | 0));
  const gun = enemyGunDps[tclIdx] || 0;
  const missileGun = gun * (enemyMissileShare[tclIdx] || 0);
  let ehpTotal = 0;
  let dps = 0;
  let missileDps = 0;
  const expShips: number[] = [];
  const ehpShips: number[] = [];
  for (let i = 0; i < bodies.length; i += 1) {
    const body = bodies[i];
    ehpTotal += body.ehp;
    ehpShips.push(body.ehp);
    expShips.push(body.exp);
    dps += body.diceDps + gun;
    missileDps += missileGun;
  }
  const snap: FleetSnap = {
    ehpEach: ehpTotal / Math.max(1, bodies.length),
    ehpTotal,
    dps: Math.max(0.05, dps),
    missileDps,
    expShips,
    ehpShips,
  };
  fleetCache.set(key, snap);
  return snap;
}

export type FightOdds = {
  chance: number;
  expEach: number;
  fleet: number;
  ehpEach: number;
  playerDps: number;
  requiredDps: number;
  expShips: number[];
  ehpShips: number[];
  liveSec: number;
  killSec: number;
};

// ── A-7b 실기 통합 레벨링 globalEngageHpMul (runIntegratedEngageHpAdjustPass.ts) ──
const ENGAGE_MUL_MIN = 0.7;
const ENGAGE_MUL_MAX = 1.3;
const ENGAGE_MUL_STEP = 0.025;
const ENGAGE_MIN_SAMPLES = 3;
const ENGAGE_LOG_CAP = 20;
const ENGAGE_TARGET_SEC = resolvePlanetTargetEngageSec('eden_prime');

export function engageHpMulOf(world: WorldState): number {
  const m = world.engageHpMul;
  return typeof m === 'number' && m > 0 ? clamp(m, ENGAGE_MUL_MIN, ENGAGE_MUL_MAX) : 1;
}

function noteEngageSec(world: WorldState, sec: number): void {
  if (!(sec > 0) || !Number.isFinite(sec)) return;
  const log = world.engageSecLog ?? (world.engageSecLog = []);
  log.push(sec);
  if (log.length > ENGAGE_LOG_CAP) log.splice(0, log.length - ENGAGE_LOG_CAP);
}

/** 일 1회 — 실기와 같은 규칙: 평균 교전이 목표×1.12 초과면 −0.025, ×0.88 미만이면 +0.025, 0.7~1.3, 표본 3 이상. */
export function adjustEngageHpMulDaily(world: WorldState): void {
  const log = world.engageSecLog ?? [];
  if (log.length < ENGAGE_MIN_SAMPLES) return;
  let sum = 0;
  for (let i = 0; i < log.length; i += 1) sum += log[i];
  const avg = sum / log.length;
  let next = engageHpMulOf(world);
  if (avg > ENGAGE_TARGET_SEC * 1.12) next -= ENGAGE_MUL_STEP;
  else if (avg < ENGAGE_TARGET_SEC * 0.88) next += ENGAGE_MUL_STEP;
  world.engageHpMul = clamp(next, ENGAGE_MUL_MIN, ENGAGE_MUL_MAX);
}

/** 이길 수 없으면 0. 이긴 뒤의 확률에도 16% 바닥을 두지 않는다. 요구 함대 DPS 게이트는 쓰지 않는다. */
export function fightOdds(world: WorldState, planetId: string, tcl: number): FightOdds {
  const zone = zoneOf(planetId, tcl);
  const me = playerSide(world);
  const playerDps = me.dps;
  const base = fleetOf(planetId, tcl);
  const hpMul = engageHpMulOf(world);
  // 실기 globalEngageHpMul 은 적 유효HP에 곱해진다 — 캐시된 함대 스냅샷은 건드리지 않고 배율 사본을 쓴다.
  const foe = hpMul === 1
    ? base
    : { ...base, ehpEach: base.ehpEach * hpMul, ehpTotal: base.ehpTotal * hpMul, ehpShips: base.ehpShips.map((h) => h * hpMul) };
  const mit = clamp(me.armor / 100, 0, 0.5);
  // 미사일 몫만 ECM·디코이로 빗나간다. 이후 장갑·피해감소. 선체 재생은 초당 피해에서 뺀다(하한 10%).
  const raw = Math.max(0.05, foe.dps - foe.missileDps * me.missileMiss);
  const hit = raw * (1 - mit) * me.incomingMul;
  const incoming = Math.max(0.05, hit * 0.1, hit - me.regenPerSec);
  const killSec = foe.ehpTotal / Math.max(0.05, playerDps);
  const liveSec = me.ehp / incoming;
  let chance = 0;
  if (liveSec > killSec && playerDps > 0) {
    // x = 내가 적을 잡는 시간 ÷ 적이 나를 잡는 시간. x ≥ 0.5(우위 2배 이하)는 예전과 같이 1 − x(0.5 = 50:50 도전선).
    // x < 0.5 는 우위가 클수록 1에 빨리 가깝게 — 대표님 기준(2026-10-10): 사람은 압도적 우위의 사냥을 수백 번 반복해도
    // 파괴당하지 않는다. 예전 상한 0.92(매 전투 8% 패배)는 이 기준과 맞지 않아 교체. 실기 전투 기록으로 추후 보정.
    const x = killSec / liveSec;
    // 지수 6: 우위 2.5배 ≈ 0.87 · 3배 ≈ 0.98 · 4배 ≈ 0.992 (잠정 · 실기 전투 기록으로 보정 예정)
    const raw = x >= 0.5 ? 1 - x : 1 - 0.5 * Math.pow(2 * x, 6);
    chance = Math.min(0.9995, Math.max(0.02, raw));
  }
  let expSum = 0;
  for (let i = 0; i < foe.expShips.length; i += 1) expSum += foe.expShips[i];
  return {
    chance,
    expEach: foe.expShips.length > 0 ? expSum / foe.expShips.length : 0,
    fleet: foe.expShips.length,
    ehpEach: foe.ehpEach,
    playerDps,
    requiredDps: zone.required,
    expShips: foe.expShips,
    ehpShips: foe.ehpShips,
    liveSec,
    killSec,
  };
}

export type FightPay = {
  win: boolean;
  chance: number;
  exp: number;
  killed: number;
  fleet: number;
};

export function resolveFightPay(
  world: WorldState,
  planetId: string,
  tcl: number,
  roll: number,
): FightPay {
  const odds = fightOdds(world, planetId, tcl);
  const win = odds.chance > 0 && roll < odds.chance;
  let killed = 0;
  let exp = 0;
  if (win) {
    killed = odds.fleet;
    for (let i = 0; i < odds.expShips.length; i += 1) exp += odds.expShips[i];
    noteEngageSec(world, odds.killSec);
  } else {
    // A-9c: 패배 = 적을 다 잡기 전에 격침. 굴림이 승률 밖이면 실제 생존 시간을 격파 시간보다 짧게 본다.
    // roll∈[chance,1) → 생존 = killSec × (1-roll)/(1-chance) (<killSec). 승산 0이면 계산 생존 시간 그대로.
    // 이렇게 하면 「격파 n/n 인데 파괴」는 나오지 않는다(감사 R4).
    let alive = odds.liveSec;
    if (odds.chance > 0) {
      const f = Math.max(0, Math.min(0.999, (1 - roll) / Math.max(1e-6, 1 - odds.chance)));
      alive = Math.min(odds.liveSec, odds.killSec * f);
    }
    noteEngageSec(world, alive);
    let left = odds.playerDps * alive;
    for (let i = 0; i < odds.ehpShips.length; i += 1) {
      if (killed >= odds.ehpShips.length - 1) break;
      if (left < odds.ehpShips[i]) break;
      left -= odds.ehpShips[i];
      killed += 1;
      exp += odds.expShips[i];
    }
  }
  return {
    win,
    chance: odds.chance,
    exp,
    killed,
    fleet: odds.fleet,
  };
}

/** 등급의 기본함 또는 대체함. 웨이브 시험함은 제외. */
export function chooseHullShipId(tierKey: string, tick: number): string {
  let canonical = '';
  let alternate = '';
  for (let i = 0; i < CapitalShipTradeListingPolicy_FROM_BALANCE_CSV.length; i += 1) {
    const row = CapitalShipTradeListingPolicy_FROM_BALANCE_CSV[i];
    if (row.hullTierKey !== tierKey) continue;
    if (isWaveTestTradeShipId(row.canonicalNpcShipId)) continue;
    if (!canonical) canonical = row.canonicalNpcShipId;
    if (row.alternateNpcShipId && !alternate) alternate = row.alternateNpcShipId;
  }
  if (alternate && (tick & 1) === 1) return alternate;
  return canonical || STARTER_HULL_SHIP_ID;
}

/** A-9a: 등급의 기본함·대체함 중 지금 전투력이 큰 쪽. 홀짝 틱으로 약한 대체함을 사지 않게 한다. */
export function strongerHullShipId(world: WorldState, tierKey: string): string {
  const a = chooseHullShipId(tierKey, 0);
  const b = chooseHullShipId(tierKey, 1);
  if (a === b) return a;
  return playerCombatPower(world, { hullShipId: b }) > playerCombatPower(world, { hullShipId: a }) ? b : a;
}

/** 성계를 넘는 1홉 연료. 최소값은 정책 min. */
export function hopFuelCredits(
  fromSystemId: string,
  toSystemId: string,
  hullTierKey: string,
  routeHopCount: number,
): number {
  const from = STAR_SYSTEMS_FROM_CSV[fromSystemId as keyof typeof STAR_SYSTEMS_FROM_CSV];
  const to = STAR_SYSTEMS_FROM_CSV[toSystemId as keyof typeof STAR_SYSTEMS_FROM_CSV];
  let distanceMul = 1;
  if (from && to) {
    const dist = Math.hypot(from.position.x - to.position.x, from.position.y - to.position.y);
    const ratio = Math.max(0.01, dist / FUEL.refDist);
    distanceMul = clamp(Math.pow(ratio, FUEL.distExp), FUEL.distMin, FUEL.distMax);
  }
  const hullMul = hullFuelMul.get(hullTierKey) ?? 1;
  let cost = Math.round(FUEL.base * distanceMul * hullMul);
  if (routeHopCount > FUEL.routeRef) {
    cost = Math.round(cost * Math.pow(routeHopCount / FUEL.routeRef, FUEL.routeExp));
  }
  return Math.max(FUEL.min, cost);
}

let questProgressKey = '';
let questProgressCache: Record<string, MissionProgress> | undefined;

function activeQuestProgress(world: WorldState): Record<string, MissionProgress> | undefined {
  const quest = world.activeQuest;
  if (!quest) return undefined;
  const key = `${quest.missionId}:${quest.objIndex}`;
  if (key === questProgressKey && questProgressCache) return questProgressCache;
  const mission = getMission(quest.missionId);
  if (!mission) return undefined;
  const objectives: Record<string, boolean> = {};
  const objs = mission.objectives ?? [];
  for (let i = 0; i < objs.length; i += 1) {
    const id = objs[i]?.id;
    if (id) objectives[id] = i < quest.objIndex;
  }
  questProgressKey = key;
  questProgressCache = {
    [quest.missionId]: {
      missionId: quest.missionId,
      status: 'active',
      objectives,
    },
  };
  return questProgressCache;
}

export function transitEncounterChance(world: WorldState, destSystemId: string): number {
  const sys = STAR_SYSTEMS_FROM_CSV[destSystemId as keyof typeof STAR_SYSTEMS_FROM_CSV];
  const zone = sys?.zone ?? 'safe';
  const mission = world.activeQuest ? getMission(world.activeQuest.missionId) : null;
  let combatMission = false;
  if (mission) {
    const objs = mission.objectives ?? [];
    for (let i = 0; i < objs.length; i += 1) {
      if (objs[i]?.type === 'defeat_enemy') {
        combatMission = true;
        break;
      }
    }
  }
  return resolveTransitEncounterChance(
    zone,
    combatMission,
    activeQuestProgress(world),
    world.activeQuest?.missionId ?? null,
    destSystemId,
  );
}
