import {
  stellaLifeDayKey,
  stellaLifeHash32,
  stellaLifeSlotIndex,
  stellaLifeWeekKey,
  stellaLifeWeekdayMaskKey,
  stellaLifeKstParts,
} from './stellaLifeClock';
import {
  findStellaLifeGoal,
  listStellaLifeEnvRules,
  listStellaLifeGoals,
  listStellaLifeSlots,
  type StellaLifeEnvRuleRow,
  type StellaLifeSlotRow,
} from './stellaLifeTableIndex';
import type { StellaLifeDriveId, StellaLifeEnv, StellaLifeResolved, StellaLifeSnapshot } from './stellaLifeTypes';

function clamp100(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function slotMatches(row: StellaLifeSlotRow, slot: number, weekdayKey: string): boolean {
  if (row.weekdayMask !== '*' && !row.weekdayMask.includes(weekdayKey)) return false;
  if (row.slotFrom <= row.slotTo) return slot >= row.slotFrom && slot <= row.slotTo;
  return slot >= row.slotFrom || slot <= row.slotTo;
}

function pickSlot(slot: number, weekdayKey: string, seed: number): StellaLifeSlotRow {
  const all = listStellaLifeSlots();
  const hit: StellaLifeSlotRow[] = [];
  for (let i = 0; i < all.length; i += 1) {
    if (slotMatches(all[i]!, slot, weekdayKey)) hit.push(all[i]!);
  }
  const pool = hit.length > 0 ? hit : all;
  return pool[seed % pool.length]!;
}

function pickGoal(uid: string, dayKey: string, snapshot: StellaLifeSnapshot | null): {
  id: string;
  driveId: StellaLifeDriveId;
  progress: number;
} {
  const existing = snapshot?.goalHistory[0] ? findStellaLifeGoal(snapshot.goalHistory[0]) : null;
  if (existing) {
    return {
      id: existing.id,
      driveId: existing.driveId,
      progress: snapshot?.digests[snapshot.digests.length - 1]?.mood ?? 0,
    };
  }
  const goals = listStellaLifeGoals();
  const row = goals[stellaLifeHash32(uid, stellaLifeWeekKey(dayKey)) % Math.max(1, goals.length)]!;
  return { id: row.id, driveId: row.driveId, progress: 0 };
}

function envValue(env: StellaLifeEnv, key: string): number | string {
  if (key === 'hour') return env.hour;
  if (key === 'weekday') return env.weekdayKey;
  if (key === 'planet') return env.planetId;
  if (key === 'coreR') return env.coreR;
  if (key === 'coreP') return env.coreP;
  if (key === 'coreD') return env.coreD;
  if (key === 'coreT') return env.coreT;
  if (key === 'coreE') return env.coreE;
  if (key === 'spy') return env.spyAlertPending ? 1 : 0;
  if (key === 'lastCombat') return env.hasCombatRecord ? 1 : 0;
  return 0;
}

function condOk(value: number | string, condition: string): boolean {
  const parts = condition.split('&');
  for (let i = 0; i < parts.length; i += 1) {
    const token = parts[i]!.trim();
    if (token.startsWith('in:')) {
      const set = token.slice(3);
      if (!set.includes(String(value))) return false;
      continue;
    }
    const colon = token.indexOf(':');
    if (colon <= 0) return false;
    const op = token.slice(0, colon);
    const rhs = token.slice(colon + 1);
    const left = typeof value === 'number' ? value : Number(value);
    const right = Number(rhs);
    if (op === 'eq' && left !== right) return false;
    if (op === 'gte' && left < right) return false;
    if (op === 'lte' && left > right) return false;
  }
  return true;
}

function applyEnv(
  env: StellaLifeEnv,
  mood: number,
  focus: number,
): { mood: number; focus: number; lineKo: string; lineEn: string } {
  const rules = listStellaLifeEnvRules();
  let nextMood = mood;
  let nextFocus = focus;
  let lineKo = '';
  let lineEn = '';
  for (let i = 0; i < rules.length; i += 1) {
    const rule: StellaLifeEnvRuleRow = rules[i]!;
    if (!condOk(envValue(env, rule.envKey), rule.condition)) continue;
    nextMood += rule.moodDelta;
    nextFocus += rule.focusDelta;
    if (!lineKo) {
      lineKo = rule.lineKo;
      lineEn = rule.lineEn;
    }
  }
  return { mood: clamp100(nextMood), focus: clamp100(nextFocus), lineKo, lineEn };
}

export function emptyStellaLifeEnv(nowMs: number): StellaLifeEnv {
  const parts = stellaLifeKstParts(nowMs);
  return {
    hour: parts.hour,
    weekdayKey: stellaLifeWeekdayMaskKey(nowMs),
    planetId: '',
    coreR: 50,
    coreP: 50,
    coreD: 50,
    coreT: 50,
    coreE: 50,
    spyAlertPending: false,
    hasCombatRecord: false,
  };
}

export function playerGapDaysFromSnapshot(dayKey: string, snapshot: StellaLifeSnapshot | null): number {
  const last = snapshot?.lastPlayerDay?.trim() ?? '';
  if (!last) return 0;
  if (last === dayKey) return 0;
  const a = Date.parse(`${last}T00:00:00+09:00`);
  const b = Date.parse(`${dayKey}T00:00:00+09:00`);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return 0;
  return Math.min(30, Math.round((b - a) / 86400000));
}

export function resolveStellaLifeAt(
  nowMs: number,
  uid: string,
  env: StellaLifeEnv = emptyStellaLifeEnv(nowMs),
  snapshot: StellaLifeSnapshot | null = null,
): StellaLifeResolved {
  const dayKey = stellaLifeDayKey(nowMs);
  const slotIndex = stellaLifeSlotIndex(nowMs);
  const weekdayKey = stellaLifeWeekdayMaskKey(nowMs);
  const seed = stellaLifeHash32(uid || 'anon', dayKey, String(slotIndex));
  const slot = pickSlot(slotIndex, weekdayKey, seed);
  const goal = pickGoal(uid || 'anon', dayKey, snapshot);
  const moodBase = 50 + (snapshot?.sessionMoodDelta ?? 0);
  const envApplied = applyEnv(env, moodBase, 50 + slot.focusDelta);
  return {
    dayKey,
    slotIndex,
    activityKo: slot.activityKo,
    activityEn: slot.activityEn,
    dutyOrOff: slot.dutyOrOff,
    energy: clamp100(50 + slot.energyDelta),
    mood: envApplied.mood,
    focus: envApplied.focus,
    driveId: goal.driveId,
    goalId: goal.id,
    goalProgress: clamp100(goal.progress),
    playerGapDays: playerGapDaysFromSnapshot(dayKey, snapshot),
    topicHint: slot.topicHint,
    envLineKo: envApplied.lineKo,
    envLineEn: envApplied.lineEn,
  };
}
