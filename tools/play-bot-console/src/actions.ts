import {
  evaluateStelliumAnnexEligibility,
  hasStelliumAnnexFriendlyAdjacency,
} from '../../../src/arcCore/annex/stelliumAnnexEligibility';
import { resolvePlanetSalvageSearchPolicy } from '../../../src/game/planetSalvageSearchPolicy';
import { resolvePlanetSalvageSearchOutcome } from '../../../src/game/planetSalvageSearch';
import { planetHasMineableOrbitalDeposits } from '../../../src/world/mineralDepositModel';
import { PlanetDefenseSatelliteLevelPolicy_FROM_BALANCE_CSV } from '../../../src/data/balance/generated/csvPlanetDefenseSatelliteLevelPolicy';
import { resolveStelliumAnnexPolicy } from '../../../src/arcCore/annex/stelliumAnnexPolicy';
import type { Rng } from './rng';
import type { ActiveQuest, JournalEntry, PersonaId, WorldState } from './types';
import { BLUE_CLAN, NEUTRAL_CLAN } from './types';
import { getPreferSell } from './policy';
import { combatRedirectPlace, observeBotCombat } from './cellLoop';
import {
  CORE_PLANET_SET,
  CRIMSON_CAPITAL_PLANET_ID,
  FOCUS_PLANET_ID,
  STORY_IDS,
  bfsNextSystem,
  getMission,
  hopsBetween,
  itemBasePrice,
  listPlayableMissionIds,
  lookupHasShipyard,
  lookupHasTrade,
  lookupPrimaryPlanet,
  lookupSystemId,
  nearestTradePlanet,
  discoveryHopPlanet,
  DISCOVERY_PLANET_PLACEHOLDER,
  isQuestPlaceholderToken,
  isResolvedQuestPlaceholder,
  missionHasUnresolvedPlaceholder,
  neighborHopPlanet,
  NEIGHBOR_SYSTEM_PLACEHOLDER,
  objectivePlanetId,
} from './catalog';
import { pickStepKind } from './intent';
import {
  approachCapitalPlanet,
  completeDueDevJob,
  markQuestPlanet,
  nearestFightablePlanet,
  nextPlayableMissionId,
  questFightPlanet,
  tryBuyBestGear,
  tryDevelopFocus,
  tryLearnSkill,
} from './progress';
import { addExp, addFlag, markMissionDone, moveTo, paintOf, toHolds } from './world';
import {
  hullFundGap,
  hullMarketPlanet,
  liveCombatCredit,
  liveMineralUnitPrice,
  needsHullFund,
  noteCombat,
  revertFlagshipToStarter,
  tryBuyNextHull,
} from './combatEfficiency';
import { fightOdds, hopFuelCredits, resolveFightPay, transitEncounterChance } from './liveCombat';
import { nudgeFocusStat, pickBalancedDev, cheapestOpenDevCost } from './facilityTwin';
import { currentPlayIntelligence } from './playIntelligence';
import { takeCreditExchange } from './bmWallet';
import { noteTgBought, pickTgPlan } from './tradeRun';
import { noteObs, obsDetail } from './observeVocab';

let hopRng: Rng = () => 0.999;

function useHopRng(rng: Rng): void {
  hopRng = rng;
}

const FRONT_TARGETS = [
  'sirius_border',
  'perseus_memorial',
  'omega_hub',
  'helios_core',
  'titan_ruins',
  'draco_haven',
] as const;

const SAT_COST = Number(
  PlanetDefenseSatelliteLevelPolicy_FROM_BALANCE_CSV.find((r) => Number(r.level) === 1)?.installCostCredits ?? 1000,
);
const TRADE_BUY = 420;
const TRADE_SELL = 310;
/** 기존 지급불능 선. 리뷰 주기도 이 값을 올리지 않는다. */
const CASH_FLOOR = 400;

function mineCap(): number {
  return currentPlayIntelligence().mineCap;
}

function fairLine(_world: WorldState): number {
  const card = currentPlayIntelligence();
  return card.fairFightEnabled ? card.fairFightMin : 0;
}
const COLONIZE_VAULT = 4000;

function ev(
  world: WorldState,
  kind: JournalEntry['kind'],
  line: string,
  extra?: { hold?: boolean; reason?: string; silent?: boolean },
): JournalEntry {
  const landRepeat = kind === 'LAND' && (line.endsWith('이미 착륙') || line === '....');
  if (!landRepeat) {
    world.alreadyLandKey = '';
    world.alreadyLandRepeat = 0;
  }
  return {
    t: Date.now(),
    day: world.day,
    tick: world.tick,
    kind,
    line,
    hold: extra?.hold,
    reason: extra?.reason,
    silent: extra?.silent,
  };
}

export function alreadyLanded(world: WorldState, destPlanetId: string): JournalEntry {
  if (world.alreadyLandKey === destPlanetId) {
    world.alreadyLandRepeat += 1;
    if (world.alreadyLandRepeat === 1) {
      return ev(world, 'LAND', '....');
    }
    return ev(world, 'LAND', '....', { silent: true });
  }
  world.alreadyLandKey = destPlanetId;
  world.alreadyLandRepeat = 0;
  return ev(world, 'LAND', `${destPlanetId} 이미 착륙`);
}

function markHold(world: WorldState, reason: string, line: string): JournalEntry {
  world.holdCount += 1;
  world.lastHoldReason = reason;
  world.lastHoldStreak += 1;
  world.stuckTicks += 1;
  addFlag(world, `hold:${reason}`);
  return ev(world, 'HOLD', line, { hold: true, reason });
}

function clearHoldStreak(world: WorldState): void {
  world.lastHoldStreak = 0;
  world.stuckTicks = 0;
  world.lastHoldReason = '';
}

const TRAVEL_COMMIT_TICKS = 12;

/** 다른 행동이 도착 전에 목적지를 바꾸면 두 곳 사이를 오가며 연료·기함만 잃는다. 도착 또는 기한 만료까지 첫 목적지를 지킨다. */
function committedDestination(world: WorldState, destPlanetId: string): string {
  const goal = world.travelGoal;
  const fresh = world.tick - (world.travelGoalTick ?? 0) <= TRAVEL_COMMIT_TICKS;
  if (goal && goal !== destPlanetId && goal !== world.currentPlanetId && fresh) return goal;
  if (goal !== destPlanetId || !fresh) {
    world.travelGoal = destPlanetId;
    world.travelGoalTick = world.tick;
  }
  return destPlanetId;
}

function travelOneHop(world: WorldState, wantedPlanetId: string, commit = true): JournalEntry {
  const destPlanetId = commit ? committedDestination(world, wantedPlanetId) : wantedPlanetId;
  if (isQuestPlaceholderToken(destPlanetId)) {
    return markHold(world, 'unresolved_placeholder', `${destPlanetId} 미해석 토큰`);
  }
  const destSys = lookupSystemId(destPlanetId);
  if (!destSys) return markHold(world, 'no_dest_system', `${destPlanetId} 성계를 모름`);
  if (world.currentPlanetId === destPlanetId) {
    return alreadyLanded(world, destPlanetId);
  }
  if (world.currentSystemId === destSys) {
    moveTo(world, destPlanetId);
    clearHoldStreak(world);
    return landLine(world, destPlanetId);
  }
  const next = bfsNextSystem(world.currentSystemId, destSys);
  if (!next) return markHold(world, 'no_route', `${world.currentSystemId}→${destSys} 항로 없음`);
  const hopPlanet = lookupPrimaryPlanet(next);
  if (!hopPlanet) return markHold(world, 'no_hop_planet', `${next} 행성 없음`);
  const routeHops = hopsBetween(world.currentSystemId, destSys);
  const fuel = hopFuelCredits(world.currentSystemId, next, world.hullTierKey || 'frigate_default', routeHops);
  if (world.credits < fuel) {
    world.travelGoal = '';
    return recoverBroke(world);
  }
  world.credits -= fuel;
  moveTo(world, hopPlanet);
  clearHoldStreak(world);
  const chance = transitEncounterChance(world, next);
  if (chance > 0 && hopRng() < chance) {
    const row = fightHere(world, hopRng, '조우');
    return ev(world, row.kind, `${hopPlanet} 이동중 조우 · 연료 -${fuel}cr · ${row.line}`);
  }
  const left = hopsBetween(world.currentSystemId, destSys);
  if (left === 0 || hopPlanet === destPlanetId) {
    const landed = landLine(world, hopPlanet);
    return ev(world, landed.kind, `${landed.line} · 연료 -${fuel}cr`);
  }
  return ev(world, 'TRAVEL', `${hopPlanet} 경유 → ${destPlanetId} (잔여 ${left}홉) · 연료 -${fuel}cr`);
}

function landLine(world: WorldState, planetId: string): JournalEntry {
  const restock = restockHangarIfYard(world);
  const extra = restock ? ` · 격납고 보충 ${world.hangarShips}/${world.hangarMax}` : '';
  if (world.obsLand !== planetId) {
    world.obsLand = planetId;
    noteObs(world, 'land', obsDetail.land(planetId));
  }
  return ev(world, 'LAND', `${planetId} 착륙${extra}`);
}

function restockHangarIfYard(world: WorldState): boolean {
  if (!lookupHasShipyard(world.currentPlanetId)) return false;
  if (world.hangarShips >= world.hangarMax) return false;
  world.hangarShips += 1;
  return true;
}

function nearestShipyardPlanet(world: WorldState): string {
  if (lookupHasShipyard(world.currentPlanetId)) return world.currentPlanetId;
  if (lookupHasShipyard(FOCUS_PLANET_ID)) return FOCUS_PLANET_ID;
  const ids = Object.keys(world.planets);
  for (let i = 0; i < ids.length; i += 1) {
    if (lookupHasShipyard(ids[i])) return ids[i];
  }
  return FOCUS_PLANET_ID;
}

function restockInsteadOfFight(world: WorldState): JournalEntry {
  const yard = nearestShipyardPlanet(world);
  if (world.currentPlanetId !== yard) return travelOneHop(world, yard);
  restockHangarIfYard(world);
  return ev(world, 'LAND', `${yard} 착륙 · 격납고 보충 ${world.hangarShips}/${world.hangarMax}`);
}

export function winChance(world: WorldState, tcl: number, planetId = world.currentPlanetId): number {
  return fightOdds(world, planetId, tcl).chance;
}

export function fightHere(world: WorldState, rng: Rng, reason: string): JournalEntry {
  useHopRng(rng);
  if (world.hangarShips <= 0) return restockInsteadOfFight(world);
  const slot = world.planets[world.currentPlanetId];
  if (!slot) return markHold(world, 'no_slot', '현재 행성 슬롯 없음');
  if ((reason === '수련' || reason === '유랑' || reason === '자금') && slot.tcl > world.level + 8) {
    const alt = nearestFightablePlanet(world);
    if (alt && alt !== world.currentPlanetId) return travelOneHop(world, alt);
  }
  const transit = reason === '조우';
  const questOrbit = reason === '퀘스트' || reason === '수련';
  if (!slot.combatEnabled && !questOrbit && !transit) {
    const alt = nearestFightablePlanet(world);
    if (alt && alt !== world.currentPlanetId) return travelOneHop(world, alt);
    return ev(world, 'TRAVEL', `${slot.labelKo} 점령전투 OFF → 전선 탐색`);
  }
  const p = paintOf(slot);
  const pay = resolveFightPay(world, world.currentPlanetId, slot.tcl, rng());
  const exp = pay.exp;
  const cr = pay.win && transit ? liveCombatCredit(slot.tcl) : 0;
  const leveled = addExp(world, exp);
  observeBotCombat(world.currentPlanetId, pay.win);
  noteObs(world, 'combat', obsDetail.combat(transit ? 'transit' : 'hub_orbit', pay.win ? 'win' : 'lose'));
  if (!pay.win) noteObs(world, 'destroy', obsDetail.destroy('combat'));
  if (pay.win) {
    world.combatWins += 1;
    world.credits += cr;
    let paintNote = '유지';
    if (p === 'RED') {
      slot.occupierClanId = NEUTRAL_CLAN;
      slot.kind = 'neutral';
      slot.neutralizedAt = world.nowMs;
      paintNote = '중립';
    }
    clearHoldStreak(world);
    void leveled;
    noteCombat(world, true, exp, cr);
    return ev(
      world,
      'COMBAT',
      `${slot.labelKo} ${reason} 승 tcl${slot.tcl} ${Math.round(pay.chance * 100)}% +${exp}exp +${cr}cr 격파 ${pay.killed}/${pay.fleet} → ${paintNote}`,
    );
  }
  world.combatLosses += 1;
  world.shipDestroys += 1;
  if (world.hangarShips > 0) world.hangarShips -= 1;
  world.reboards += 1;
  const lostHull = revertFlagshipToStarter(world);
  noteCombat(world, false, exp, 0);
  const hullNote = lostHull ? ' · 기본 프리깃으로 재탑승' : '';
  return ev(
    world,
    'DESTROY',
    `${slot.labelKo} ${reason} 전함 파괴 tcl${slot.tcl} +${exp}exp 격파 ${pay.killed}/${pay.fleet} → 격납고 재탑승 (잔 ${world.hangarShips}/${world.hangarMax} · 재탑승 ${world.reboards})${hullNote}`,
  );
}

/** 승률 0.5 이상인 전투 행성. 없으면 null. */
export function fairFightPlanet(world: WorldState): string | null {
  const ids = Object.keys(world.planets);
  let best: string | null = null;
  let bestHops = 1e9;
  for (let i = 0; i < ids.length; i += 1) {
    const slot = world.planets[ids[i]];
    if (!slot?.combatEnabled) continue;
    if (winChance(world, slot.tcl, slot.planetId) < fairLine(world)) continue;
    const hops = slot.planetId === world.currentPlanetId ? 0 : hopsBetween(world.currentPlanetId, slot.planetId);
    if (hops < bestHops) {
      bestHops = hops;
      best = slot.planetId;
    }
  }
  return best;
}

let trainKey = '';
let trainPick: string | null = null;

/** 공정선 이상 전장 중 승률×경험치 기대값이 가장 큰 행성. 조선소면 패배 뒤 보충이 제자리라 가산. */
function bestTrainPlanet(world: WorldState): string | null {
  const key = `${world.runId}|${world.level}|${world.hullTierKey}|${world.gearBuys}|${world.learnedSkills.length}`;
  if (key === trainKey) return trainPick;
  trainKey = key;
  trainPick = null;
  let best = 0;
  const ids = Object.keys(world.planets);
  for (let i = 0; i < ids.length; i += 1) {
    const slot = world.planets[ids[i]];
    if (!slot?.combatEnabled) continue;
    if (slot.tcl > world.level + 8) continue;
    const odds = fightOdds(world, slot.planetId, slot.tcl);
    if (odds.chance < fairLine(world)) continue;
    let exp = 0;
    for (let j = 0; j < odds.expShips.length; j += 1) exp += odds.expShips[j];
    const score = odds.chance * exp * (lookupHasShipyard(slot.planetId) ? 1.1 : 1);
    if (score > best) {
      best = score;
      trainPick = slot.planetId;
    }
  }
  return trainPick;
}

/** 수련·유랑은 승률 공정선 미만이면 굴리지 않는다. 기대 경험치가 가장 큰 공정 전장으로 가거나 번다. */
export function trainOrRelocate(world: WorldState, rng: Rng, reason: string): JournalEntry {
  useHopRng(rng);
  const card = currentPlayIntelligence();
  if (!card.fairFightEnabled) return fightHere(world, rng, reason);
  const pick = bestTrainPlanet(world);
  if (pick && pick !== world.currentPlanetId && canPayHop(world, pick)) return travelOneHop(world, pick);
  const slot = world.planets[world.currentPlanetId];
  if (slot && winChance(world, slot.tcl) >= fairLine(world)) return fightHere(world, rng, reason);
  const fair = fairFightPlanet(world);
  if (fair && fair !== world.currentPlanetId) return travelOneHop(world, fair);
  return mineOrSell(world);
}

function nextHopFuel(world: WorldState, destPlanetId: string): number | null {
  const destSys = lookupSystemId(destPlanetId);
  if (!destSys) return null;
  if (world.currentSystemId === destSys) return 0;
  const next = bfsNextSystem(world.currentSystemId, destSys);
  if (!next) return null;
  const routeHops = hopsBetween(world.currentSystemId, destSys);
  return hopFuelCredits(world.currentSystemId, next, world.hullTierKey || 'frigate_default', routeHops);
}

function canPayHop(world: WorldState, destPlanetId: string): boolean {
  const fuel = nextHopFuel(world, destPlanetId);
  return fuel != null && world.credits >= fuel;
}

/** 채굴이 안 되는 행성에서 잔해 수색 1회. 시세 크레딧은 그대로 더한다. */
function salvageOnce(world: WorldState): JournalEntry {
  if (world.salvageDay !== world.day) {
    world.salvageDay = world.day;
    world.salvageCount = 0;
  }
  const cap = resolvePlanetSalvageSearchPolicy().dailySearchCap;
  if (world.salvageCount >= cap) {
    return markHold(world, 'fuel_stuck', `${world.currentPlanetId} 수색 한도 · 채굴 불가 · 연료 부족`);
  }
  const attempt = world.salvageCount;
  world.salvageCount += 1;
  const outcome = resolvePlanetSalvageSearchOutcome(
    world.currentPlanetId,
    `wreck:${world.currentPlanetId}`,
    attempt,
    String(world.day),
  );
  if (outcome.kind === 'cash') {
    world.credits += outcome.credits;
    clearHoldStreak(world);
    return ev(world, 'SEARCH', `잔해 수색 +${outcome.credits}cr · 잔 ${world.credits}`);
  }
  if (outcome.kind === 'item' && (world.mineralCargo ?? 0) < mineCap()) {
    world.mineralCargo = (world.mineralCargo ?? 0) + 1;
    clearHoldStreak(world);
    return ev(world, 'SEARCH', `잔해 수색 광물 적재 ${world.mineralCargo}/${mineCap()}`);
  }
  clearHoldStreak(world);
  return ev(world, 'SEARCH', `잔해 수색 ${outcome.kind}`);
}

/**
 * 연료가 부족하면 그 자리에서 번다.
 * 소행성이 있으면 채굴·매도. 채굴이 불가하면 수색.
 */
function recoverBroke(world: WorldState): JournalEntry {
  const here = world.currentPlanetId;
  if (planetHasMineableOrbitalDeposits(here)) {
    const cargo = world.mineralCargo ?? 0;
    if (cargo > 0 && lookupHasTrade(here)) return sellCargo(world);
    if (cargo >= mineCap()) {
      const hub = nearestTradePlanet(here);
      if (hub && hub !== here && canPayHop(world, hub)) return travelOneHop(world, hub, false);
      return salvageOnce(world);
    }
    return mineOnce(world);
  }
  if ((world.mineralCargo ?? 0) > 0 && lookupHasTrade(here)) return sellCargo(world);
  return salvageOnce(world);
}

function mineOnce(world: WorldState): JournalEntry {
  const cargo = world.mineralCargo ?? 0;
  const cap = mineCap();
  if (cargo >= cap) return sellCargo(world);
  world.mineralCargo = cargo + 1;
  noteObs(world, 'mine', obsDetail.mine(world.currentPlanetId, 'ore'));
  return ev(world, 'MINE', `궤도 채굴 1 · 적재 ${world.mineralCargo}/${cap}`);
}

/** 채굴 광물은 실기 광물 매도가로 판다. */
function sellCargo(world: WorldState): JournalEntry {
  return sellCargoAt(world, liveMineralUnitPrice(world.currentPlanetId, world.level));
}

function sellCargoAt(world: WorldState, unit: number): JournalEntry {
  if ((world.mineralCargo ?? 0) <= 0) return mineOnce(world);
  if (!lookupHasTrade(world.currentPlanetId)) {
    // 퀘스트 이동 중 매도하러 기수를 돌리면 두 목적지를 매 틱 오가며 도착하지 못한다.
    if (world.activeQuest) return ev(world, 'MINE', `적재 ${world.mineralCargo}/${mineCap()} · 퀘스트 경로 유지 · 무역소에서 매도`);
    const hub = nearestTradePlanet(world.currentPlanetId);
    if (hub && hub !== world.currentPlanetId) return travelOneHop(world, hub);
  }
  world.mineralCargo -= 1;
  world.credits += unit;
  world.trades += 1;
  noteObs(world, 'trade', obsDetail.trade('sell', world.currentPlanetId));
  clearHoldStreak(world);
  return ev(world, 'TRADE', `채굴 매도 +${unit}cr · 잔 ${world.credits} · 적재 ${world.mineralCargo}`);
}

/** 함선 자금 — 실기 광물 매도가. */
function mineOrSellFund(world: WorldState): JournalEntry {
  if ((world.mineralCargo ?? 0) >= mineCap()) {
    return sellCargoAt(world, liveMineralUnitPrice(world.currentPlanetId, world.level));
  }
  return mineOnce(world);
}

/**
 * tg_* 교역로 한 걸음. 실은 화물이 있으면 수요지로, 없으면 홉당 순익이 채굴보다 나은 교역로를 고른다.
 * 할 일이 없으면 null.
 */
function tgRunStep(world: WorldState, minProfit = 0): JournalEntry | null {
  let run = world.tgRun;
  if (!run) {
    const plan = pickTgPlan(world, CASH_FLOOR * 2);
    if (!plan || plan.profit < minProfit) return null;
    if (plan.profit / plan.hops < liveMineralUnitPrice(world.currentPlanetId, world.level) * 2) return null;
    const r = plan.route;
    run = { goodId: r.goodId, supply: r.supply, demand: r.demand, qty: 0, costUnit: r.costUnit, sellNetUnit: r.netUnit + r.costUnit };
    world.tgRun = run;
  }
  if (run.qty === 0) {
    if (world.currentPlanetId !== run.supply) return travelOneHop(world, run.supply);
    const plan = pickTgPlan(world, CASH_FLOOR * 2);
    const qty = plan && plan.route.goodId === run.goodId && plan.route.supply === run.supply ? plan.qty : 0;
    if (qty <= 0) {
      world.tgRun = undefined;
      return null;
    }
    world.credits -= qty * run.costUnit;
    run.qty = qty;
    noteTgBought(world, plan!.route, qty);
    world.trades += 1;
    noteObs(world, 'trade', obsDetail.trade('buy', world.currentPlanetId));
    clearHoldStreak(world);
    return ev(world, 'TRADE', `교역 매입 ${run.goodId} ×${qty} -${qty * run.costUnit}cr → ${run.demand} (잔 ${world.credits})`);
  }
  if (world.currentPlanetId !== run.demand) return travelOneHop(world, run.demand);
  const gain = run.qty * run.sellNetUnit;
  world.credits += gain;
  world.trades += 1;
  noteObs(world, 'trade', obsDetail.trade('sell', world.currentPlanetId));
  world.tgRun = undefined;
  clearHoldStreak(world);
  return ev(world, 'TRADE', `교역 매도 ${run.goodId} ×${run.qty} +${gain}cr (잔 ${world.credits})`);
}

/**
 * 실기 함선가까지. 실은 교역품이 있으면 먼저 판다. 열린 퀘스트 보상, 교역로, 아니면 전투 보상과 채굴 매도를 번갈아 한다.
 */
function earnForShip(world: WorldState, rng: Rng): JournalEntry {
  useHopRng(rng);
  // 한 번 왕복으로 함선 자금의 1할 이상이 남으면 퀘스트보다 교역이 먼저다. 실은 화물은 무조건 먼저 판다.
  const bigTrade = tgRunStep(world, world.tgRun ? 0 : Math.floor(hullFundGap(world) / 10));
  if (bigTrade) return bigTrade;
  if (world.hangarShips <= 0 && world.tick % 4 === 0) return restockInsteadOfFight(world);
  if (world.activeQuest || nextPlayableMissionId(world)) {
    const row = doQuest(world, rng, true, true);
    if (!row.line.includes('레벨게이트')) return row;
  }
  const tg = tgRunStep(world);
  if (tg) return tg;
  if (world.tick % 3 === 0) return trainOrRelocate(world, rng, '자금');
  return mineOrSellFund(world);
}

/** 적재가 상한이면 매도, 아니면 채굴. 퀘스트 루프와 분리. */
function mineOrSell(world: WorldState): JournalEntry {
  if ((world.mineralCargo ?? 0) >= mineCap()) return sellCargo(world);
  return mineOnce(world);
}

/** 부족하면 퀘스트, 그다음 채굴·매도. 그 한 바퀴로 개발비까지 못 메우면 보석 지갑에서 크레딧을 산다. */
export function earnCredits(world: WorldState, rng: Rng): JournalEntry {
  useHopRng(rng);
  if (world.hangarShips <= 0 && world.tick % 4 === 0) return restockInsteadOfFight(world);
  if (world.activeQuest || nextPlayableMissionId(world)) {
    const row = doQuest(world, rng, true, true);
    if (row.line.includes('레벨게이트')) return trainOrRelocate(world, rng, '수련');
    return row;
  }
  const devCost = cheapestOpenDevCost(world);
  const target = Math.max(CASH_FLOOR, devCost > 0 ? devCost + CASH_FLOOR : CASH_FLOOR);
  const shortfall = target - world.credits;
  if (shortfall > mineCap() * TRADE_SELL) {
    const deal = takeCreditExchange(world, shortfall);
    if (deal) {
      clearHoldStreak(world);
      return ev(
        world,
        'EXCHANGE',
        `지갑 교환 ${deal.productId} -${deal.gemCost}💎 +${deal.creditGrant}cr · 잔 ${world.credits} · 보석 ${world.gems}`,
      );
    }
  }
  const tg = tgRunStep(world);
  if (tg) return tg;
  return mineOrSell(world);
}

function devWouldBreakFloor(world: WorldState): boolean {
  if (world.devJob) return false;
  const pick = pickBalancedDev(world);
  if (!pick) return false;
  return world.credits - pick.cost < CASH_FLOOR;
}

function shouldEarn(world: WorldState): boolean {
  return world.credits < CASH_FLOOR || devWouldBreakFloor(world);
}

function tryInstallSat(world: WorldState): JournalEntry {
  const slot = world.planets[world.currentPlanetId];
  if (!slot) return markHold(world, 'no_slot', '위성 설치 자리 없음');
  if (slot.satLevel >= 1) return ev(world, 'SAT', `${slot.labelKo} 위성 이미 L${slot.satLevel}`);
  if (world.credits < SAT_COST) {
    return markHold(world, 'sat_broke', `위성 ${SAT_COST}cr 부족 (보유 ${world.credits})`);
  }
  world.credits -= SAT_COST;
  slot.satLevel = 1;
  world.satInstalls += 1;
  noteObs(world, 'develop', obsDetail.develop('install', 'defense_satellite', world.currentPlanetId));
  clearHoldStreak(world);
  return ev(world, 'SAT', `${slot.labelKo} 방위위성 L1 설치 -${SAT_COST}cr`);
}

function tryAnnex(world: WorldState): JournalEntry {
  const policy = resolveStelliumAnnexPolicy();
  const slot = world.planets[world.currentPlanetId];
  if (!slot) return markHold(world, 'no_slot', '편입 자리 없음');
  const holds = toHolds(world);
  const adj = hasStelliumAnnexFriendlyAdjacency(slot.systemId, holds);
  const excluded = policy.excludePlanetIds.has(slot.planetId) || slot.planetId === 'arcadia_prime';
  const gate = evaluateStelliumAnnexEligibility({
    policyEnabled: policy.enabled,
    isCorePlanet: CORE_PLANET_SET.has(slot.planetId),
    excluded,
    occupationCombatEnabled: slot.combatEnabled,
    hold: holds[slot.planetId],
    landedHere: true,
    defenseSatLevel: slot.satLevel,
    requireDefenseSatLevel: policy.requireDefenseSatLevel,
    hasFriendlyAdjacency: adj,
    vaultCredits: world.blueVault,
    costCredits: policy.costCredits,
  });
  if (!gate.ok) {
    world.annexFail += 1;
    return markHold(world, `annex_${gate.reason}`, `${slot.labelKo} 편입 불가 (${gate.reason})`);
  }
  world.blueVault -= policy.costCredits;
  slot.occupierClanId = BLUE_CLAN;
  slot.kind = 'clan_hold';
  slot.capturedAt = world.nowMs;
  slot.neutralizedAt = null;
  world.annexOk += 1;
  noteObs(world, 'annex', obsDetail.annex(slot.planetId));
  nudgeFocusStat(world, 'defense_satellite');
  clearHoldStreak(world);
  return ev(
    world,
    'ANNEX',
    `${slot.labelKo} 스텔리움 편입 -${policy.costCredits} vault (잔 ${world.blueVault})`,
  );
}

function pickFrontTarget(world: WorldState): string {
  for (let i = 0; i < FRONT_TARGETS.length; i += 1) {
    const id = FRONT_TARGETS[i];
    const slot = world.planets[id];
    if (!slot) continue;
    const p = paintOf(slot);
    if (p === 'RED' || p === 'NEUTRAL') return id;
  }
  return 'sirius_border';
}

/** 아군 인접이 이미 있는 편입 가능 중립 행성 중 가장 가까운 곳. 없으면 null. */
function nearestAnnexableNeutral(world: WorldState): string | null {
  const policy = resolveStelliumAnnexPolicy();
  if (!policy.enabled) return null;
  const holds = toHolds(world);
  const ids = Object.keys(world.planets);
  let best: string | null = null;
  let bestH = 1e9;
  for (let i = 0; i < ids.length; i += 1) {
    const slot = world.planets[ids[i]];
    if (!slot || paintOf(slot) !== 'NEUTRAL' || !slot.combatEnabled) continue;
    if (CORE_PLANET_SET.has(slot.planetId) || policy.excludePlanetIds.has(slot.planetId)) continue;
    if (slot.planetId === 'arcadia_prime') continue;
    if (!hasStelliumAnnexFriendlyAdjacency(slot.systemId, holds)) continue;
    const h = hopsBetween(world.currentSystemId, slot.systemId);
    if (h < bestH) {
      bestH = h;
      best = slot.planetId;
    }
  }
  return best;
}

/** 편입 경로 목적지. 편입 가능 중립 → 공정선 이상 전선 순. 둘 다 없으면 null. */
function pickAnnexTarget(world: WorldState): string | null {
  const neutral = nearestAnnexableNeutral(world);
  if (neutral) return neutral;
  const front = pickFrontTarget(world);
  const slot = world.planets[front];
  if (slot && winChance(world, slot.tcl, front) >= fairLine(world)) return front;
  return null;
}

function doAnnexPath(world: WorldState, rng: Rng): JournalEntry {
  const dest = pickAnnexTarget(world);
  if (!dest) return trainOrRelocate(world, rng, '수련');
  if (world.currentPlanetId !== dest) return travelOneHop(world, dest);
  if (!resolveStelliumAnnexPolicy().enabled) return fightHere(world, rng, '전선');
  const slot = world.planets[dest];
  if (!slot) return markHold(world, 'no_slot', '전선 슬롯 없음');
  const p = paintOf(slot);
  if (p === 'RED' || (p === 'BLUE' && slot.contested && rng() < 0.2)) {
    return fightHere(world, rng, '전선');
  }
  if (p === 'NEUTRAL' && slot.satLevel < 1) return tryInstallSat(world);
  if (p === 'NEUTRAL') return tryAnnex(world);
  return travelOneHop(world, approachCapitalPlanet(world));
}

function acceptLowerLevelAlt(world: WorldState, exceptId: string): JournalEntry | null {
  const ids = listPlayableMissionIds();
  for (let i = 0; i < ids.length; i += 1) {
    const id = ids[i];
    if (id === exceptId || world.completedLookup[id]) continue;
    if (world.parkedQuests.some((row) => row.missionId === id)) continue;
    if (missionHasUnresolvedPlaceholder(id)) continue;
    const sm = getMission(id);
    if (!sm || world.level < (sm.levelRequired ?? 1)) continue;
    const pre = sm.prerequisiteIds ?? [];
    let ok = true;
    for (let j = 0; j < pre.length; j += 1) {
      if (!world.completedLookup[pre[j]]) {
        ok = false;
        break;
      }
    }
    if (ok) return acceptMission(world, id, false);
  }
  return null;
}

function parkActiveQuest(world: WorldState): void {
  const quest = world.activeQuest;
  if (!quest) return;
  let replaced = false;
  for (let i = 0; i < world.parkedQuests.length; i += 1) {
    if (world.parkedQuests[i].missionId === quest.missionId) {
      world.parkedQuests[i] = quest;
      replaced = true;
      break;
    }
  }
  if (!replaced) {
    if (world.parkedQuests.length >= 16) world.parkedQuests.shift();
    world.parkedQuests.push(quest);
  }
  world.activeQuest = null;
  if (world.trainMissionId === quest.missionId) {
    world.trainPlanetId = '';
    world.trainMissionId = '';
    world.trainUntilLevel = 0;
  }
}

function parkedQuestReady(world: WorldState, quest: { missionId: string; objIndex: number }): boolean {
  const mission = getMission(quest.missionId);
  if (!mission) return false;
  const obj = mission.objectives[quest.objIndex];
  if (!obj || obj.type !== 'defeat_enemy') return true;
  const dest = questFightPlanet(world, mission, obj);
  const slot = world.planets[dest];
  if (!slot) return false;
  return winChance(world, slot.tcl, dest) >= fairLine(world);
}

function takeResumableParked(world: WorldState): ActiveQuest | null {
  let pick = -1;
  for (let i = 0; i < world.parkedQuests.length; i += 1) {
    if (!parkedQuestReady(world, world.parkedQuests[i])) continue;
    if (pick < 0 || world.parkedQuests[i].missionId.startsWith('story_')) pick = i;
    if (world.parkedQuests[i].missionId.startsWith('story_')) break;
  }
  if (pick < 0) return null;
  const quest = world.parkedQuests[pick];
  world.parkedQuests.splice(pick, 1);
  return quest;
}

function acceptMission(world: WorldState, id: string, allowAlt: boolean): JournalEntry {
  const m = getMission(id);
  if (!m) return markHold(world, 'mission_missing', `${id} 테이블 없음`);
  const need = m.levelRequired ?? 1;
  if (world.level < need) {
    if (allowAlt) {
      const alt = acceptLowerLevelAlt(world, id);
      if (alt) return alt;
    }
    return ev(world, 'QUEST', `${id} 레벨게이트 Lv${need} → 전투 수련`);
  }
  const offer = m.offerPlanetId;
  if (offer && world.currentPlanetId !== offer) return travelOneHop(world, offer);
  world.activeQuest = {
    missionId: id,
    title: m.title,
    objIndex: 0,
    acceptedDay: world.day,
  };
  world.questAccepted += 1;
  world.questBuyCount = 0;
  world.lastQuestId = id;
  world.questOriginSystemId = world.currentSystemId;
  if (id.startsWith('story_')) {
    const idx = STORY_IDS.indexOf(id);
    if (idx >= 0) world.storyCursor = idx;
  }
  noteObs(world, 'quest', obsDetail.quest('accept', id));
  clearHoldStreak(world);
  return ev(world, 'QUEST', `수락 ${id} 「${m.title}」`);
}

function doQuest(world: WorldState, rng: Rng, _preferStory: boolean, allowAlt: boolean): JournalEntry {
  if (!world.activeQuest) {
    const resumed = takeResumableParked(world);
    if (resumed) {
      world.activeQuest = resumed;
      clearHoldStreak(world);
      return ev(world, 'QUEST', `복귀 ${resumed.missionId}`);
    }
    const next = nextPlayableMissionId(world);
    if (!next) {
      if (needsHullFund(world)) return earnForShip(world, rng);
      return ev(world, 'QUEST', '수행 가능 퀘스트 소진 · 수도·개발로');
    }
    if (!world.earlyFeelClosed && world.questCleared >= 1) {
      return ev(world, 'QUEST', '초반 3분 서사 유지 · 다음 본편은 레벨 이후');
    }
    const accepted = acceptMission(world, next, allowAlt);
    if (accepted.kind === 'QUEST' && accepted.line.includes('레벨게이트')) {
      if (!world.earlyFeelClosed) return accepted;
      return trainOrRelocate(world, rng, '수련');
    }
    return accepted;
  }

  const m = getMission(world.activeQuest.missionId);
  if (!m) return markHold(world, 'mission_missing', world.activeQuest.missionId);
  const obj = m.objectives[world.activeQuest.objIndex];
  if (!obj) {
    world.credits += m.rewards.credits;
    const leveled = addExp(world, m.rewards.exp);
    markMissionDone(world, m.id);
    noteObs(world, 'quest', obsDetail.quest('complete', m.id));
    world.questCleared += 1;
    world.questBuyCount = 0;
    world.activeQuest = null;
    clearHoldStreak(world);
    if (leveled) return ev(world, 'LEVEL', `레벨 ${world.level} · ${m.id} 클리어`);
    return ev(world, 'QUEST', `클리어 ${m.id} +${m.rewards.credits}cr +${m.rewards.exp}exp`);
  }

  const dest = obj.type === 'defeat_enemy'
    ? questFightPlanet(world, m, obj)
    : objectivePlanetId(obj.type, obj.targetId) ?? m.offerPlanetId ?? world.currentPlanetId;
  if (obj.type === 'reach_planet' || obj.type === 'reach_system') {
    if (isQuestPlaceholderToken(obj.targetId) && !isResolvedQuestPlaceholder(obj.targetId)) {
      addFlag(world, `hold_placeholder:${m.id}:${obj.targetId}`);
      return markHold(world, 'unresolved_placeholder', `${m.id} 미해석 ${obj.targetId} · 완료 처리 안 함`);
    }
    if (obj.type === 'reach_system' && obj.targetId === NEIGHBOR_SYSTEM_PLACEHOLDER) {
      const origin = world.questOriginSystemId || world.currentSystemId;
      if (!world.questOriginSystemId) world.questOriginSystemId = origin;
      if (world.currentSystemId === origin) {
        const hop = neighborHopPlanet(origin);
        if (hop && hop !== world.currentPlanetId) return travelOneHop(world, hop);
        return markHold(world, 'no_neighbor', '인접 성계 없음');
      }
      world.activeQuest.objIndex += 1;
      noteObs(world, 'quest', obsDetail.quest('objective', obj.id));
      markQuestPlanet(world, world.currentPlanetId);
      clearHoldStreak(world);
      return ev(world, 'QUEST', `세부 ${obj.id} 인접성계 도착`);
    }
    if (obj.type === 'reach_planet' && obj.targetId === DISCOVERY_PLANET_PLACEHOLDER) {
      const origin = world.questOriginSystemId || world.currentSystemId;
      if (!world.questOriginSystemId) world.questOriginSystemId = origin;
      const originPlanet = lookupPrimaryPlanet(origin);
      // 인접 항로가 없는 성계에서 받으면 의뢰 행성, 그다음 중심 행성 기준으로 찾는다.
      const hop = discoveryHopPlanet(origin, originPlanet ?? undefined)
        ?? (m.offerPlanetId ? discoveryHopPlanet(lookupSystemId(m.offerPlanetId) ?? '', m.offerPlanetId) : null)
        ?? discoveryHopPlanet(lookupSystemId(FOCUS_PLANET_ID) ?? '', FOCUS_PLANET_ID);
      if (!hop) return markHold(world, 'no_discovery', '탐사 행성 없음');
      if (world.currentPlanetId !== hop) return travelOneHop(world, hop);
      world.activeQuest.objIndex += 1;
      noteObs(world, 'quest', obsDetail.quest('objective', obj.id));
      markQuestPlanet(world, hop);
      clearHoldStreak(world);
      return ev(world, 'QUEST', `세부 ${obj.id} 탐사거점 도착`);
    }
    if (obj.type === 'reach_planet' && world.currentPlanetId !== dest) return travelOneHop(world, dest);
    if (obj.type === 'reach_system' && world.currentSystemId !== obj.targetId) return travelOneHop(world, dest);
    world.activeQuest.objIndex += 1;
    noteObs(world, 'quest', obsDetail.quest('objective', obj.id));
    markQuestPlanet(world, dest);
    clearHoldStreak(world);
    return ev(world, 'QUEST', `세부 ${obj.id} 도착`);
  }
  if (obj.type === 'talk_npc' || obj.type === 'deliver_cargo' || obj.type === 'collect_item') {
    if (dest && world.currentPlanetId !== dest) return travelOneHop(world, dest);
    world.activeQuest.objIndex += 1;
    noteObs(world, 'quest', obsDetail.quest('objective', obj.id));
    markQuestPlanet(world, dest);
    clearHoldStreak(world);
    return ev(world, 'QUEST', `세부 ${obj.id} ${obj.type}`);
  }
  if (obj.type === 'buy_goods') {
    const hub = nearestTradePlanet(world.currentPlanetId);
    if (world.currentPlanetId !== hub) return travelOneHop(world, hub);
    const need = Math.max(1, obj.quantity ?? 1);
    const price = itemBasePrice(obj.targetId);
    if (world.credits < price) {
      return world.tick % 2 === 0 ? trainOrRelocate(world, rng, '매입 자금') : mineOrSell(world);
    }
    world.credits -= price;
    world.trades += 1;
    noteObs(world, 'trade', obsDetail.trade('buy', world.currentPlanetId));
    world.questBuyCount += 1;
    clearHoldStreak(world);
    if (world.questBuyCount >= need) {
      world.activeQuest.objIndex += 1;
      noteObs(world, 'quest', obsDetail.quest('objective', obj.id));
      world.questBuyCount = 0;
      markQuestPlanet(world, hub);
      return ev(world, 'QUEST', `세부 ${obj.id} 매입 ${need}회 완료`);
    }
    return ev(world, 'TRADE', `${obj.targetId} 매입 ${world.questBuyCount}/${need} -${price} (잔 ${world.credits})`);
  }
  if (obj.type === 'defeat_enemy') {
    const fightPlanet = dest || world.currentPlanetId;
    const fightSlot = world.planets[fightPlanet];
    const destChance = fightSlot ? winChance(world, fightSlot.tcl, fightPlanet) : 0;
    if (destChance < fairLine(world)) {
      addFlag(world, `quest_combat_bypass:${m.id}`);
      world.lastHoldReason = 'quest_combat_bypass';
      parkActiveQuest(world);
      return doQuest(world, rng, _preferStory, allowAlt);
    }
    world.trainPlanetId = '';
    world.trainMissionId = '';
    if (dest && world.currentPlanetId !== dest) {
      return travelOneHop(world, dest);
    }
    markQuestPlanet(world, dest);
    if ((world.questCombatLossStreak ?? 0) >= 3) {
      world.questCombatLossStreak = 0;
      addFlag(world, `quest_combat_bypass:${m.id}`);
      world.lastHoldReason = 'quest_combat_bypass';
      return mineOrSell(world);
    }
    const before = world.combatWins;
    const row = fightHere(world, rng, '퀘스트');
    if (world.combatWins > before) {
      world.questCombatLossStreak = 0;
      world.activeQuest.objIndex += 1;
      noteObs(world, 'quest', obsDetail.quest('objective', obj.id));
      return ev(world, 'QUEST', `세부 ${obj.id} 격파 · ${row.line}`);
    }
    world.questCombatLossStreak = (world.questCombatLossStreak ?? 0) + 1;
    return row;
  }
  world.activeQuest.objIndex += 1;
  noteObs(world, 'quest', obsDetail.quest('objective', obj.id));
  return ev(world, 'QUEST', `세부 ${obj.id} 통과`);
}

function doTrade(
  world: WorldState,
  rng: Rng,
  forceBuy: boolean,
  afterBuy?: () => void,
): JournalEntry {
  if (needsHullFund(world) && !forceBuy) return mineOrSellFund(world);
  const slot = world.planets[world.currentPlanetId];
  if (!slot?.hasTrade) {
    const hub = nearestTradePlanet(world.currentPlanetId);
    if (hub && hub !== world.currentPlanetId) return travelOneHop(world, hub);
    return markHold(world, 'no_trade_hub', '무역소 없음');
  }
  const goods = world.goodsCargo ?? 0;
  const wantBuy = forceBuy || goods <= 0 || (getPreferSell() ? rng() < 0.28 : rng() < 0.55);
  const buy = wantBuy && world.credits - TRADE_BUY >= CASH_FLOOR;
  if (buy) {
    world.credits -= TRADE_BUY;
    world.goodsCargo = goods + 1;
    world.trades += 1;
    noteObs(world, 'trade', obsDetail.trade('buy', world.currentPlanetId));
    afterBuy?.();
    clearHoldStreak(world);
    return ev(world, 'TRADE', `${slot.labelKo} 매입 -${TRADE_BUY} (잔 ${world.credits} · 교역품 ${world.goodsCargo})`);
  }
  if (goods <= 0) return mineOrSell(world);
  world.goodsCargo = goods - 1;
  world.credits += TRADE_SELL;
  world.trades += 1;
  noteObs(world, 'trade', obsDetail.trade('sell', world.currentPlanetId));
  clearHoldStreak(world);
  return ev(world, 'TRADE', `${slot.labelKo} 매도 +${TRADE_SELL} (잔 ${world.credits} · 교역품 ${world.goodsCargo})`);
}

function doColonize(world: WorldState, rng: Rng): JournalEntry {
  const dest = world.planets.synth_011_p ? 'synth_011_p' : pickFrontTarget(world);
  if (world.currentPlanetId !== dest) return travelOneHop(world, dest);
  const slot = world.planets[dest];
  if (!slot) return markHold(world, 'no_slot', '개척 자리 없음');
  if (paintOf(slot) === 'RED') return fightHere(world, rng, '개척 선행');
  if (paintOf(slot) !== 'NEUTRAL') {
    return travelOneHop(world, approachCapitalPlanet(world));
  }
  if (slot.satLevel < 1) return tryInstallSat(world);
  if (world.blueVault < COLONIZE_VAULT) {
    return markHold(world, 'colonize_vault', `개척 금고 ${COLONIZE_VAULT} 부족`);
  }
  world.blueVault -= COLONIZE_VAULT;
  slot.kind = 'player_independent';
  slot.occupierClanId = `solo_playbot_${world.runId}`;
  slot.capturedAt = world.nowMs;
  slot.neutralizedAt = null;
  world.colonizeOk += 1;
  clearHoldStreak(world);
  return ev(world, 'COLONIZE', `${slot.labelKo} 독립국 개척 -${COLONIZE_VAULT} vault`);
}

/** 수도 쪽 전선이 공정선 미만이면 다가가도 연료만 든다. 그때는 수련지로 간다. */
function doTravel(world: WorldState): JournalEntry {
  if (world.hangarShips <= 0) return restockInsteadOfFight(world);
  if (!world.capitalDestroyed) {
    const front = approachCapitalPlanet(world);
    const slot = world.planets[front];
    if (slot && winChance(world, slot.tcl, front) >= fairLine(world)) return travelOneHop(world, front);
    const train = bestTrainPlanet(world);
    if (train) return travelOneHop(world, train);
    return travelOneHop(world, front);
  }
  return travelOneHop(world, world.focusPlanetId || FOCUS_PLANET_ID);
}

function doCapital(world: WorldState, rng: Rng): JournalEntry {
  const dest = approachCapitalPlanet(world);
  const destSlot = world.planets[dest];
  if (destSlot && winChance(world, destSlot.tcl, dest) < fairLine(world)) return trainOrRelocate(world, rng, '수련');
  if (world.currentPlanetId !== dest) return travelOneHop(world, dest);
  const before = world.combatWins;
  const row = fightHere(world, rng, dest === CRIMSON_CAPITAL_PLANET_ID ? '수도' : '전선');
  if (dest === CRIMSON_CAPITAL_PLANET_ID && world.combatWins > before) {
    world.capitalDestroyed = true;
    clearHoldStreak(world);
    return ev(world, 'CAPITAL', `크림슨 수도 ${dest} 격파 · ${row.line}`);
  }
  return row;
}

function doGear(world: WorldState, rng: Rng): JournalEntry {
  const market = hullMarketPlanet(world);
  if (market && market !== world.currentPlanetId) return travelOneHop(world, market);
  const hullLine = tryBuyNextHull(world);
  if (hullLine) {
    clearHoldStreak(world);
    return ev(world, 'GEAR', hullLine);
  }
  if (needsHullFund(world)) return earnForShip(world, rng);
  const slot = world.planets[world.currentPlanetId];
  if (!slot?.hasTrade && !lookupHasTrade(world.currentPlanetId)) {
    return doTrade(world, rng, false);
  }
  const row = tryBuyBestGear(world, (kind, line) => ev(world, kind, line));
  if (row.kind === 'GEAR' && !row.line.includes('없음')) clearHoldStreak(world);
  return row;
}

function doDevelop(world: WorldState, rng: Rng): JournalEntry {
  if (needsHullFund(world)) return earnForShip(world, rng);
  if (devWouldBreakFloor(world)) return earnCredits(world, rng);
  const dest = world.focusPlanetId || FOCUS_PLANET_ID;
  if (world.currentPlanetId !== dest) return travelOneHop(world, dest);
  const row = tryDevelopFocus(world, (kind, line) => ev(world, kind, line));
  if (row.kind === 'DEVELOP' && !row.line.includes('대기')) clearHoldStreak(world);
  return row;
}

export function stepAction(
  world: WorldState,
  rng: Rng,
  persona: PersonaId,
  opts: { allowSides: boolean },
): JournalEntry {
  useHopRng(rng);
  let kind = pickStepKind(world, rng, persona);
  if (world.hangarShips <= 0 && world.tick % 4 === 0) kind = 'travel';
  else if (world.activeQuest && rng() < 0.48) kind = 'quest';
  completeDueDevJob(world);
  if (
    world.earlyFeelClosed &&
    needsHullFund(world) &&
    kind !== 'skill' &&
    world.tick % 3 !== 2
  ) {
    world.lastAction = 'trade';
    world.actionCounts.trade = (world.actionCounts.trade ?? 0) + 1;
    return earnForShip(world, rng);
  }
  if (world.earlyFeelClosed && currentPlayIntelligence().earnEnabled && shouldEarn(world)) {
    world.lastAction = 'trade';
    world.actionCounts.trade = (world.actionCounts.trade ?? 0) + 1;
    return earnCredits(world, rng);
  }
  world.lastAction = kind;
  world.actionCounts[kind] = (world.actionCounts[kind] ?? 0) + 1;
  if (kind === 'quest') {
    return doQuest(world, rng, true, opts.allowSides);
  }
  if (kind === 'skill') {
    const row = tryLearnSkill(world, (k, line) => ev(world, k, line));
    if (row.kind === 'SKILL' && row.line.startsWith('습득 ')) clearHoldStreak(world);
    return row;
  }
  if (kind === 'gear') return doGear(world, rng);
  if (kind === 'develop') return doDevelop(world, rng);
  if (kind === 'capital') return doCapital(world, rng);
  if (kind === 'combat') {
    const hop = combatRedirectPlace(world);
    if (hop) {
      const dest = world.planets[hop];
      if (dest && winChance(world, dest.tcl) >= fairLine(world)) return travelOneHop(world, hop);
    }
    const slot = world.planets[world.currentPlanetId];
    if (slot && slot.combatEnabled && (paintOf(slot) === 'RED' || slot.contested)) {
      return trainOrRelocate(world, rng, '유랑');
    }
    return travelOneHop(world, approachCapitalPlanet(world));
  }
  if (kind === 'trade') return doTrade(world, rng, false);
  if (kind === 'annex_path') return doAnnexPath(world, rng);
  if (kind === 'colonize') return doColonize(world, rng);
  if (kind === 'travel') return doTravel(world);
  return ev(world, 'HOLD', '대기', { hold: true, reason: 'idle' });
}
