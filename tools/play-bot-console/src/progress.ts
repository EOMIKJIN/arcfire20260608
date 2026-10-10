import type { Mission, MissionObjective } from '../../../src/types';
import type { ActiveQuest, JournalEntry, WorldState } from './types';
import {
  CRIMSON_CAPITAL_PLANET_ID,
  CRIMSON_CAPITAL_SYSTEM_ID,
  DEV_MAX_LEVEL,
  FOCUS_PLANET_ID,
  bfsNextSystem,
  gearScoreOf,
  getMission,
  hopsBetween,
  listGearCandidates,
  listPlayableMissionIds,
  listSkills,
  lookupPrimaryPlanet,
  missionHasUnresolvedPlaceholder,
  lookupTcl,
  objectivePlanetId,
} from './catalog';
import {
  durationTicks,
  nudgeFocusStat,
  pickBalancedDev,
} from './facilityTwin';
import { markSkillLearned, paintOf, sumDevLevels } from './world';
import { gearCreditReserve, hullValuePerCredit, needsHullFund } from './combatEfficiency';
import { playerCombatPower, playerCombatSig } from './liveCombat';
import { noteObs, obsDetail } from './observeVocab';

export function markQuestPlanet(world: WorldState, planetId: string | null | undefined): void {
  if (!planetId || planetId.length === 0) return;
  world.lastQuestPlanetId = planetId;
  if (world.activeQuest) world.activeQuest.lastPlanetId = planetId;
}

export function nearestFightablePlanet(world: WorldState): string | null {
  const ids = Object.keys(world.planets);
  let best: string | null = null;
  let bestScore = 1e9;
  for (let i = 0; i < ids.length; i += 1) {
    const slot = world.planets[ids[i]];
    if (!slot.combatEnabled) continue;
    const p = paintOf(slot);
    if (p !== 'RED' && p !== 'NEUTRAL' && !slot.contested) continue;
    const hops = hopsBetween(world.currentSystemId, slot.systemId);
    const tclGap = Math.abs(slot.tcl - world.level);
    const score = hops * 10 + tclGap;
    if (score < bestScore) {
      bestScore = score;
      best = slot.planetId;
    }
  }
  if (best) return best;
  for (let i = 0; i < ids.length; i += 1) {
    if (world.planets[ids[i]]?.combatEnabled) return ids[i];
  }
  return null;
}

export function questFightPlanet(
  world: WorldState,
  mission: Mission,
  obj: MissionObjective,
  quest: ActiveQuest | null = world.activeQuest,
): string {
  const explicit = objectivePlanetId(obj.type, obj.targetId);
  if (explicit) return explicit;
  // 행성이 안 적힌 격파 목표 — 이 퀘스트의 직전 목표 행성 → 의뢰 행성(전투 가능할 때) → 마지막 퀘스트 행성.
  // 다른 퀘스트의 행성(예: core_prime tcl56)으로 판단하면 보류 퀘스트가 영영 복귀하지 못한다.
  if (quest?.missionId === mission.id && quest.lastPlanetId) return quest.lastPlanetId;
  if (mission.offerPlanetId && world.planets[mission.offerPlanetId]?.combatEnabled) return mission.offerPlanetId;
  if (world.lastQuestPlanetId) return world.lastQuestPlanetId;
  if (world.currentPlanetId) return world.currentPlanetId;
  return mission.offerPlanetId || FOCUS_PLANET_ID;
}

export function nextPlayableMissionId(world: WorldState): string | null {
  const ids = listPlayableMissionIds();
  for (let i = 0; i < ids.length; i += 1) {
    const id = ids[i];
    if (world.completedLookup[id]) continue;
    if (world.parkedQuests.some((row) => row.missionId === id)) continue;
    if (missionHasUnresolvedPlaceholder(id)) continue;
    const m = getMission(id);
    if (!m) continue;
    const prereq = m.prerequisiteIds ?? [];
    let ok = true;
    for (let j = 0; j < prereq.length; j += 1) {
      if (!world.completedLookup[prereq[j]]) {
        ok = false;
        break;
      }
    }
    if (ok) return id;
  }
  return null;
}

export function canLearnAny(world: WorldState): boolean {
  if (world.skillPoints <= 0) return false;
  const skills = listSkills();
  for (let i = 0; i < skills.length; i += 1) {
    const s = skills[i];
    if (world.learnedLookup[s.id]) continue;
    if (world.level < s.levelRequired) continue;
    const pre = s.prerequisiteIds ?? [];
    let ok = true;
    for (let j = 0; j < pre.length; j += 1) {
      if (!world.learnedLookup[pre[j]]) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

type GearCandidate = ReturnType<typeof listGearCandidates>[number];
type GearGain = { g: GearCandidate; gain: number };

/** 장착 후보별 전투력 상승률. 장착·레벨·함선·스킬이 바뀔 때만 다시 잰다(매 틱 intent 호출). */
let gainKey = '';
let gainRows: GearGain[] = [];
/** 이 미만 상승은 전투 가치 없음(센서·채굴 등 승률 무관 장비). */
const GEAR_MIN_GAIN = 0.005;

function gearGains(world: WorldState): GearGain[] {
  const key = playerCombatSig(world);
  if (key === gainKey) return gainRows;
  gainKey = key;
  const base = Math.max(1e-6, playerCombatPower(world));
  const rows = listGearCandidates();
  const out: GearGain[] = [];
  for (let i = 0; i < rows.length; i += 1) {
    const g = rows[i];
    if (g.levelReq > world.level) continue;
    if (world.equipped[g.slot] === g.id) continue;
    const gain = playerCombatPower(world, { equipped: { ...world.equipped, [g.slot]: g.id } }) / base - 1;
    if (gain < GEAR_MIN_GAIN) continue;
    out.push({ g, gain });
  }
  out.sort((a, b) => b.gain - a.gain || a.g.price - b.g.price);
  gainRows = out;
  return out;
}

/**
 * A-9a: 살 수 있는 장비 중 전투력 상승이 가장 큰 것. 예전 점수(등급·가격 가중)는 승률과 무관한 장비도 샀다.
 * 함선 예비금은 목표 함선의 「상승÷가격」이 이 장비보다 클 때만 건다. 장비가 더 값지면 무기·장비 먼저.
 */
/**
 * 함선 자금을 모으는 중(교역로 자금 루프)에는 장비를 사고도 이만큼은 남긴다 = 교역 운전자금.
 * 시작 잔액(seedWorld 5000)과 같은 크기. 없으면 장비로 잔액을 비워 교역로를 못 타고 수련만 반복한다
 * (테스트 「레벨게이트 정체 400틱」에서 교역 매입 0 재현).
 */
const GEAR_TRADE_WORKING_CAPITAL = 5000;

export function bestAffordableGear(world: WorldState): GearCandidate | null {
  const floor = needsHullFund(world) ? GEAR_TRADE_WORKING_CAPITAL : 800;
  const budget = world.credits - floor;
  if (budget < 200) return null;
  const rows = gearGains(world);
  let pick: GearGain | null = null;
  for (let i = 0; i < rows.length; i += 1) {
    if (rows[i].g.price > budget) continue;
    pick = rows[i];
    break;
  }
  if (!pick) return null;
  const hullVpc = hullValuePerCredit(world);
  if (hullVpc > 0 && pick.gain / pick.g.price < hullVpc && world.credits - pick.g.price < gearCreditReserve(world)) {
    return null;
  }
  return pick.g;
}

export function canBuyBetterGear(world: WorldState): boolean {
  return bestAffordableGear(world) != null;
}

export function canDevelop(world: WorldState): boolean {
  if (world.devJob) return true;
  return pickBalancedDev(world) != null;
}

export function tryLearnSkill(world: WorldState, ev: (kind: JournalEntry['kind'], line: string) => JournalEntry): JournalEntry {
  const skills = listSkills();
  let pick = null as (typeof skills)[number] | null;
  // A-9b(R6): 전투 가치(실기 스킬 바인드가 바꾸는 전투력) 큰 순. 같으면 요구 레벨 낮은 순(예전 기준).
  const base = Math.max(1e-6, playerCombatPower(world));
  let pickGain = -1;
  for (let i = 0; i < skills.length; i += 1) {
    const s = skills[i];
    if (world.learnedLookup[s.id]) continue;
    if (world.skillPoints <= 0) break;
    if (world.level < s.levelRequired) continue;
    const pre = s.prerequisiteIds ?? [];
    let ok = true;
    for (let j = 0; j < pre.length; j += 1) {
      if (!world.learnedLookup[pre[j]]) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    const raw = playerCombatPower(world, { skills: [...world.learnedSkills, s.id] }) / base - 1;
    const gain = raw < GEAR_MIN_GAIN ? 0 : raw;
    if (!pick || gain > pickGain || (gain === pickGain && s.levelRequired < pick.levelRequired)) {
      pick = s;
      pickGain = gain;
    }
  }
  if (!pick) {
    return ev('SKILL', `습득 대기 SP${world.skillPoints} / ${world.learnedSkills.length}/${skills.length}`);
  }
  markSkillLearned(world, pick.id);
  noteObs(world, 'skill', obsDetail.skill(pick.id));
  world.skillPoints -= 1;
  world.skillLearned += 1;
  return ev(
    'SKILL',
    `습득 ${pick.name} (${pick.id}) SP잔 ${world.skillPoints} · ${world.learnedSkills.length}/${skills.length}`,
  );
}

export function tryBuyBestGear(
  world: WorldState,
  ev: (kind: JournalEntry['kind'], line: string) => JournalEntry,
): JournalEntry {
  const g = bestAffordableGear(world);
  if (!g) return ev('GEAR', '상위 장비 없음');
  world.credits -= g.price;
  world.equipped[g.slot] = g.id;
  noteObs(world, 'equip', obsDetail.equip(g.slot, g.id));
  world.gearBuys += 1;
  let score = 0;
  const slots = Object.keys(world.equipped);
  for (let i = 0; i < slots.length; i += 1) score += gearScoreOf(world.equipped[slots[i]]);
  world.gearScore = score;
  return ev(
    'GEAR',
    `장착 ${g.name} [${g.slot}] -${g.price}cr 점수 ${Math.round(world.gearScore)} (잔 ${world.credits})`,
  );
}

export function completeDueDevJob(world: WorldState): string | null {
  const job = world.devJob;
  if (!job || world.tick < job.completeTick) return null;
  world.devLevels[job.moduleId] = job.targetLevel;
  world.devUpgrades += 1;
  nudgeFocusStat(world, job.moduleId);
  if (job.moduleId === 'defense_satellite') {
    const slot = world.planets[world.focusPlanetId];
    if (slot) slot.satLevel = Math.max(slot.satLevel, job.targetLevel);
  }
  world.devJob = null;
  return job.labelKo;
}

export function tryDevelopFocus(
  world: WorldState,
  ev: (kind: JournalEntry['kind'], line: string) => JournalEntry,
): JournalEntry {
  const done = completeDueDevJob(world);
  if (done) {
    const sum = sumDevLevels(world);
    return ev('DEVELOP', `${world.focusPlanetId} ${done} 공사 완료 · 합 ${sum}`);
  }
  if (world.devJob) {
    const left = Math.max(0, world.devJob.completeTick - world.tick);
    return ev(
      'DEVELOP',
      `${world.focusPlanetId} ${world.devJob.labelKo} 공사 잔 ${left}틱 → L${world.devJob.targetLevel}`,
    );
  }
  const pick = pickBalancedDev(world);
  if (!pick) return ev('DEVELOP', `${FOCUS_PLANET_ID} 개발 대기 (자금 ${world.credits} · 게이트)`);
  world.credits -= pick.cost;
  noteObs(world, 'develop', obsDetail.develop(pick.level <= 0 ? 'install' : 'upgrade', pick.id, world.focusPlanetId));
  const target = pick.level + 1;
  const ticks = durationTicks(pick.id, target);
  world.devJob = {
    moduleId: pick.id,
    labelKo: pick.labelKo,
    targetLevel: target,
    completeTick: world.tick + ticks,
  };
  const sum = sumDevLevels(world);
  return ev(
    'DEVELOP',
    `${world.focusPlanetId} ${pick.labelKo} L${pick.level}→${target}/${DEV_MAX_LEVEL} 착공 ${ticks}틱 -${pick.cost}cr · 합 ${sum}`,
  );
}

/** L28 이전·저레벨 고기어로 수도 돌격 금지. */
export function isCapitalAssaultReady(world: WorldState): boolean {
  const capTcl = lookupTcl(CRIMSON_CAPITAL_PLANET_ID);
  if (world.level < 28) return false;
  if (world.level + 8 >= capTcl) return true;
  if (world.level >= 36) return true;
  return world.level >= 28 && world.gearScore >= 600;
}

export function approachCapitalPlanet(world: WorldState): string {
  if (isCapitalAssaultReady(world)) return CRIMSON_CAPITAL_PLANET_ID;
  if (world.currentSystemId === CRIMSON_CAPITAL_SYSTEM_ID) {
    const nearby = nearestFightablePlanet(world);
    return nearby && nearby !== CRIMSON_CAPITAL_PLANET_ID ? nearby : world.currentPlanetId;
  }
  const nextSys = bfsNextSystem(world.currentSystemId, CRIMSON_CAPITAL_SYSTEM_ID);
  if (!nextSys) return world.currentPlanetId;
  const hop = lookupPrimaryPlanet(nextSys) ?? world.currentPlanetId;
  if (hop === CRIMSON_CAPITAL_PLANET_ID) {
    const nearby = nearestFightablePlanet(world);
    return nearby && nearby !== CRIMSON_CAPITAL_PLANET_ID ? nearby : world.currentPlanetId;
  }
  const tcl = lookupTcl(hop);
  if (tcl > world.level + 10) {
    const nearby = nearestFightablePlanet(world);
    if (nearby) return nearby;
  }
  return hop;
}
