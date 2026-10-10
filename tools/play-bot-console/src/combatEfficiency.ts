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
import { noteObs, obsDetail } from './observeVocab';
import { CapitalHullPurchasePolicy_FROM_BALANCE_CSV } from '../../../src/data/balance/generated/csvCapitalHullPurchasePolicy';
import { MiningSellPricePolicy_FROM_BALANCE_CSV } from '../../../src/data/balance/generated/csvMiningSellPricePolicy';
import { PlayScenarioZonePlanets_FROM_BALANCE_CSV } from '../../../src/data/balance/generated/csvPlayScenarioZonePlanets';
import { ENEMY_TEMPLATES_FROM_CSV } from '../../../src/data/generated/csvEnemyTemplates';
import type { WorldState } from './types';
import { hopsBetween, lookupHasShipyard, lookupHasTrade, lookupSystemId } from './catalog';
import { playerCombatPower, playerCombatSig, STARTER_HULL_SHIP_ID, strongerHullShipId } from './liveCombat';
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

// 구매 사다리 — capital_hull_purchase_policy.csv ladderListed·ladderStep 순(실기 무역소 진열과 같은 기준 · 2026-10-10)
const HULLS: HullStep[] = [];
const ladderRows = CapitalHullPurchasePolicy_FROM_BALANCE_CSV
  .filter((row) => String(row.ladderListed ?? '').trim().toUpperCase() === 'TRUE' && String(row.ladderStep ?? '').trim() !== '')
  .slice()
  .sort((a, b) => Number(a.ladderStep) - Number(b.ladderStep));
for (let i = 0; i < ladderRows.length; i += 1) {
  const row = ladderRows[i];
  HULLS.push({
    key: row.hullTierKey,
    name: row.labelKo,
    rank: HULLS.length,
    levelReq: Number(row.requiredPilotLevelMin) || 1,
    price: Math.max(0, Number(row.purchaseCredits) || 0),
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

/**
 * A-9a: 함선 가치 하한. 지금 함선 대비 전투력(playerCombatPower) 상승이 이 비율 미만인 등급은 목표로 삼지 않는다.
 * 근거: 현 CSV에서 frigate_upgraded(Player_frigate_mk2)는 시작 함선의 약 0.58배, destroyer~battlecruiser_max 는 0.9~1.1배
 * (감사 R2 · PB-G5 보류). 약한 함선을 사서 잃기를 반복(10-06 하네스 66회)하던 원인.
 */
export const HULL_MIN_POWER_GAIN = 0.25;

let hullKey = '';
let hullPick: HullStep | null = null;
let hullPickGain = 0;
let hullPickWorth = false;

function hullStepGain(world: WorldState, step: HullStep, base: number): number {
  return playerCombatPower(world, { hullShipId: strongerHullShipId(world, step.key) }) / base - 1;
}

/**
 * 목표 함선:
 * 1) 레벨이 열린 상위 등급 중 전투력 상승 ≥ HULL_MIN_POWER_GAIN 인 가장 낮은 등급 → 구매 목표.
 * 2) 없으면 바로 위 등급(예전과 같은 한 단계) → 자금 목표만. 사지는 않는다.
 *    자금 목표는 교역로 자금 루프(earnForShip)를 그대로 돌리기 위함 — 없애면 개발비로 잔액을 소진하고
 *    빈곤 루프(아르카디아↔베가 왕복 매도)에 빠져 레벨이 후퇴했다(시드 3·4 L17/18, 리포트 §4).
 */
function refreshHullTarget(world: WorldState): void {
  const key = `${playerCombatSig(world)}|${world.hullRank ?? 0}`;
  if (key === hullKey) return;
  hullKey = key;
  hullPick = null;
  hullPickGain = 0;
  hullPickWorth = false;
  const rank = world.hullRank ?? 0;
  const base = Math.max(1e-6, playerCombatPower(world));
  for (let i = 0; i < HULLS.length; i += 1) {
    const step = HULLS[i];
    if (step.rank <= rank || step.price <= 0 || world.level < step.levelReq) continue;
    const gain = hullStepGain(world, step, base);
    if (gain < HULL_MIN_POWER_GAIN) continue;
    hullPick = step;
    hullPickGain = gain;
    hullPickWorth = true;
    return;
  }
  for (let i = 0; i < HULLS.length; i += 1) {
    if (HULLS[i].rank !== rank + 1) continue;
    hullPick = HULLS[i];
    hullPickGain = hullStepGain(world, HULLS[i], base);
    return;
  }
}

/** 다음 함선(구매 목표 또는 한 단계 위 자금 목표). 없으면 null. */
export function nextHullStep(world: WorldState): HullStep | null {
  refreshHullTarget(world);
  return hullPick;
}

/** 다음 함선이 살 가치(전투력 상승 ≥ 하한)가 있는가. */
export function nextHullWorthBuying(world: WorldState): boolean {
  refreshHullTarget(world);
  return hullPickWorth;
}

/** 구매 목표 함선의 전투력 상승÷가격. 자금 목표뿐이거나 레벨이 안 되면 0. */
export function hullValuePerCredit(world: WorldState): number {
  const next = nextHullStep(world);
  if (!next || !hullPickWorth || next.price <= 0 || world.level < next.levelReq) return 0;
  return hullPickGain / next.price;
}

/** 지금 탄 함선의 실기 구매가. 기본 프리깃은 0. */
export function currentHullValue(world: WorldState): number {
  const rank = world.hullRank ?? 0;
  if (rank <= 0) return 0;
  for (let i = 0; i < HULLS.length; i += 1) {
    if (HULLS[i].rank === rank) return HULLS[i].price;
  }
  return 0;
}

/** 레벨은 열렸는데 실기 가격이 부족하면 그 차액. 아니면 0. */
/**
 * 다음 함선 자금은 구매 가능 레벨 이만큼 전부터 모은다(사람도 몇 레벨 앞서 저축).
 * 2026-10-10 사다리(첫 구매 L16) 이후, 레벨이 열린 뒤에만 모으면 L7~15 동안 교역로 돈벌이가 꺼져
 * 연료·장비 자금이 바닥나고 정체됐다(벤치 L32→24 · 정체 28). 트윈 행동 상수.
 */
const HULL_FUND_LEAD_LEVELS = 8;

export function hullFundGap(world: WorldState): number {
  const next = nextHullStep(world);
  if (!next || next.price <= 0) return 0;
  if (world.level < next.levelReq - HULL_FUND_LEAD_LEVELS) return 0;
  return Math.max(0, next.price + 800 - world.credits);
}

export function needsHullFund(world: WorldState): boolean {
  return hullFundGap(world) > 0;
}

/** 정체 기록용 한 줄. 다음 함선 값이 잔액보다 멀고 승률 미달로 쉬는 퀘스트가 있으면 함선 자금 벽. */
export function progressWall(world: WorldState): string {
  const parked = world.parkedQuests.map((q) => q.missionId).join(',');
  const next = nextHullStep(world);
  const gap = hullFundGap(world);
  if (next && gap > 0) {
    return `hull_fund ${next.key} ${next.price}cr 부족 ${gap} · 보유 ${world.credits} · 대기 ${parked || '-'}`;
  }
  if (next && next.price > 0 && world.level < next.levelReq) {
    return `hull_level ${next.key} Lv${next.levelReq} · 현재 Lv${world.level} · 대기 ${parked || '-'}`;
  }
  return parked ? `parked ${parked}` : '';
}

/** 기함 파괴 후 무료 재탑승은 기본 프리깃만. */
export function revertFlagshipToStarter(world: WorldState): boolean {
  if ((world.hullRank ?? 0) <= 0) return false;
  world.hullRank = 0;
  world.hullTierKey = 'frigate_default';
  world.hullName = '프리깃(기본 지급)';
  world.hullShipId = STARTER_HULL_SHIP_ID;
  // 함선별 광물 강화 — 잃은 함선의 강화는 사라진다(넘겨주지 않음)
  world.hullUpgrades = undefined;
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
  if (!nextHullWorthBuying(world)) return null;
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
  // A-9a: 지금 함선보다 전투력이 충분히 오르지 않는 함선은 사지 않는다(약한 함선을 사서 잃는 반복 차단).
  if (!nextHullWorthBuying(world)) return null;
  if (world.level < next.levelReq) return null;
  if (world.credits < next.price + 800) return null;
  if (!lookupHasTrade(world.currentPlanetId) || !lookupHasShipyard(world.currentPlanetId)) return null;
  const shipId = strongerHullShipId(world, next.key);
  world.credits -= next.price;
  world.hullRank = next.rank;
  world.hullTierKey = next.key;
  world.hullName = next.name;
  world.hullShipId = shipId;
  // 새 함선은 광물 강화 0부터(함선별 · 넘겨주지 않음)
  world.hullUpgrades = undefined;
  world.hullJustBought = true;
  noteObs(world, 'ship', obsDetail.ship(shipId));
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
