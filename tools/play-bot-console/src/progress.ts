import type { Mission, MissionObjective } from '../../../src/types';
import type { JournalEntry, WorldState } from './types';
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

export function markQuestPlanet(world: WorldState, planetId: string | null | undefined): void {
  if (planetId && planetId.length > 0) world.lastQuestPlanetId = planetId;
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

export function questFightPlanet(world: WorldState, mission: Mission, obj: MissionObjective): string {
  const explicit = objectivePlanetId(obj.type, obj.targetId);
  if (explicit) return explicit;
  if (world.lastQuestPlanetId) return world.lastQuestPlanetId;
  if (world.currentPlanetId) return world.currentPlanetId;
  return mission.offerPlanetId || FOCUS_PLANET_ID;
}

export function fightPowerBonus(world: WorldState): number {
  return Math.min(0.22, world.gearScore / 1800 + world.learnedSkills.length * 0.006);
}

export function nextPlayableMissionId(world: WorldState): string | null {
  const ids = listPlayableMissionIds();
  for (let i = 0; i < ids.length; i += 1) {
    const id = ids[i];
    if (world.completedLookup[id]) continue;
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

export function bestAffordableGear(world: WorldState): ReturnType<typeof listGearCandidates>[number] | null {
  const reserve = 800;
  const budget = world.credits - reserve;
  if (budget < 200) return null;
  const rows = listGearCandidates();
  let best = null as ReturnType<typeof listGearCandidates>[number] | null;
  for (let i = 0; i < rows.length; i += 1) {
    const g = rows[i];
    if (g.levelReq > world.level) continue;
    if (g.price > budget) continue;
    const curId = world.equipped[g.slot];
    const curScore = curId ? gearScoreOf(curId) : 0;
    if (g.score <= curScore + 0.01) continue;
    if (!best || g.score > best.score) best = g;
  }
  return best;
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
    if (!pick || s.levelRequired < pick.levelRequired) pick = s;
  }
  if (!pick) {
    return ev('SKILL', `습득 대기 SP${world.skillPoints} / ${world.learnedSkills.length}/${skills.length}`);
  }
  markSkillLearned(world, pick.id);
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
