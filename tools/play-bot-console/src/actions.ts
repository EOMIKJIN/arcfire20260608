import {
  evaluateStelliumAnnexEligibility,
  hasStelliumAnnexFriendlyAdjacency,
} from '../../../src/arcCore/annex/stelliumAnnexEligibility';
import { resolvePlanetSalvageSearchPolicy } from '../../../src/game/planetSalvageSearchPolicy';
import { resolvePlanetSalvageSearchOutcome } from '../../../src/game/planetSalvageSearch';
import { planetHasMineableOrbitalDeposits } from '../../../src/world/mineralDepositModel';
import { PlanetDefenseSatelliteLevelPolicy_FROM_BALANCE_CSV } from '../../../src/data/balance/generated/csvPlanetDefenseSatelliteLevelPolicy';
import { resolveStelliumAnnexPolicy } from '../../../src/arcCore/annex/stelliumAnnexPolicy';
import { computePlanetTradeFeeBreakdown } from '../../../src/arcCore/economy/planetUpkeepPolicy';
import { STARTING_PLANET_ID } from '../../../src/data/systems';
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
import { pickStepKind, setConquestProbe, setFortifyProbe } from './intent';
import {
  approachCapitalPlanet,
  canBuyBetterGear,
  completeDueDevJob,
  isCapitalAssaultReady,
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
  currentHullValue,
  hullFundGap,
  hullMarketPlanet,
  liveCombatCredit,
  liveMineralUnitPrice,
  needsHullFund,
  nextHullStep,
  nextHullWorthBuying,
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
import { listAdjacentSystemIds } from '../../../src/arcCore/territorial/territorialSupplyLine';
import { rollMiningDropGoodId } from '../../../src/arcCore/economy/mineralMiningDropPolicy';
import {
  addOre,
  applyMineralUpgrade,
  canMineralUpgrade,
  mineralUpgradeTarget,
  oreCount,
  pickOreToSell,
  removeSoldOre,
  sellableCargo,
} from './mineralUpgrade';

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

/**
 * 인간 플레이 기준(대표님 2026-10-10) — 「전함은 파괴당하라고 있는 게 아니라 돈을 벌어 강화하려고 있다」.
 *  - 평소 전투(사냥·수련·자금): 파괴당하지 않는 싸움만(SAFE_FIGHT_MIN). 돈을 모으려고 수백 번 반복은 맞다.
 *  - 도전(정복·퀘스트·수도): 강해져서 승률 50:50(CHALLENGE_MIN)에 이르면 도전. 5~10회 파괴돼도 반복 가능.
 *  - 같은 전투·같은 세팅·같은 행동으로 CHALLENGE_LOSS_LIMIT(20)회 파괴되면 무조건 막는다(세팅이 바뀌면 새 도전).
 *  - 파괴당하면 DETOUR 동안 도전을 쉬고 안전한 전투로 돌아간다(이동은 위험 성계를 우회).
 * 트윈 행동 상수.
 */
const SAFE_FIGHT_MIN = 0.97;
const CHALLENGE_MIN = 0.5;
const CHALLENGE_LOSS_LIMIT = 20;
const CHALLENGE_REASONS = new Set(['퀘스트', '전선', '수도']);

/** 산 함선을 탄 평소 전투 승률 하한 — 수천 번 반복하는 수련에서 3%씩 잃으면 함선이 돈 구멍이 된다 */
const SAFE_FIGHT_MIN_HULL = 0.995;

/** 산 함선(값 > 0)을 걸고 있나 */
function hullAtStake(world: WorldState): boolean {
  return currentHullValue(world) > 0;
}

/** 평소 전투 승률 하한 — 산 함선이면 더 안전한 싸움만 */
function fairLine(world: WorldState): number {
  return hullAtStake(world) ? SAFE_FIGHT_MIN_HULL : SAFE_FIGHT_MIN;
}

function challengeKey(world: WorldState, planetId: string, reason: string): string {
  return `${planetId}|${reason}|${playerCombatSigForConquest(world)}`;
}

function inDetour(world: WorldState): boolean {
  return world.tick < (world.detourUntilTick ?? 0);
}

/** 도전 가능 — 우회 중이 아니고 · 같은 도전 파괴 한도 미만 · 승률 50:50 이상 */
function canChallenge(world: WorldState, planetId: string, tcl: number, reason: string): boolean {
  if (inDetour(world)) return false;
  if ((world.challengeLosses?.[challengeKey(world, planetId, reason)] ?? 0) >= CHALLENGE_LOSS_LIMIT) return false;
  return winChance(world, tcl, planetId) >= CHALLENGE_MIN;
}

/**
 * 「준비 다 하고 도전」(대표님 2026-10-10 B안) — 승률이 이 값 미만이고 지금 살 수 있는 강화가 남아 있으면
 * 도전하지 않고 강화부터 한다. 강화를 다 써도 50:50 근처면 그때 도전(대표님 50:50 규칙 유지). 트윈 행동 상수.
 */
const CHALLENGE_READY_WIN = 0.75;
/** 같은 목표·같은 전투력으로 강화를 미룬 최대 횟수 */
const PREP_DEFER_LIMIT = 6;

/** 지금 돈·광물로 전투력을 올릴 수 있나 — 장비·광물 강화·다음 함선 */
function strengtheningAvailable(world: WorldState): boolean {
  if (canBuyBetterGear(world) || canMineralUpgrade(world)) return true;
  const next = nextHullStep(world);
  return !!next && next.price > 0 && world.level >= next.levelReq
    && world.credits >= next.price + 800 && nextHullWorthBuying(world);
}

/** 도전 전에 강화할 게 있으면 강화 행동, 아니면 null(도전해도 된다) */
function strengthenBeforeChallenge(world: WorldState, rng: Rng, planetId: string, tcl: number): JournalEntry | null {
  if (winChance(world, tcl, planetId) >= CHALLENGE_READY_WIN) return null;
  if (!strengtheningAvailable(world)) return null;
  // 강화하러 가도 전투력이 그대로면(살 수 없는 장비·막힌 시장) 그만 미루고 도전한다 — 미루기만 반복하면 정체
  const key = `${planetId}|${playerCombatSigForConquest(world)}`;
  const n = world.prepDefer?.key === key ? world.prepDefer.n + 1 : 1;
  world.prepDefer = { key, n };
  if (n > PREP_DEFER_LIMIT) return null;
  return doGear(world, rng);
}

/**
 * 안전 항로 — 성계마다 조우 패배 위험(hopLossChance)을 벌점으로 둔 최단 경로의 다음 성계.
 * 사람은 위험한 성계를 돌아간다. 위험 1% = 홉 ROUTE_RISK_PENALTY/100 개만큼 멀게 본다. 트윈 행동 상수.
 */
const ROUTE_RISK_PENALTY = 60;
function safeNextSystem(world: WorldState, from: string, to: string): string | null {
  if (from === to) return null;
  const dist = new Map<string, number>([[from, 0]]);
  const prev = new Map<string, string>();
  const done = new Set<string>();
  for (let guard = 0; guard < 400; guard += 1) {
    let cur: string | null = null;
    let curD = Infinity;
    for (const [s, d] of dist) {
      if (!done.has(s) && d < curD) {
        cur = s;
        curD = d;
      }
    }
    if (!cur || cur === to) break;
    done.add(cur);
    const adj = listAdjacentSystemIds(cur);
    for (let i = 0; i < adj.length; i += 1) {
      const n = adj[i];
      if (done.has(n)) continue;
      const w = 1 + ROUTE_RISK_PENALTY * (n === to ? 0 : systemRisk(world, n));
      const nd = curD + w;
      if (nd < (dist.get(n) ?? Infinity)) {
        dist.set(n, nd);
        prev.set(n, cur);
      }
    }
  }
  if (!prev.has(to)) return bfsNextSystem(from, to);
  let walk = to;
  while (prev.get(walk) && prev.get(walk) !== from) walk = prev.get(walk)!;
  return walk;
}

/** 전투 관문 — 피할 수 없는 전투(조우·웨이브)가 아니면 평소는 안전선, 도전은 50:50+한도 */
function fightAllowed(world: WorldState, reason: string, tcl: number): boolean {
  if (reason === '조우' || reason === '웨이브') return true;
  if (CHALLENGE_REASONS.has(reason)) return canChallenge(world, world.currentPlanetId, tcl, reason);
  return winChance(world, tcl) >= fairLine(world);
}

/** 싸우지 않을 때 — 안전한 사냥터로 가거나, 없으면 채굴·매도(돈은 안전하게 번다) */
let inSafeAlternative = false;

/** 이동 없이 그 자리에서 벌기 — 채굴(적재 여유가 있으면) 아니면 잔해 수색 */
let inEarnInPlace = false;
function earnInPlace(world: WorldState): JournalEntry {
  // 여기서 안전하게 싸울 수 있으면 수련(경험치 + 성장) — 수색만 반복하면 갇혀서 자라지 못한다
  const slot = world.planets[world.currentPlanetId];
  if (!inEarnInPlace && slot?.combatEnabled && winChance(world, slot.tcl) >= fairLine(world)) {
    // 수련 전투가 다른 전장으로 돌리다 다시 여기로 오면 채굴·수색으로 끝낸다(무한 재귀 방지)
    inEarnInPlace = true;
    try {
      return trainFight(world, hopRng, '수련');
    } finally {
      inEarnInPlace = false;
    }
  }
  if (planetHasMineableOrbitalDeposits(world.currentPlanetId) && sellableCargo(world) < mineCap()) return mineOnce(world);
  return salvageOnce(world);
}
function safeAlternative(world: WorldState): JournalEntry {
  if (inSafeAlternative) return mineOrSell(world);
  inSafeAlternative = true;
  try {
    // 막힌 도전의 대안 = 성장. 기대 경험치가 큰 안전 수련장 → 가까운 안전 전장 → 여기서 수련 → 채굴·매도
    const safe = bestTrainPlanet(world) ?? fairFightPlanet(world);
    if (safe && safe !== world.currentPlanetId && canPayRoute(world, safe)) return travelOneHop(world, safe, true, GROWTH_HOP_RISK_MAX);
    const slot = world.planets[world.currentPlanetId];
    if (slot?.combatEnabled && winChance(world, slot.tcl) >= fairLine(world)) return trainFight(world, hopRng, '수련');
    return mineOrSell(world);
  } finally {
    inSafeAlternative = false;
  }
}

/**
 * 다음 홉 위험 상한 — 다음 성계 조우 패배 위험이 이보다 크면 가지 않고 안전하게 번다(강해지면 간다).
 * 매복당한 성계는 같은 레벨·며칠 동안 위험으로 기억해 더한다. 트윈 행동 상수.
 */
const HOP_RISK_MAX = 0.03;
/** 이번 행동에서 위험 관문이 이동을 막았는지(퀘스트 보류 판단용) */
let hopBlocked = false;
/** 성장 이동(더 나은 수련장·안전 사냥터로 옮김) 상한 — 목적 있는 이동과 같다(넘으면 도전 규칙). 트윈 행동 상수. */
const GROWTH_HOP_RISK_MAX = 0.1;
const PURPOSEFUL_TRAVEL = new Set<string>(['quest', 'annex_path', 'capital', 'colonize', 'travel']);
const AMBUSH_MEMORY_RISK = 0.2;

/** 매복 기억 유지 — 레벨이 오르거나 이 일수가 지나면 잊는다(같은 레벨에 묶여 수련장을 영영 못 가는 교착 방지). 트윈 행동 상수. */
const AMBUSH_MEMORY_DAYS = 3;

/** 지금 유효한 매복 횟수 — 옛 세계 파일의 숫자 값은 무시한다 */
function ambushCount(world: WorldState, systemId: string): number {
  const m = world.ambushMemory?.[systemId];
  if (!m || typeof m !== 'object') return 0;
  if (m.level !== world.level) return 0;
  if (world.tick - m.tick >= AMBUSH_MEMORY_DAYS * Math.max(1, world.ticksPerDay)) return 0;
  return m.n;
}

function systemRisk(world: WorldState, systemId: string): number {
  const remembered = ambushCount(world, systemId) > 0 ? AMBUSH_MEMORY_RISK : 0;
  return Math.min(1, hopLossChance(world, systemId) + remembered);
}

/**
 * 목적 있는 이동(퀘스트·정복·수도) 상한. 넘으면 「도전」으로만 간다:
 * 조우 패배 위험 ≤ 50% · 파괴 뒤 쉬는 중 아님 · 같은 성계·같은 레벨 매복 파괴 2회 미만.
 * 그 밖에는 막고 성장 행동(수련·강화·채굴)으로 메운 뒤 다시 도전한다(대표님 2026-10-10 인간 플레이). 트윈 행동 상수.
 */
const PURPOSE_HOP_RISK_MAX = 0.1;
const HOP_CHALLENGE_RISK_MAX = 0.25;
/** 하루 넘게 경험치가 안 오르면(대안 행동으로 못 메움) 50:50 도전까지 감수 — 벽에 갇히지 않게 */
const HOP_CHALLENGE_RISK_STALLED = 0.5;
const AMBUSH_RETRY_LIMIT = 2;

/** 3일 넘게 정체면(막다른 성계·빈 격납고 등) 어떤 출구든 마지막 도전으로 감수 — 매복 재시도 한도는 그대로 */
const HOP_DESPERATE_STALL_DAYS = 3;

/** 경험치가 마지막으로 오른 뒤 지난 일수 */
function progressStallDays(world: WorldState): number {
  if (world.progressExpMark !== world.totalExp) {
    world.progressExpMark = world.totalExp;
    world.progressExpTick = world.tick;
  }
  return (world.tick - (world.progressExpTick ?? world.tick)) / Math.max(1, world.ticksPerDay);
}

/** 목적 있는 이동이 막힌 채 지난 일수 — 막다른 성계에서 수련만 하며 갇히는 경우(경험치는 올라도 목표에 못 감) */
function purposeBlockedDays(world: WorldState): number {
  if (world.purposeBlockedSince == null) return 0;
  return (world.tick - world.purposeBlockedSince) / Math.max(1, world.ticksPerDay);
}

/** 지금 퀘스트가 항로 위험으로 처음 막힌 뒤 지난 일수(퀘스트별 — 다른 목적 이동이 성공해도 지워지지 않는다) */
function questBlockedDays(world: WorldState): number {
  // 수락하러 가는 중(진행 퀘스트 없음)이면 목적 이동 막힘 일수로 본다
  if (!world.activeQuest) return purposeBlockedDays(world);
  const since = world.activeQuest.blockedSince;
  if (since == null) return 0;
  return (world.tick - since) / Math.max(1, world.ticksPerDay);
}

function hopChallengeRiskMax(world: WorldState): number {
  const days = Math.max(progressStallDays(world), purposeBlockedDays(world));
  if (days > HOP_DESPERATE_STALL_DAYS) return 1;
  return days > 1 ? HOP_CHALLENGE_RISK_STALLED : HOP_CHALLENGE_RISK_MAX;
}

/** 산 함선을 걸고 있을 때 목적 이동·도전 홉 상한 — 비싼 함선으로 위험 항로를 반복하지 않는다. 트윈 행동 상수. */
const HULL_HOP_RISK_MAX = 0.003;
const HULL_HOP_CHALLENGE_MAX = 0.05;
/** 산 함선으로 급하지 않은 이동을 할 때 한 홉 기대 손실 상한(cr) */
const OPTIONAL_TRIP_LOSS_CR = 500;
/** 산 함선을 잃은 성계를 도전 홉에서 빼는 일수 */
const HULL_LOSS_AVOID_DAYS = 10;

function hopAllowed(world: WorldState, systemId: string, cap: number): boolean {
  const risk = systemRisk(world, systemId);
  const stake = hullAtStake(world);
  const purposeful = cap >= PURPOSE_HOP_RISK_MAX;
  if (stake) cap = Math.min(cap, HULL_HOP_RISK_MAX);
  // 급하지 않은 이동(채굴·장비·보강)은 기대 손실(위험 × 함선 값)이 작을 때만 — 89만 함선이면 0.2%도 1,800cr
  if (stake && !purposeful) cap = Math.min(cap, OPTIONAL_TRIP_LOSS_CR / currentHullValue(world));
  if (risk <= cap) return true;
  // 지금 성계보다 위험하지 않은 곳으로 가는 건 후퇴다 — 적진 깊숙이 갇히지 않는다
  if (risk <= systemRisk(world, world.currentSystemId)) return true;
  if (!purposeful) return false;
  // 산 함선으로 퀘스트 이동 도전은 퀘스트 진행이 3일 넘게 막혔을 때만 — 퀘스트 보상(수천 cr)이 홉당 기대 손실(수만 cr)보다 작다.
  // 그 전에는 퀘스트를 보류하고 다른 진행(본편·정복·성장)을 한다
  if (stake && world.lastAction === 'quest' && questBlockedDays(world) <= HOP_DESPERATE_STALL_DAYS) return false;
  // 산 함선을 잃은 성계는 한동안 도전으로도 지나지 않는다(사람: 비싼 배를 잃은 항로는 피한다)
  if (stake && world.tick - (world.hullLossTick?.[systemId] ?? -1e9) < HULL_LOSS_AVOID_DAYS * Math.max(1, world.ticksPerDay)) return false;
  const challengeMax = hopChallengeRiskMax(world);
  if (risk > (stake ? Math.min(challengeMax, HULL_HOP_CHALLENGE_MAX) : challengeMax)) return false;
  if (world.tick < (world.detourUntilTick ?? 0)) return false;
  // 같은 성계·같은 세팅 매복 파괴 20회 = 무조건 막음(대표님 2026-10-10) — 마지막 도전도 넘지 못한다
  if ((world.challengeLosses?.[challengeKey(world, systemId, '조우')] ?? 0) >= CHALLENGE_LOSS_LIMIT) return false;
  return ambushCount(world, systemId) < AMBUSH_RETRY_LIMIT;
}

/** 파괴 기록 — 도전이면 같은 도전 횟수 +1 · 조우면 그 성계를 기억(우회) · 그 밖에는 하루 동안 도전을 쉬고 안전 전투로 */
function noteDestroyed(world: WorldState, planetId: string, reason: string): void {
  if (reason === '조우') {
    const sys = world.currentSystemId;
    world.ambushMemory = { ...(world.ambushMemory ?? {}), [sys]: { n: ambushCount(world, sys) + 1, tick: world.tick, level: world.level } };
    const key = challengeKey(world, sys, '조우');
    world.challengeLosses = { ...(world.challengeLosses ?? {}), [key]: (world.challengeLosses?.[key] ?? 0) + 1 };
  }
  if (CHALLENGE_REASONS.has(reason)) {
    const key = challengeKey(world, planetId, reason);
    world.challengeLosses = { ...(world.challengeLosses ?? {}), [key]: (world.challengeLosses?.[key] ?? 0) + 1 };
  }
  world.detourUntilTick = world.tick + Math.max(1, world.ticksPerDay);
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

function travelOneHop(world: WorldState, wantedPlanetId: string, commit = true, hopRiskCap?: number): JournalEntry {
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
  // 위험 성계를 돌아가는 안전 항로(사람처럼 우회)
  const next = safeNextSystem(world, world.currentSystemId, destSys);
  if (!next) return markHold(world, 'no_route', `${world.currentSystemId}→${destSys} 항로 없음`);
  // 목적 없는 이동(교역 왕복·떠돌기)은 다음 홉이 위험하면 가지 않는다 — 안전하게 벌고 강해진 뒤에 간다.
  // 퀘스트·정복·수도 이동은 상한이 넓고, 넘으면 도전 규칙(hopAllowed)으로만 간다.
  const cap = PURPOSEFUL_TRAVEL.has(world.lastAction) ? PURPOSE_HOP_RISK_MAX : (hopRiskCap ?? HOP_RISK_MAX);
  if (!hopAllowed(world, next, cap)) {
    hopBlocked = true;
    if (cap >= PURPOSE_HOP_RISK_MAX && world.purposeBlockedSince == null) world.purposeBlockedSince = world.tick;
    world.travelGoal = '';
    // 안전 대안 안에서 또 막히면 이동하지 않고 그 자리에서 번다(무한 우회 방지)
    if (inSafeAlternative) return earnInPlace(world);
    return safeAlternative(world);
  }
  if (cap >= PURPOSE_HOP_RISK_MAX) world.purposeBlockedSince = undefined;
  const hopPlanet = lookupPrimaryPlanet(next);
  if (!hopPlanet) return markHold(world, 'no_hop_planet', `${next} 행성 없음`);
  const routeHops = hopsBetween(world.currentSystemId, destSys);
  const fuel = hopFuelCredits(world.currentSystemId, next, world.hullTierKey || 'frigate_default', routeHops);
  if (world.credits < fuel) {
    world.travelGoal = '';
    return recoverBroke(world);
  }
  // 생존포드 귀환 뒤 빈털터리로 첫 홉만 날아가 중간 성계에 갇히는 빈곤 루프 차단:
  // 무역소+채굴이 되는 곳에서 남은 항로 연료를 못 대면 여기서 먼저 번다.
  if (POD_RETURN_HOME && routeHops > 1 && world.credits < fuel * routeHops && lookupHasTrade(world.currentPlanetId)
    && planetHasMineableOrbitalDeposits(world.currentPlanetId)
    && world.credits < routeFuelCredits(world, destSys)) {
    return recoverBroke(world);
  }
  world.credits -= fuel;
  const fromSysDiag = world.currentSystemId;
  moveTo(world, hopPlanet);
  clearHoldStreak(world);
  const chance = transitEncounterChance(world, next);
  const diagRank = world.hullRank ?? 0;
  const diagRisk = systemRisk(world, next);
  const diagCur = systemRisk(world, fromSysDiag);
  if (chance > 0 && hopRng() < chance) {
    const row = fightHere(world, hopRng, '조우');
    if (process.env.PB_DIAG && diagRank > 0 && (world.hullRank ?? 0) < diagRank) console.log('[hull-lost]', world.lastAction, fromSysDiag, '->', next, 'est', diagRisk.toFixed(3), 'cur', diagCur.toFixed(3), 'enc', chance.toFixed(2), 'cap', cap, 'stall', progressStallDays(world).toFixed(1), purposeBlockedDays(world).toFixed(1));
    return ev(world, row.kind, `${hopPlanet} 이동중 조우 · 연료 -${fuel}cr · ${row.line}`);
  }
  const left = hopsBetween(world.currentSystemId, destSys);
  if (left === 0 || hopPlanet === destPlanetId) {
    const landed = landLine(world, hopPlanet);
    return ev(world, landed.kind, `${landed.line} · 연료 -${fuel}cr`);
  }
  return ev(world, 'TRAVEL', `${hopPlanet} 경유 → ${destPlanetId} (잔여 ${left}홉) · 연료 -${fuel}cr`);
}

/** 지금 위치에서 목적 성계까지 남은 연료 합. 홉마다 남은 홉 수로 항로 길이 배율을 다시 잰다(travelOneHop 과 같음). */
function routeFuelCredits(world: WorldState, destSys: string): number {
  let sys = world.currentSystemId;
  let total = 0;
  for (let guard = 0; sys !== destSys && guard < 32; guard += 1) {
    const next = bfsNextSystem(sys, destSys);
    if (!next) break;
    total += hopFuelCredits(sys, next, world.hullTierKey || 'frigate_default', hopsBetween(sys, destSys));
    sys = next;
  }
  return total;
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
  // 격납고 보충은 생존 이동 — 목적 있는 이동과 같은 상한(넘으면 도전 규칙)
  if (world.currentPlanetId !== yard) return travelOneHop(world, yard, true, PURPOSE_HOP_RISK_MAX);
  restockHangarIfYard(world);
  return ev(world, 'LAND', `${yard} 착륙 · 격납고 보충 ${world.hangarShips}/${world.hangarMax}`);
}

/** 거점 = 실기 resolvePlayerHomePlanetId 기본값(STARTING_PLANET_ID). 트윈은 거점 구매(homePlanetId)를 하지 않는다. */
const HOME_PLANET_ID = STARTING_PLANET_ID;

/**
 * 생존포드 거점 귀환 — 기본 OFF(실험 시 PB_POD_HOME=1).
 * 켜면 벤치 L28→L19·하드 정체 0→110(리포트 §4): 공정선 0.5 전투에서 격침될 때마다 거점으로 돌아가
 * 다시 날아가느라 연료·시간을 쓰고, 초반에는 아르카디아↔베가 빈곤 루프에 갇힌다.
 * 봇 쪽 전장 선택(격침 비용 반영 승률선·거점 근처 수련)을 먼저 고친 뒤 켠다.
 */
const POD_RETURN_HOME = process.env.PB_POD_HOME === '1';

function returnHomeAfterDestroy(world: WorldState): string {
  if (!POD_RETURN_HOME) return '';
  if (world.currentPlanetId === HOME_PLANET_ID) return '';
  const from = world.currentPlanetId;
  if (!moveTo(world, HOME_PLANET_ID)) return '';
  world.travelGoal = '';
  return ` · 생존포드 거점 귀환 ${from}→${HOME_PLANET_ID}`;
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
  // 전투 관문(대표님 인간 플레이 기준) — 안전하지 않은 평소 전투·조건 안 되는 도전은 하지 않는다
  if (!fightAllowed(world, reason, slot.tcl)) return safeAlternative(world);
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
    // 점령 변화는 체류 전투 승리만(대표님 규칙 — 착륙 전 이동중 조우는 체류가 아님).
    // 크림슨 수도는 수도 공략(보스전) 승리로만 함락 — 수련·웨이브·조우 승리로 넘어가지 않는다.
    const isCapital = world.currentPlanetId === CRIMSON_CAPITAL_PLANET_ID;
    const flips = p === 'RED' && reason !== '조우' && (!isCapital || reason === '수도');
    if (isCapital && reason === '수도') world.capitalDestroyed = true;
    if (flips && !isCapital) {
      // 정복 마무리 — 중립화한 행성이 편입 가능하면(아군 인접) 위성·편입까지 이어서 한다
      world.conquestFocus = { planetId: world.currentPlanetId, untilTick: world.tick + 2 * Math.max(1, world.ticksPerDay) };
    }
    if (flips) {
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
  noteDestroyed(world, world.currentPlanetId, reason);
  if (world.hangarShips > 0) world.hangarShips -= 1;
  world.reboards += 1;
  const lostHull = revertFlagshipToStarter(world);
  if (lostHull) world.hullLossTick = { ...(world.hullLossTick ?? {}), [world.currentSystemId]: world.tick };
  noteCombat(world, false, exp, 0);
  const hullNote = lostHull ? ' · 기본 프리깃으로 재탑승' : '';
  // A-9b(R5): 실기 격침 = 생존포드로 거점 귀환(playerSurvivalPod.ts:147-188, 연료 없음). 트윈 반영은 POD_RETURN_HOME(기본 OFF).
  // 장착은 preservedEquipSlots 로 남았다가 다음 전함 탑승 때 복원(applyNpcCapitalShipPurchase.ts:62-71, PB-G6) → 트윈 장착 유지가 맞다.
  const homeNote = returnHomeAfterDestroy(world);
  return ev(
    world,
    'DESTROY',
    `${slot.labelKo} ${reason} 전함 파괴 tcl${slot.tcl} +${exp}exp 격파 ${pay.killed}/${pay.fleet} → 격납고 재탑승 (잔 ${world.hangarShips}/${world.hangarMax} · 재탑승 ${world.reboards})${hullNote}${homeNote}`,
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

/** 함선 자금이 모자란 채 연속 수련이 이만큼 쌓이면 교역로를 먼저 본다. */
export const TRAIN_STREAK_CAP = 16;

/**
 * 수련·유랑은 승률 공정선 미만이면 굴리지 않는다. 기대 경험치가 가장 큰 공정 전장으로 가거나 번다.
 * 유료 함선을 탄 채로는 경험치가 목적이 아닌 자금·유랑 전투를 하지 않는다 (패배 시 기함 상실).
 */
export function trainOrRelocate(world: WorldState, rng: Rng, reason: string): JournalEntry {
  useHopRng(rng);
  if (world.tgRun) {
    const run = tgRunStep(world, 0);
    if (run) return run;
  }
  if ((world.trainStreak ?? 0) >= TRAIN_STREAK_CAP && needsHullFund(world)) {
    world.trainStreak = 0;
    return tgRunStep(world) ?? mineOrSellFund(world);
  }
  if (reason !== '수련' && currentHullValue(world) > 0) return tgRunStep(world) ?? mineOrSell(world);
  const card = currentPlayIntelligence();
  // 공정 교전 확인이 꺼져 있어도 산 함선이면 승률을 본다(격침 = 함선 상실)
  void card; // 공정 교전 판단은 fightHere 관문(fightAllowed)이 한다
  const pick = bestTrainPlanet(world);
  if (pick && pick !== world.currentPlanetId && canPayRoute(world, pick)) return travelOneHop(world, pick, true, GROWTH_HOP_RISK_MAX);
  const slot = world.planets[world.currentPlanetId];
  if (slot && winChance(world, slot.tcl) >= fairLine(world)) return trainFight(world, rng, reason);
  const fair = fairFightPlanet(world);
  if (fair && fair !== world.currentPlanetId && canPayRoute(world, fair)) return travelOneHop(world, fair, true, GROWTH_HOP_RISK_MAX);
  return mineOrSell(world);
}

function trainFight(world: WorldState, rng: Rng, reason: string): JournalEntry {
  world.trainStreak = (world.trainStreak ?? 0) + 1;
  return fightHere(world, rng, reason);
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

/** 성장 이동은 항로 전체 연료가 있을 때만 — 한 홉 값만 들고 떠나면 중간에 갇혀 연료만 태운다 */
function canPayRoute(world: WorldState, destPlanetId: string): boolean {
  const destSys = lookupSystemId(destPlanetId);
  if (!destSys) return false;
  return world.credits >= routeFuelCredits(world, destSys);
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
  if (outcome.kind === 'item' && sellableCargo(world) < mineCap()) {
    addOre(world, rollMiningDropGoodId(world.currentPlanetId, hopRng()));
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
    const cargo = sellableCargo(world);
    if (cargo > 0 && lookupHasTrade(here)) return sellCargo(world);
    if (cargo >= mineCap()) {
      const hub = nearestTradePlanet(here);
      if (hub && hub !== here && canPayHop(world, hub)) return travelOneHop(world, hub, false);
      return salvageOnce(world);
    }
    return mineOnce(world);
  }
  if (sellableCargo(world) > 0 && lookupHasTrade(here)) return sellCargo(world);
  return salvageOnce(world);
}

function mineOnce(world: WorldState): JournalEntry {
  // 매도 주기는 강화 몫을 뺀 적재로 센다(A-11)
  const cargo = sellableCargo(world);
  const cap = mineCap();
  if (cargo >= cap) return sellCargo(world);
  // 실기 확률 채굴(존 풀 · 주력/부가) — 광물 종류별로 쌓아 강화 비용에 쓴다(A-11)
  addOre(world, rollMiningDropGoodId(world.currentPlanetId, hopRng()));
  noteObs(world, 'mine', obsDetail.mine(world.currentPlanetId, 'ore'));
  return ev(world, 'MINE', `궤도 채굴 1 · 적재 ${world.mineralCargo}/${cap}`);
}

/**
 * 실기 거래 수수료 → 팩션 금고(applyPlanetTradeTransactionFee) — 블루 점유 행성에서 거래하면 총액의 5%가 블루 금고로.
 * 편입(8000/회) 재원이 이 경로로만 쌓인다. 플레이어 가격은 기존 트윈 시세 그대로(금고 적립만 반영).
 */
function noteTradeFee(world: WorldState, gross: number): void {
  const slot = world.planets[world.currentPlanetId];
  if (!slot || paintOf(slot) !== 'BLUE' || gross <= 0) return;
  world.blueVault += computePlanetTradeFeeBreakdown(gross).arcImmediateShare;
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
  // A-11 강화에 쓸 광물은 남긴다 — 전부 강화 몫이면 팔지 않고 채굴을 이어 간다
  let ore = pickOreToSell(world);
  if (!ore) {
    if (sellableCargo(world) < mineCap()) return mineOnce(world);
    // 적재가 가득한데 전부 강화 몫이면 가장 많은 광물을 판다(교착 방지)
    const cargo = world.oreCargo ?? {};
    ore = Object.keys(cargo).sort((a, b) => (cargo[b] ?? 0) - (cargo[a] ?? 0))[0] ?? 'legacy';
  }
  removeSoldOre(world, ore);
  world.mineralCargo -= 1;
  world.credits += unit;
  noteTradeFee(world, unit);
  world.trades += 1;
  noteObs(world, 'trade', obsDetail.trade('sell', world.currentPlanetId));
  clearHoldStreak(world);
  return ev(world, 'TRADE', `채굴 매도 ${ore} +${unit}cr · 잔 ${world.credits} · 적재 ${world.mineralCargo}`);
}

/** 함선 자금 — 실기 광물 매도가. */
function mineOrSellFund(world: WorldState): JournalEntry {
  if (sellableCargo(world) >= mineCap()) {
    return sellCargoAt(world, liveMineralUnitPrice(world.currentPlanetId, world.level));
  }
  return mineOnce(world);
}

const hopLossBySystem = new Map<string, number>();
let hopLossKey = '';

/** 이 성계로 들어갈 때 조우해서 질 확률. 하루·함선·레벨·퀘스트가 바뀌면 다시 잰다. */
function hopLossChance(world: WorldState, systemId: string): number {
  const key = `${world.runId}|${world.day}|${world.hullRank ?? 0}|${world.level}|${world.activeQuest?.missionId ?? ''}`;
  if (key !== hopLossKey) {
    hopLossBySystem.clear();
    hopLossKey = key;
  }
  const cached = hopLossBySystem.get(systemId);
  if (cached !== undefined) return cached;
  let loss = 0;
  const encounter = transitEncounterChance(world, systemId);
  const planet = lookupPrimaryPlanet(systemId);
  if (encounter > 0 && planet) {
    const tcl = world.planets[planet]?.tcl ?? world.level;
    loss = encounter * (1 - winChance(world, tcl, planet));
  }
  hopLossBySystem.set(systemId, loss);
  return loss;
}

/** from→to 를 지나며 잃을 기대 손실(cr) — 산 함선 값 + 실은 화물 값. 기본 프리깃·빈 화물이면 0. */
function routeLossRisk(world: WorldState, fromPlanetId: string, toPlanetId: string, cargoValue = 0): number {
  const value = currentHullValue(world) + cargoValue;
  if (value <= 0) return 0;
  let sys = lookupSystemId(fromPlanetId);
  const dest = lookupSystemId(toPlanetId);
  if (!sys || !dest) return 0;
  let keep = 1;
  for (let guard = 0; sys !== dest && guard < 32; guard += 1) {
    const next = bfsNextSystem(sys, dest);
    if (!next) break;
    keep *= 1 - hopLossChance(world, next);
    sys = next;
  }
  return Math.round(value * (1 - keep));
}

/**
 * 교역 이동 홉 상한 — 교역은 돈 엔진이라 기대값(순익 − 함선·화물 기대 손실)으로 고르되,
 * 한 홉 위험이 이보다 큰 항로는 고르지 않는다(사 놓고 못 가는 화물·반복 격침 방지). 트윈 행동 상수.
 */
const TRADE_HOP_RISK_MAX = 0.2;

/** 교역 이동 상한 — 산 함선이면 「급하지 않은 이동」(도전 없음 · 0.03 미만)으로 넘겨 hopAllowed 가 함선 상한을 건다 */
function tradeTravelCap(world: WorldState): number {
  return hullAtStake(world) ? HOP_RISK_MAX : TRADE_HOP_RISK_MAX;
}

/** 교역은 도전 대상이 아니다 — 산 함선이면 평소 상한 안의 항로만(도전 홉 없음) */
function tradeHopCap(world: WorldState): number {
  if (!hullAtStake(world)) return TRADE_HOP_RISK_MAX;
  // hopAllowed 의 「급하지 않은 이동」 상한과 같게 — 고른 항로를 실제로 갈 수 있어야 한다
  return Math.min(HULL_HOP_RISK_MAX, OPTIONAL_TRIP_LOSS_CR / currentHullValue(world));
}

function routeHasRiskyHop(world: WorldState, fromPlanetId: string, toPlanetId: string): boolean {
  let sys = lookupSystemId(fromPlanetId);
  const dest = lookupSystemId(toPlanetId);
  if (!sys || !dest) return false;
  for (let guard = 0; sys !== dest && guard < 32; guard += 1) {
    const next = bfsNextSystem(sys, dest);
    if (!next) break;
    if (systemRisk(world, next) > tradeHopCap(world)) return true;
    sys = next;
  }
  return false;
}

function pickSafeTgPlan(world: WorldState) {
  return pickTgPlan(world, CASH_FLOOR * 2, (from, to, cargoValue) =>
    routeHasRiskyHop(world, from, to) ? Infinity : routeLossRisk(world, from, to, cargoValue));
}

/**
 * tg_* 교역로 한 걸음. 실은 화물이 있으면 수요지로, 없으면 홉당 순익이 채굴보다 나은 교역로를 고른다.
 * 산 함선이면 경로에서 잃을 기대 손실을 순익에서 뺀다. 할 일이 없으면 null.
 */
function tgRunStep(world: WorldState, minProfit = 0): JournalEntry | null {
  let run = world.tgRun;
  if (!run) {
    const plan = pickSafeTgPlan(world);
    if (!plan || plan.profit < minProfit) return null;
    if (plan.profit / plan.hops < liveMineralUnitPrice(world.currentPlanetId, world.level) * 2) return null;
    const r = plan.route;
    run = { goodId: r.goodId, supply: r.supply, demand: r.demand, qty: 0, costUnit: r.costUnit, sellNetUnit: r.netUnit + r.costUnit };
    world.tgRun = run;
  }
  if (run.qty === 0) {
    if (world.currentPlanetId !== run.supply) return travelOneHop(world, run.supply, true, tradeTravelCap(world));
    const plan = pickSafeTgPlan(world);
    const qty = plan && plan.route.goodId === run.goodId && plan.route.supply === run.supply ? plan.qty : 0;
    if (qty <= 0) {
      world.tgRun = undefined;
      return null;
    }
    world.credits -= qty * run.costUnit;
    noteTradeFee(world, qty * run.costUnit);
    run.qty = qty;
    noteTgBought(world, plan!.route, qty);
    world.trades += 1;
    noteObs(world, 'trade', obsDetail.trade('buy', world.currentPlanetId));
    clearHoldStreak(world);
    return ev(world, 'TRADE', `교역 매입 ${run.goodId} ×${qty} -${qty * run.costUnit}cr → ${run.demand} (잔 ${world.credits})`);
  }
  if (world.currentPlanetId !== run.demand) return travelOneHop(world, run.demand, true, tradeTravelCap(world));
  const gain = run.qty * run.sellNetUnit;
  world.credits += gain;
  noteTradeFee(world, gain);
  world.trades += 1;
  noteObs(world, 'trade', obsDetail.trade('sell', world.currentPlanetId));
  world.tgRun = undefined;
  world.trainStreak = 0;
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
  if (sellableCargo(world) >= mineCap()) return sellCargo(world);
  return mineOnce(world);
}

/** 부족하면 퀘스트, 그다음 채굴·매도. 그 한 바퀴로 개발비까지 못 메우면 보석 지갑에서 크레딧을 산다. */
export function earnCredits(world: WorldState, rng: Rng): JournalEntry {
  useHopRng(rng);
  if (world.hangarShips <= 0 && world.tick % 4 === 0) return restockInsteadOfFight(world);
  if (world.activeQuest || nextPlayableMissionId(world)) {
    const row = doQuest(world, rng, true, true);
    if (!row.line.includes('레벨게이트')) return row;
    return trainOrRelocate(world, rng, '수련');
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

/**
 * 정복 유지(N1 · 대표님 2026-10-10 「점령지를 늘려 수도까지」) — 사람처럼 지키는 행성에 방위위성을 놓고 올린다.
 * 대상 = 적(레드)과 맞닿은 아군 행성 중 위성 레벨이 가장 낮은 곳(같으면 가까운 곳).
 * 비용 = 실기 planet_defense_satellite_level_policy.csv(설치·업그레이드). 다음 함선 자금은 남긴다.
 * 트윈 단순화: 업그레이드 소요 시간(upgradeDurationSec)은 생략 — 착륙 시 즉시 반영.
 */
const SAT_LEVEL_ROWS = PlanetDefenseSatelliteLevelPolicy_FROM_BALANCE_CSV;
/**
 * 봇이 올리는 위성 상한 — L6(누적 약 80만)까지는 비용 대비 효과(중립화 −11%~−35%)가 크고,
 * L7부터는 단계당 110만·360만…으로 돈만 빨아들인다(벤치: 530만을 위성에 쓰고 주요 아군 2). 트윈 행동 상수.
 */
const SAT_MAX_LEVEL = Math.min(6, SAT_LEVEL_ROWS.reduce((m, r) => Math.max(m, Number(r.level)), 1));
const FORTIFY_CASH_FLOOR = 200_000;

function satStepCost(level: number): number {
  if (level <= 0) return SAT_COST;
  const row = SAT_LEVEL_ROWS.find((r) => Number(r.level) === level + 1);
  return row ? Number(row.upgradeCostCredits) : Infinity;
}

/** 위성에 쓸 수 있는 돈 — 다음 함선 자금(모으는 구간이면)과 바닥 자금을 뺀 나머지 */
function fortifyBudget(world: WorldState): number {
  const next = nextHullStep(world);
  // 첫 함선을 사기 전에는 함선 값을 늘 남기고(초반 성장 우선), 그 뒤에는 다음 등급 8레벨 전부터만 남긴다
  const saving = next && next.price > 0 && ((world.hullRank ?? 0) <= 0 || world.level >= next.levelReq - 8);
  const hullReserve = saving ? next!.price + 800 : 0;
  return world.credits - hullReserve - FORTIFY_CASH_FLOOR;
}

function redAdjacent(world: WorldState, systemId: string): boolean {
  const adj = listAdjacentSystemIds(systemId);
  for (const id of Object.keys(world.planets)) {
    const s = world.planets[id];
    if (adj.includes(s.systemId) && paintOf(s) === 'RED') return true;
  }
  return false;
}

let fortifyKey = '';
let fortifyPick: string | null = null;
export function pickFortifyPlanet(world: WorldState): string | null {
  const key = `${world.day}|${Math.floor(world.credits / 5000)}|${world.satInstalls}`;
  if (key === fortifyKey) return fortifyPick;
  fortifyKey = key;
  fortifyPick = null;
  const budget = fortifyBudget(world);
  if (budget <= 0) return null;
  let bestLv = 1e9;
  let bestH = 1e9;
  for (const id of Object.keys(world.planets)) {
    const slot = world.planets[id];
    if (!slot.combatEnabled || slot.occupierClanId !== BLUE_CLAN) continue;
    if (slot.satLevel >= SAT_MAX_LEVEL || satStepCost(slot.satLevel) > budget) continue;
    if (!redAdjacent(world, slot.systemId)) continue;
    const h = hopsBetween(world.currentSystemId, slot.systemId);
    if (slot.satLevel < bestLv || (slot.satLevel === bestLv && h < bestH)) {
      bestLv = slot.satLevel;
      bestH = h;
      fortifyPick = id;
    }
  }
  return fortifyPick;
}

function doFortify(world: WorldState, dest: string): JournalEntry {
  // 위성 보강은 급하지 않은 이동 — 떠돌기 상한(도전 없음)
  if (world.currentPlanetId !== dest) return travelOneHop(world, dest, true, HOP_RISK_MAX);
  const slot = world.planets[dest];
  const cost = satStepCost(slot.satLevel);
  if (!slot || cost > fortifyBudget(world)) return markHold(world, 'sat_broke', `위성 ${cost}cr 부족`);
  world.credits -= cost;
  slot.satLevel += 1;
  world.satInstalls += 1;
  fortifyKey = '';
  noteObs(world, 'develop', obsDetail.develop(slot.satLevel === 1 ? 'install' : 'upgrade', 'defense_satellite', dest));
  clearHoldStreak(world);
  return ev(world, 'SAT', `${slot.labelKo} 방위위성 L${slot.satLevel} ${slot.satLevel === 1 ? '설치' : '업그레이드'} -${cost}cr (정복 유지)`);
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

/**
 * 정복 목표(대표님 2026-10-10 「적정 레벨에 모든 행성 정복」 · A안 「쉬운 목표부터」) —
 * 도전 가능한(승률 ≥ 50:50) 적 행성 중 **지금 이길 확률이 가장 높은** 곳. 같으면 가까운 곳.
 * tcl 로 고르면 안 된다 — 행성별 적 편성이 달라 tcl 9 드라코가 승률 0.15, tcl 12 뉴에덴이 1.00 이다.
 * 크림슨 수도는 수도 공략 준비(isCapitalAssaultReady)가 됐을 때만 같은 사다리에 오른다.
 */
let conquestKey = '';
let conquestPick: string | null = null;
function pickConquestRed(world: WorldState): string | null {
  const key = `${playerCombatSigForConquest(world)}|${world.day}`;
  // 캐시한 목표가 이미 레드가 아니면(중립화했거나 넘어감) 다시 고른다
  const cached = conquestPick ? world.planets[conquestPick] : undefined;
  if (key === conquestKey && (!conquestPick || (cached && paintOf(cached) === 'RED'))) return conquestPick;
  conquestKey = key;
  conquestPick = null;
  const policy = resolveStelliumAnnexPolicy();
  const capitalReady = isCapitalAssaultReady(world);
  const holds = toHolds(world);
  // 아군과 맞닿은 적 행성 우선 — 중립화 뒤 편입(아군 인접 필수)까지 이어져 영토로 남는다(사람: 전선을 밀어 넓힌다).
  // 떨어진 적 행성은 중립화해도 편입이 안 돼 다시 레드로 돌아간다(벤치 annex_no_adjacency 19회).
  let bestAdj = false;
  let bestWin = -1;
  let bestH = 1e9;
  for (const id of Object.keys(world.planets)) {
    const slot = world.planets[id];
    if (!slot?.combatEnabled || paintOf(slot) !== 'RED') continue;
    const isCapital = id === CRIMSON_CAPITAL_PLANET_ID;
    if (isCapital ? !capitalReady : (CORE_PLANET_SET.has(id) || policy.excludePlanetIds.has(id))) continue;
    if (!canChallenge(world, id, slot.tcl, isCapital ? '수도' : '전선')) continue;
    const adj = isCapital || hasStelliumAnnexFriendlyAdjacency(slot.systemId, holds);
    const win = winChance(world, slot.tcl, id);
    const h = hopsBetween(world.currentSystemId, slot.systemId);
    const better = adj !== bestAdj
      ? adj
      : win > bestWin + 0.005 || (Math.abs(win - bestWin) <= 0.005 && h < bestH);
    if (conquestPick == null || better) {
      bestAdj = adj;
      bestWin = win;
      bestH = h;
      conquestPick = id;
    }
  }
  return conquestPick;
}

function playerCombatSigForConquest(world: WorldState): string {
  return `${world.hullShipId}|${world.level}|${world.gearBuys}|${world.learnedSkills.length}|${world.mineralUpgradeCount ?? 0}`;
}

/** 편입 경로 목적지. 편입 가능 중립 → 이길 수 있는 가장 약한 적 행성 → 공정선 이상 전선 순. 없으면 null. */
function pickAnnexTarget(world: WorldState): string | null {
  const neutral = nearestAnnexableNeutral(world);
  if (neutral) return neutral;
  const red = pickConquestRed(world);
  if (red) return red;
  const front = pickFrontTarget(world);
  const slot = world.planets[front];
  // 고정 전선 목록은 레드일 때만 — 떨어진 중립은 편입이 안 된다(아군 인접 필요)
  if (slot && paintOf(slot) === 'RED' && canChallenge(world, front, slot.tcl, '전선')) return front;
  return null;
}

// 의도 선택(intent.ts)에 정복 가능 여부를 순환 import 없이 넘긴다
setConquestProbe((world) => pickAnnexTarget(world) != null);
setFortifyProbe((world) => pickFortifyPlanet(world) != null);

/** 정복 마무리 한 걸음 — 중립화한 행성에 위성 설치 → 편입. 조건이 안 되면 null(풀어 준다). */
function conquestFinishStep(world: WorldState, rng: Rng): JournalEntry | null {
  const focus = world.conquestFocus;
  if (!focus) return null;
  const slot = world.planets[focus.planetId];
  const policy = resolveStelliumAnnexPolicy();
  const ok = slot && world.tick <= focus.untilTick && paintOf(slot) === 'NEUTRAL' && policy.enabled
    && world.blueVault >= policy.costCredits && world.hangarShips > 0
    && hasStelliumAnnexFriendlyAdjacency(slot.systemId, toHolds(world));
  if (!ok) {
    world.conquestFocus = undefined;
    return null;
  }
  world.lastAction = 'annex_path';
  world.actionCounts.annex_path = (world.actionCounts.annex_path ?? 0) + 1;
  if (world.currentPlanetId !== slot.planetId) return travelOneHop(world, slot.planetId);
  if (slot.satLevel < 1) return tryInstallSat(world);
  const row = tryAnnex(world);
  world.conquestFocus = undefined;
  void rng;
  return row;
}

function doAnnexPath(world: WorldState, rng: Rng): JournalEntry {
  const dest = pickAnnexTarget(world);
  if (!dest) return trainOrRelocate(world, rng, '수련');
  const slot = world.planets[dest];
  if (!slot) return markHold(world, 'no_slot', '전선 슬롯 없음');
  const p = paintOf(slot);
  const reason = dest === CRIMSON_CAPITAL_PLANET_ID ? '수도' : '전선';
  // B안 — 적 행성 도전 전에 살 수 있는 강화부터(가는 길에 사는 게 아니라 준비 후 출발)
  if (p === 'RED') {
    const prep = strengthenBeforeChallenge(world, rng, dest, slot.tcl);
    if (prep) return prep;
  }
  if (world.currentPlanetId !== dest) return travelOneHop(world, dest);
  if (!resolveStelliumAnnexPolicy().enabled) return fightHere(world, rng, reason);
  if (p === 'RED' || (p === 'BLUE' && slot.contested && rng() < 0.2)) {
    const before = world.combatWins;
    const row = fightHere(world, rng, reason);
    if (dest === CRIMSON_CAPITAL_PLANET_ID && world.combatWins > before) {
      world.capitalDestroyed = true;
      clearHoldStreak(world);
      return ev(world, 'CAPITAL', `크림슨 수도 ${dest} 격파 · ${row.line}`);
    }
    return row;
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

function parkedQuestReady(world: WorldState, quest: ActiveQuest): boolean {
  if ((quest.routeBlockedUntil ?? 0) > world.tick) return false;
  const mission = getMission(quest.missionId);
  if (!mission) return false;
  const obj = mission.objectives[quest.objIndex];
  if (!obj || obj.type !== 'defeat_enemy') return true;
  const dest = questFightPlanet(world, mission, obj, quest);
  const slot = world.planets[dest];
  if (!slot) return false;
  return canChallenge(world, dest, slot.tcl, '퀘스트');
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

/** 퀘스트 이동이 위험 관문에 막히면 하루 보류 — 다른 퀘스트(본편 먼저)를 하다가 다시 도전한다 */
function doQuest(world: WorldState, rng: Rng, preferStory: boolean, allowAlt: boolean): JournalEntry {
  hopBlocked = false;
  const row = doQuestStep(world, rng, preferStory, allowAlt);
  if (hopBlocked && world.activeQuest) {
    world.activeQuest.routeBlockedUntil = world.tick + Math.max(1, world.ticksPerDay);
    world.activeQuest.blockedSince ??= world.tick;
    parkActiveQuest(world);
  }
  hopBlocked = false;
  return row;
}

function doQuestStep(world: WorldState, rng: Rng, _preferStory: boolean, allowAlt: boolean): JournalEntry {
  // 자금 벌이 중 퀘스트를 해도 이동 목적은 퀘스트다(떠돌기 위험 상한으로 막지 않는다)
  world.lastAction = 'quest';
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
    // 퀘스트 전투 = 도전(승률 50:50 · 같은 도전 파괴 20회 한도 · 파괴 뒤 우회)
    if (!fightSlot || !canChallenge(world, fightPlanet, fightSlot.tcl, '퀘스트')) {
      addFlag(world, `quest_combat_bypass:${m.id}`);
      world.lastHoldReason = 'quest_combat_bypass';
      parkActiveQuest(world);
      return doQuest(world, rng, _preferStory, allowAlt);
    }
    world.trainPlanetId = '';
    world.trainMissionId = '';
    const prep = strengthenBeforeChallenge(world, rng, fightPlanet, fightSlot.tcl);
    if (prep) return prep;
    if (world.currentPlanetId !== fightPlanet) {
      return travelOneHop(world, fightPlanet);
    }
    markQuestPlanet(world, fightPlanet);
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
  if (needsHullFund(world) && !forceBuy) return tgRunStep(world) ?? mineOrSellFund(world);
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
    noteTradeFee(world, TRADE_BUY);
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
  noteTradeFee(world, TRADE_SELL);
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
    // 정복 사다리의 다음 목표로 — 없으면 수련장(이길 수 없는 고정 전선으로는 가지 않는다)
    const target = pickAnnexTarget(world);
    if (target) return travelOneHop(world, target);
    const train = bestTrainPlanet(world);
    if (train) return travelOneHop(world, train);
    return trainOrRelocate(world, hopRng, '수련');
  }
  return travelOneHop(world, world.focusPlanetId || FOCUS_PLANET_ID);
}

/**
 * 수도 의도 = 정복 사다리(A안). 고정 수도 경로의 50:50 전선이 산 함선 상실 1위였다 —
 * 이길 확률이 가장 높은 적 행성부터 먹어 들어가고, 수도는 공략 준비가 되면 같은 사다리에서 고른다.
 */
function doCapital(world: WorldState, rng: Rng): JournalEntry {
  return doAnnexPath(world, rng);
}

/** 목표 광물 강화에 모자란 광물 — 크레딧은 있는데 광물이 없을 때만(돈이 없으면 광물보다 돈이 먼저) */
function neededUpgradeOre(world: WorldState): string | null {
  const target = mineralUpgradeTarget(world);
  if (!target || target.affordable) return null;
  if (world.credits < target.cost.credits + 800) return null;
  for (const c of target.cost.ores) {
    if (oreCount(world, c.oreId) < c.qty) return c.oreId;
  }
  return null;
}

/** 행성 채굴 풀 — 실기 확률 채굴(존 풀 70% 주력 · 30% 부가)을 굴림 값으로 훑어 캐시 */
const orePoolCache = new Map<string, Set<string>>();
function planetOrePool(planetId: string): Set<string> {
  let pool = orePoolCache.get(planetId);
  if (!pool) {
    pool = new Set<string>();
    for (const r of [0, 0.72, 0.78, 0.84, 0.9, 0.96, 0.999]) pool.add(rollMiningDropGoodId(planetId, r));
    orePoolCache.set(planetId, pool);
  }
  return pool;
}

function planetDropsOre(planetId: string, oreId: string): boolean {
  return planetOrePool(planetId).has(oreId);
}

/** 그 광물이 주력(70%)인 채굴 행성 우선, 없으면 부가로 나오는 곳 — 안전 항로 기준 가까운 곳 */
function nearestOreSite(world: WorldState, oreId: string): string | null {
  let best: string | null = null;
  let bestScore = 1e9;
  for (const id of Object.keys(world.planets)) {
    if (!planetHasMineableOrbitalDeposits(id) || !planetDropsOre(id, oreId)) continue;
    const slot = world.planets[id];
    if (routeHasRiskyHop(world, world.currentPlanetId, id)) continue;
    const primary = rollMiningDropGoodId(id, 0) === oreId;
    const score = hopsBetween(world.currentSystemId, slot.systemId) + (primary ? 0 : 4);
    if (score < bestScore) {
      bestScore = score;
      best = id;
    }
  }
  return best;
}

function doGear(world: WorldState, rng: Rng): JournalEntry {
  const market = hullMarketPlanet(world);
  // 함선·장비 구매 이동은 목적 있는 이동(벽을 넘을 힘을 사러 간다)
  if (market && market !== world.currentPlanetId) return travelOneHop(world, market, true, PURPOSE_HOP_RISK_MAX);
  const hullLine = tryBuyNextHull(world);
  if (hullLine) {
    clearHoldStreak(world);
    return ev(world, 'GEAR', hullLine);
  }
  // A-11: 모은 광물로 지금 함선 강화(조선소). 크레딧을 쓰지 않으니 장비 구매보다 먼저 본다.
  if (canMineralUpgrade(world)) {
    if (lookupHasShipyard(world.currentPlanetId)) {
      const up = applyMineralUpgrade(world);
      if (up) {
        clearHoldStreak(world);
        return ev(world, 'GEAR', up);
      }
    } else {
      const yard = nearestShipyardPlanet(world);
      if (yard && yard !== world.currentPlanetId && canPayHop(world, yard)) return travelOneHop(world, yard, true, PURPOSE_HOP_RISK_MAX);
    }
  }
  // A-9a(R1): 함선 자금보다 값진 무기·장비가 있으면 그것부터. bestAffordableGear 가 함선 상승÷가격과 비교한다.
  const gearPending = canBuyBetterGear(world);
  // 살 장비가 없을 때만 강화 광물 채굴 — 장비 구매를 밀어내지 않는다.
  // 모자란 광물이 나오는 행성에서 캔다(사람: 필요한 광물 산지로 간다). 여기서 안 나오면 산지로 이동.
  // 산지 원정은 산 함선을 지킬 때만 — 기본 프리깃 초반에는 착륙지 채굴로 충분(원정이 초반 성장을 늦춘다)
  const ore = !gearPending && hullAtStake(world) ? neededUpgradeOre(world) : null;
  if (ore) {
    if (planetDropsOre(world.currentPlanetId, ore) && planetHasMineableOrbitalDeposits(world.currentPlanetId)) return mineOnce(world);
    const site = nearestOreSite(world, ore);
    if (site && site !== world.currentPlanetId && canPayRoute(world, site)) {
      return travelOneHop(world, site, true, HOP_RISK_MAX);
    }
  }
  if (!gearPending && mineralUpgradeTarget(world) && planetHasMineableOrbitalDeposits(world.currentPlanetId)) {
    return mineOnce(world);
  }
  if (!gearPending && needsHullFund(world)) return earnForShip(world, rng);
  const slot = world.planets[world.currentPlanetId];
  if (!slot?.hasTrade && !lookupHasTrade(world.currentPlanetId)) {
    if (gearPending) {
      const hub = nearestTradePlanet(world.currentPlanetId);
      if (hub && hub !== world.currentPlanetId && canPayHop(world, hub)) return travelOneHop(world, hub, true, PURPOSE_HOP_RISK_MAX);
    }
    return doTrade(world, rng, false);
  }
  const row = tryBuyBestGear(world, (kind, line) => ev(world, kind, line));
  if (row.kind === 'GEAR' && !row.line.includes('없음')) clearHoldStreak(world);
  return row;
}

function doDevelop(world: WorldState, rng: Rng): JournalEntry {
  const fort = pickFortifyPlanet(world);
  if (fort) return doFortify(world, fort);
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
  // 정복 마무리(위성 → 편입)가 걸려 있으면 다른 의도보다 먼저 — 중간에 떠나면 NPC 가 다시 가져간다
  const finish = conquestFinishStep(world, rng);
  if (finish) return finish;
  if (
    world.earlyFeelClosed &&
    needsHullFund(world) &&
    kind !== 'skill' &&
    kind !== 'gear' &&
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
