/**
 * 플레이봇 전투효율 — Node 트윈 전용.
 * 함선 목표는 실기 CSV purchaseCredits 그대로다. 할인하지 않는다.
 * 부족분은 퀘스트 보상·이동중 조우 보상·광물 매도가로 모은다. 궤도 전투 크레딧은 0.
 * 기억은 가상일 경계에서만 디스크에 쓴다.
 *
 * [pss-pre-dev] hot_path=행동 1회 목표 조회 alloc=표는 모듈 1회 cache=적 보상·광물가
 * [pss-pre-dev] stage=Node 트윈 · 앱 STAGE/Skia 무관 risk=P6 가상일 JSON 1건
 * [pss-pre-dev] verdict=PASS
 */
import fs from 'node:fs';
import path from 'node:path';
import { CapitalHullPurchasePolicy_FROM_BALANCE_CSV } from '../../../src/data/balance/generated/csvCapitalHullPurchasePolicy';
import { MiningSellPricePolicy_FROM_BALANCE_CSV } from '../../../src/data/balance/generated/csvMiningSellPricePolicy';
import { PlayScenarioZonePlanets_FROM_BALANCE_CSV } from '../../../src/data/balance/generated/csvPlayScenarioZonePlanets';
import { ENEMY_TEMPLATES_FROM_CSV } from '../../../src/data/generated/csvEnemyTemplates';
import type { WorldState } from './types';
import { hopsBetween, lookupHasShipyard, lookupHasTrade, lookupSystemId } from './catalog';
import { chooseHullShipId, STARTER_HULL_SHIP_ID } from './liveCombat';
import { atomicWriteFile } from './learnedIo';
import { learnedDir } from './policy';

type HullStep = {
  key: string;
  name: string;
  rank: number;
  levelReq: number;
  price: number;
};

type EffBand = {
  hull: string;
  fights: number;
  wins: number;
  exp: number;
  credits: number;
};

const HULLS: HullStep[] = [];
for (let i = 0; i < CapitalHullPurchasePolicy_FROM_BALANCE_CSV.length; i += 1) {
  const row = CapitalHullPurchasePolicy_FROM_BALANCE_CSV[i];
  const csvPrice = Number(row.purchaseCredits) || 0;
  if (row.hullTierKey.includes('_wave')) continue;
    if (csvPrice <= 0 && row.hullTierKey !== 'frigate_default') continue;
  const price = csvPrice > 0 ? csvPrice : 0;
  HULLS.push({
    key: row.hullTierKey,
    name: row.labelKo,
    rank: HULLS.length,
    levelReq: Number(row.requiredPilotLevelMin) || 1,
    price,
  });
}

const bands: EffBand[] = [];
let lastF = 0;
let lastW = 0;
let lastE = 0;
let lastC = 0;
let enabled = false;
let loaded = false;

const COMBAT_PAY = Object.values(ENEMY_TEMPLATES_FROM_CSV)
  .map((row) => ({ level: row.level, credits: row.creditReward }))
  .sort((a, b) => a.level - b.level);

const ZONE_BY_PLANET = new Map<string, number>();
for (let i = 0; i < PlayScenarioZonePlanets_FROM_BALANCE_CSV.length; i += 1) {
  const row = PlayScenarioZonePlanets_FROM_BALANCE_CSV[i];
  ZONE_BY_PLANET.set(row.primaryPlanetId, Number(row.zoneIndex) || 1);
}

const ORE_LADDER = [
  'ore_ferrite',
  'ore_silicate',
  'ore_carbon',
  'ore_nickel',
  'ore_titanium',
  'ore_crystal',
  'ore_platinum',
  'ore_orichalcum',
  'ore_neutronium',
  'ore_voidstone',
];
const ORE_SELL = new Map<string, number>();
for (let i = 0; i < MiningSellPricePolicy_FROM_BALANCE_CSV.length; i += 1) {
  const row = MiningSellPricePolicy_FROM_BALANCE_CSV[i];
  const price = Number(row.sellPriceCredits) || 0;
  if (price > 0 && !ORE_SELL.has(row.mineralId)) ORE_SELL.set(row.mineralId, price);
}

/** 실기 적 템플릿 creditReward. tcl 이하에서 가장 높은 등급. */
export function liveCombatCredit(tcl: number): number {
  let pay = COMBAT_PAY.length > 0 ? COMBAT_PAY[0].credits : 300;
  for (let i = 0; i < COMBAT_PAY.length; i += 1) {
    if (tcl >= COMBAT_PAY[i].level) pay = COMBAT_PAY[i].credits;
  }
  return pay;
}

/** 실기 광물 매도가. 구역이 올라가면 더 비싼 광. */
export function liveMineralUnitPrice(planetId: string, level: number): number {
  const zone = ZONE_BY_PLANET.get(planetId) ?? Math.max(1, Math.min(21, Math.ceil(level / 3)));
  const ore = ORE_LADDER[Math.min(ORE_LADDER.length - 1, Math.floor((zone - 1) / 2))];
  return ORE_SELL.get(ore) ?? 10;
}

export function nextHullStep(world: WorldState): HullStep | null {
  const rank = world.hullRank ?? 0;
  for (let i = 0; i < HULLS.length; i += 1) {
    if (HULLS[i].rank === rank + 1) return HULLS[i];
  }
  return null;
}

/** 레벨은 열렸는데 실기 가격이 부족하면 그 차액. 아니면 0. */
export function hullFundGap(world: WorldState): number {
  const next = nextHullStep(world);
  if (!next || next.price <= 0) return 0;
  if (world.level < next.levelReq) return 0;
  return Math.max(0, next.price + 800 - world.credits);
}

export function needsHullFund(world: WorldState): boolean {
  return hullFundGap(world) > 0;
}

/** 기함 파괴 후 무료 재탑승은 기본 프리깃만. */
export function revertFlagshipToStarter(world: WorldState): boolean {
  if ((world.hullRank ?? 0) <= 0) return false;
  world.hullRank = 0;
  world.hullTierKey = 'frigate_default';
  world.hullName = '프리깃(기본 지급)';
  world.hullShipId = STARTER_HULL_SHIP_ID;
  return true;
}

/** 다음 함선 값을 모으는 동안 장비 구매가 잔액을 비우지 않게 한다. */
export function gearCreditReserve(world: WorldState): number {
  const next = nextHullStep(world);
  if (!next || next.price <= 0) return 800;
  if (world.level < next.levelReq) return 800;
  if (world.credits >= next.price + 800) return 800;
  return Math.max(800, next.price);
}

/** 값을 치를 수 있는데 무역소+조선소가 아니면 그 행성 id. 없으면 null. */
export function hullMarketPlanet(world: WorldState): string | null {
  const next = nextHullStep(world);
  if (!next || next.price <= 0) return null;
  if (world.level < next.levelReq) return null;
  if (world.credits < next.price + 800) return null;
  if (lookupHasTrade(world.currentPlanetId) && lookupHasShipyard(world.currentPlanetId)) return null;
  const ids = Object.keys(world.planets);
  const from = lookupSystemId(world.currentPlanetId) ?? world.currentSystemId;
  let best: string | null = null;
  let bestH = 1e9;
  for (let i = 0; i < ids.length; i += 1) {
    const id = ids[i];
    if (!lookupHasTrade(id) || !lookupHasShipyard(id)) continue;
    const sys = lookupSystemId(id);
    const h = sys ? hopsBetween(from, sys) : 99;
    if (h < bestH) {
      bestH = h;
      best = id;
    }
  }
  return best;
}

export function tryBuyNextHull(world: WorldState): string | null {
  const next = nextHullStep(world);
  if (!next || next.price <= 0) return null;
  if (world.level < next.levelReq) return null;
  if (world.credits < next.price + 800) return null;
  if (!lookupHasTrade(world.currentPlanetId) || !lookupHasShipyard(world.currentPlanetId)) return null;
  const shipId = chooseHullShipId(next.key, world.tick);
  world.credits -= next.price;
  world.hullRank = next.rank;
  world.hullTierKey = next.key;
  world.hullName = next.name;
  world.hullShipId = shipId;
  world.hullJustBought = true;
  world.gearBuys += 1;
  return `함선 ${next.name} [${next.key}] ${shipId} -${next.price}cr (잔 ${world.credits})`;
}

export function noteCombat(world: WorldState, win: boolean, exp: number, credits: number): void {
  world.effFights = (world.effFights ?? 0) + 1;
  if (win) world.effWins = (world.effWins ?? 0) + 1;
  world.effExp = (world.effExp ?? 0) + exp;
  world.effCredits = (world.effCredits ?? 0) + credits;
}

export function enableCombatEfficiencyMemory(): void {
  enabled = true;
  if (loaded) return;
  loaded = true;
  const file = path.join(learnedDir(), 'combat-efficiency.json');
  try {
    if (!fs.existsSync(file)) return;
    const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as { bands?: EffBand[] };
    const src = raw.bands ?? [];
    bands.length = 0;
    for (let i = 0; i < src.length && bands.length < 12; i += 1) {
      const b = src[i];
      if (!b || typeof b.hull !== 'string') continue;
      bands.push({
        hull: b.hull,
        fights: b.fights | 0,
        wins: b.wins | 0,
        exp: b.exp | 0,
        credits: b.credits | 0,
      });
    }
  } catch {
    bands.length = 0;
  }
}

/** 하니스 가상일 경계에서만 호출. 10일마다 또는 함선 구매 직후 1회 기록. */
export function rememberCombatDay(world: WorldState): void {
  if (!enabled) return;
  const fights = world.effFights;
  if (fights < lastF) {
    lastF = 0;
    lastW = 0;
    lastE = 0;
    lastC = 0;
  }
  const df = fights - lastF;
  const bought = world.hullJustBought;
  if (df <= 0 && !bought) return;
  const key = world.hullTierKey || 'frigate_default';
  let band: EffBand | null = null;
  for (let i = 0; i < bands.length; i += 1) {
    if (bands[i].hull === key) {
      band = bands[i];
      break;
    }
  }
  if (!band) {
    if (bands.length >= 12) bands.shift();
    band = { hull: key, fights: 0, wins: 0, exp: 0, credits: 0 };
    bands.push(band);
  }
  band.fights += df;
  band.wins += world.effWins - lastW;
  band.exp += world.effExp - lastE;
  band.credits += world.effCredits - lastC;
  lastF = fights;
  lastW = world.effWins;
  lastE = world.effExp;
  lastC = world.effCredits;
  world.hullJustBought = false;
  if (!bought && world.day % 10 !== 0) return;
  atomicWriteFile(
    path.join(learnedDir(), 'combat-efficiency.json'),
    JSON.stringify({ v: 1, hullPrice: 'csv', bands }),
  );
}
