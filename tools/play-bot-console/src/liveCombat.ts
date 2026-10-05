/**
 * 플레이봇 전투·연료 — 게임 표를 행동 시점에 읽는다. Skia 전투 엔진은 돌리지 않는다.
 * 궤도·웨이브 크레딧은 0. 템플릿 creditReward 는 이동중 조우만.
 * 승패는 선체 유효HP와 무기 DPS. 16% 승률 바닥은 없다.
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
import { resolveProficiencyMultiplier } from '../../../src/combat/pilotProficiency';
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
const hullFuelMul = new Map<string, number>();

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
  for (let pattern = 0; pattern < 3; pattern += 1) {
    const load = resolveHostileEnemyWeaponLoadout(pattern, tcl);
    sum += gunDps(load.laserWeaponId) + gunDps(load.missileWeaponId);
  }
  enemyGunDps[tcl] = sum / 3;
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

function playerBody(world: WorldState): ShipBody {
  const id = world.hullShipId || STARTER_HULL_SHIP_ID;
  return shipById.get(id) ?? shipById.get(STARTER_HULL_SHIP_ID) ?? {
    id: STARTER_HULL_SHIP_ID,
    ehp: 770,
    armor: 16,
    exp: 130,
    diceDps: 12,
  };
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

function playerGunDps(world: WorldState): number {
  const slots = hullGunSlots(world.hullShipId || STARTER_HULL_SHIP_ID);
  const used = new Set<string>();
  let sum = 0;
  for (let i = 0; i < slots.length; i += 1) {
    const slot = slots[i];
    const bought = world.equipped[slot.key];
    const id = bought ? weaponIdOf(bought) : slot.id;
    if (id) sum += gunDps(id);
    used.add(slot.key);
  }
  const keys = Object.keys(world.equipped);
  for (let i = 0; i < keys.length; i += 1) {
    if (used.has(keys[i])) continue;
    const id = world.equipped[keys[i]];
    if (id) sum += gunDps(weaponIdOf(id));
  }
  return sum;
}

type FleetSnap = {
  ehpEach: number;
  ehpTotal: number;
  dps: number;
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
  const gun = enemyGunDps[Math.max(1, Math.min(80, tcl | 0))] || 0;
  let ehpTotal = 0;
  let dps = 0;
  const expShips: number[] = [];
  const ehpShips: number[] = [];
  for (let i = 0; i < bodies.length; i += 1) {
    const body = bodies[i];
    ehpTotal += body.ehp;
    ehpShips.push(body.ehp);
    expShips.push(body.exp);
    dps += body.diceDps + gun;
  }
  const snap: FleetSnap = {
    ehpEach: ehpTotal / Math.max(1, bodies.length),
    ehpTotal,
    dps: Math.max(0.05, dps),
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
};

/** 이길 수 없으면 0. 이긴 뒤의 확률에도 16% 바닥을 두지 않는다. 요구 함대 DPS 게이트는 쓰지 않는다. */
export function fightOdds(world: WorldState, planetId: string, tcl: number): FightOdds {
  const zone = zoneOf(planetId, tcl);
  const body = playerBody(world);
  const prof = resolveProficiencyMultiplier(world.level);
  const playerDps = (body.diceDps + playerGunDps(world)) * prof;
  const foe = fleetOf(planetId, tcl);
  const mit = clamp(body.armor / 100, 0, 0.5);
  const incoming = Math.max(0.05, foe.dps * (1 - mit));
  const killSec = foe.ehpTotal / Math.max(0.05, playerDps);
  const liveSec = body.ehp / incoming;
  let chance = 0;
  if (liveSec > killSec && playerDps > 0) {
    chance = Math.min(0.92, Math.max(0.02, 1 - killSec / liveSec));
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
  } else {
    let left = odds.playerDps * odds.liveSec;
    for (let i = 0; i < odds.ehpShips.length; i += 1) {
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
    if (row.canonicalNpcShipId.includes('wave') || row.canonicalNpcShipId === 'player_wave_ship') continue;
    if (!canonical) canonical = row.canonicalNpcShipId;
    if (row.alternateNpcShipId && !alternate) alternate = row.alternateNpcShipId;
  }
  if (alternate && (tick & 1) === 1) return alternate;
  return canonical || STARTER_HULL_SHIP_ID;
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
