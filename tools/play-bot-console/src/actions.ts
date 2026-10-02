import {
  evaluateStelliumAnnexEligibility,
  hasStelliumAnnexFriendlyAdjacency,
} from '../../../src/arcCore/annex/stelliumAnnexEligibility';
import { resolveStelliumAnnexPolicy } from '../../../src/arcCore/annex/stelliumAnnexPolicy';
import type { Rng } from './rng';
import type { JournalEntry, PersonaId, WorldState } from './types';
import { BLUE_CLAN, NEUTRAL_CLAN } from './types';
import { getPreferSell } from './policy';
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
  fightPowerBonus,
  markQuestPlanet,
  nearestFightablePlanet,
  nextPlayableMissionId,
  questFightPlanet,
  tryBuyBestGear,
  tryDevelopFocus,
  tryLearnSkill,
} from './progress';
import { addExp, addFlag, markMissionDone, moveTo, paintOf, toHolds } from './world';
import { nudgeFocusStat } from './facilityTwin';

const FRONT_TARGETS = [
  'sirius_border',
  'perseus_memorial',
  'omega_hub',
  'helios_core',
  'titan_ruins',
  'draco_haven',
] as const;

const SAT_COST = 1500;
const TRADE_BUY = 420;
const TRADE_SELL = 310;
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

function travelOneHop(world: WorldState, destPlanetId: string): JournalEntry {
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
  moveTo(world, hopPlanet);
  clearHoldStreak(world);
  const left = hopsBetween(world.currentSystemId, destSys);
  if (left === 0 || hopPlanet === destPlanetId) {
    return landLine(world, hopPlanet);
  }
  return ev(world, 'TRAVEL', `${hopPlanet} 경유 → ${destPlanetId} (잔여 ${left}홉)`);
}

function landLine(world: WorldState, planetId: string): JournalEntry {
  const restock = restockHangarIfYard(world);
  const extra = restock ? ` · 격납고 보충 ${world.hangarShips}/${world.hangarMax}` : '';
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

function winChance(world: WorldState, tcl: number): number {
  const raw = 0.46 + (world.level - tcl) * 0.055 + fightPowerBonus(world);
  return Math.max(0.16, Math.min(0.92, raw));
}

export function fightHere(world: WorldState, rng: Rng, reason: string): JournalEntry {
  if (world.hangarShips <= 0) return restockInsteadOfFight(world);
  const slot = world.planets[world.currentPlanetId];
  if (!slot) return markHold(world, 'no_slot', '현재 행성 슬롯 없음');
  if ((reason === '수련' || reason === '유랑') && slot.tcl > world.level + 8) {
    const alt = nearestFightablePlanet(world);
    if (alt && alt !== world.currentPlanetId) return travelOneHop(world, alt);
  }
  const questOrbit = reason === '퀘스트' || reason === '수련';
  if (!slot.combatEnabled && !questOrbit) {
    const alt = nearestFightablePlanet(world);
    if (alt && alt !== world.currentPlanetId) return travelOneHop(world, alt);
    return ev(world, 'TRAVEL', `${slot.labelKo} 점령전투 OFF → 전선 탐색`);
  }
  const p = paintOf(slot);
  const chance = winChance(world, slot.tcl);
  const win = rng() < chance;
  const exp = win ? 80 + slot.tcl * 12 : 18 + slot.tcl * 2;
  const cr = win ? 180 + slot.tcl * 22 : 0;
  const leveled = addExp(world, exp);
  if (win) {
    world.combatWins += 1;
    world.credits += cr;
    if (p === 'RED' || p === 'BLUE') {
      slot.occupierClanId = NEUTRAL_CLAN;
      slot.kind = 'neutral';
      slot.neutralizedAt = world.nowMs;
    }
    clearHoldStreak(world);
    void leveled;
    return ev(
      world,
      'COMBAT',
      `${slot.labelKo} ${reason} 승 tcl${slot.tcl} ${(chance * 100) | 0}% +${exp}exp +${cr}cr → 중립`,
    );
  }
  world.combatLosses += 1;
  world.shipDestroys += 1;
  addExp(world, exp);
  if (world.hangarShips > 0) {
    world.hangarShips -= 1;
  }
  world.reboards += 1;
  return ev(
    world,
    'DESTROY',
    `${slot.labelKo} ${reason} 전함 파괴 tcl${slot.tcl} +${exp}exp → 격납고 재탑승 (잔 ${world.hangarShips}/${world.hangarMax} · 재탑승 ${world.reboards})`,
  );
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

function doAnnexPath(world: WorldState, rng: Rng): JournalEntry {
  if (!resolveStelliumAnnexPolicy().enabled) {
    const dest = pickFrontTarget(world);
    if (world.currentPlanetId !== dest) return travelOneHop(world, dest);
    return fightHere(world, rng, '전선');
  }
  const dest = pickFrontTarget(world);
  if (world.currentPlanetId !== dest) return travelOneHop(world, dest);
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
  clearHoldStreak(world);
  return ev(world, 'QUEST', `수락 ${id} 「${m.title}」`);
}

function doQuest(world: WorldState, rng: Rng, _preferStory: boolean, allowAlt: boolean): JournalEntry {
  if (!world.activeQuest) {
    const next = nextPlayableMissionId(world);
    if (!next) return ev(world, 'QUEST', '수행 가능 퀘스트 소진 · 수도·개발로');
    if (!world.earlyFeelClosed && world.questCleared >= 1) {
      return ev(world, 'QUEST', '초반 3분 서사 유지 · 다음 본편은 레벨 이후');
    }
    const accepted = acceptMission(world, next, allowAlt);
    if (accepted.kind === 'QUEST' && accepted.line.includes('레벨게이트')) {
      if (!world.earlyFeelClosed) return accepted;
      return fightHere(world, rng, '수련');
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
      markMissionDone(world, m.id);
      world.activeQuest = null;
      clearHoldStreak(world);
      addFlag(world, `skip_placeholder:${obj.targetId}`);
      return ev(world, 'QUEST', `스킵 ${m.id} · 미해석 ${obj.targetId}`);
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
      markQuestPlanet(world, world.currentPlanetId);
      clearHoldStreak(world);
      return ev(world, 'QUEST', `세부 ${obj.id} 인접성계 도착`);
    }
    if (obj.type === 'reach_planet' && obj.targetId === DISCOVERY_PLANET_PLACEHOLDER) {
      const origin = world.questOriginSystemId || world.currentSystemId;
      if (!world.questOriginSystemId) world.questOriginSystemId = origin;
      const originPlanet = lookupPrimaryPlanet(origin);
      const hop = discoveryHopPlanet(origin, originPlanet ?? undefined);
      if (!hop) return markHold(world, 'no_discovery', '탐사 행성 없음');
      if (world.currentPlanetId !== hop) return travelOneHop(world, hop);
      world.activeQuest.objIndex += 1;
      markQuestPlanet(world, hop);
      clearHoldStreak(world);
      return ev(world, 'QUEST', `세부 ${obj.id} 탐사거점 도착`);
    }
    if (obj.type === 'reach_planet' && world.currentPlanetId !== dest) return travelOneHop(world, dest);
    if (obj.type === 'reach_system' && world.currentSystemId !== obj.targetId) return travelOneHop(world, dest);
    world.activeQuest.objIndex += 1;
    markQuestPlanet(world, dest);
    clearHoldStreak(world);
    return ev(world, 'QUEST', `세부 ${obj.id} 도착`);
  }
  if (obj.type === 'talk_npc' || obj.type === 'deliver_cargo' || obj.type === 'collect_item') {
    if (dest && world.currentPlanetId !== dest) return travelOneHop(world, dest);
    world.activeQuest.objIndex += 1;
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
      world.credits += TRADE_SELL;
      world.trades += 1;
      return ev(world, 'TRADE', `매입 자금 마련 매도 +${TRADE_SELL} (잔 ${world.credits})`);
    }
    world.credits -= price;
    world.trades += 1;
    world.questBuyCount += 1;
    clearHoldStreak(world);
    if (world.questBuyCount >= need) {
      world.activeQuest.objIndex += 1;
      world.questBuyCount = 0;
      markQuestPlanet(world, hub);
      return ev(world, 'QUEST', `세부 ${obj.id} 매입 ${need}회 완료`);
    }
    return ev(world, 'TRADE', `${obj.targetId} 매입 ${world.questBuyCount}/${need} -${price} (잔 ${world.credits})`);
  }
  if (obj.type === 'defeat_enemy') {
    if (dest && world.currentPlanetId !== dest) {
      return travelOneHop(world, dest);
    }
    markQuestPlanet(world, dest);
    const before = world.combatWins;
    const row = fightHere(world, rng, '퀘스트');
    if (world.combatWins > before) {
      world.activeQuest.objIndex += 1;
      return ev(world, 'QUEST', `세부 ${obj.id} 격파 · ${row.line}`);
    }
    return row;
  }
  world.activeQuest.objIndex += 1;
  return ev(world, 'QUEST', `세부 ${obj.id} 통과`);
}

function doTrade(
  world: WorldState,
  rng: Rng,
  forceBuy: boolean,
  afterBuy?: () => void,
): JournalEntry {
  const slot = world.planets[world.currentPlanetId];
  if (!slot?.hasTrade) {
    const hub = nearestTradePlanet(world.currentPlanetId);
    if (hub && hub !== world.currentPlanetId) return travelOneHop(world, hub);
    return markHold(world, 'no_trade_hub', '무역소 없음');
  }
  const buy = forceBuy || (getPreferSell() ? rng() < 0.28 : rng() < 0.55);
  if (buy) {
    if (world.credits < TRADE_BUY) {
      world.credits += TRADE_SELL;
      world.trades += 1;
      clearHoldStreak(world);
      return ev(world, 'TRADE', `매입 부족 → 매도 +${TRADE_SELL} (잔 ${world.credits})`);
    }
    world.credits -= TRADE_BUY;
    world.trades += 1;
    afterBuy?.();
    clearHoldStreak(world);
    return ev(world, 'TRADE', `${slot.labelKo} 매입 -${TRADE_BUY} (잔 ${world.credits})`);
  }
  world.credits += TRADE_SELL;
  world.trades += 1;
  clearHoldStreak(world);
  return ev(world, 'TRADE', `${slot.labelKo} 매도 +${TRADE_SELL} (잔 ${world.credits})`);
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

function doTravel(world: WorldState): JournalEntry {
  if (world.hangarShips <= 0) return restockInsteadOfFight(world);
  if (!world.capitalDestroyed) return travelOneHop(world, approachCapitalPlanet(world));
  return travelOneHop(world, world.focusPlanetId || FOCUS_PLANET_ID);
}

function doCapital(world: WorldState, rng: Rng): JournalEntry {
  const dest = approachCapitalPlanet(world);
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
  const slot = world.planets[world.currentPlanetId];
  if (!slot?.hasTrade && !lookupHasTrade(world.currentPlanetId)) {
    return doTrade(world, rng, false);
  }
  const row = tryBuyBestGear(world, (kind, line) => ev(world, kind, line));
  if (row.kind === 'GEAR' && !row.line.includes('없음')) clearHoldStreak(world);
  return row;
}

function doDevelop(world: WorldState): JournalEntry {
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
  let kind = pickStepKind(world, rng, persona);
  if (world.hangarShips <= 0) kind = 'travel';
  else if (world.activeQuest && rng() < 0.48) kind = 'quest';
  completeDueDevJob(world);
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
  if (kind === 'develop') return doDevelop(world);
  if (kind === 'capital') return doCapital(world, rng);
  if (kind === 'combat') {
    const slot = world.planets[world.currentPlanetId];
    if (slot && slot.combatEnabled && (paintOf(slot) === 'RED' || slot.contested)) {
      return fightHere(world, rng, '유랑');
    }
    return travelOneHop(world, approachCapitalPlanet(world));
  }
  if (kind === 'trade') return doTrade(world, rng, false);
  if (kind === 'annex_path') return doAnnexPath(world, rng);
  if (kind === 'colonize') return doColonize(world, rng);
  if (kind === 'travel') return doTravel(world);
  return ev(world, 'HOLD', '대기', { hold: true, reason: 'idle' });
}
