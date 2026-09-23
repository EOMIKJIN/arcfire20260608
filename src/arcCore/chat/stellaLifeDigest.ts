import {
  stellaLifeAddDayKey,
  stellaLifeCompareDayKey,
  stellaLifeDayKey,
  stellaLifeDayKeysBetween,
  stellaLifeNoonMs,
} from './stellaLifeClock';
import { emptyStellaLifeEnv, resolveStellaLifeAt } from './stellaLifeResolve';
import { resolveStellaLifeNarrativeLine } from './stellaLifeTableIndex';
import {
  STELLA_LIFE_BACKFILL_MAX_DAYS,
  STELLA_LIFE_DIGEST_MAX,
  STELLA_LIFE_EMA_ALPHA,
  clampStellaLifeSnapshotToMaxBytes,
} from './stellaLifeSnapshot';
import type { StellaLifeDigestRow, StellaLifeDriveId, StellaLifeResolved, StellaLifeSnapshot } from './stellaLifeTypes';

function clamp100(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function ema(prev: number, sample: number): number {
  return clamp100(prev * (1 - STELLA_LIFE_EMA_ALPHA) + sample * STELLA_LIFE_EMA_ALPHA);
}

function applyDriveEma(
  traits: StellaLifeSnapshot['traits'],
  driveId: StellaLifeDriveId,
  mood: number,
): StellaLifeSnapshot['traits'] {
  const next = { ...traits };
  if (driveId === 'duty') next.duty = ema(traits.duty, mood);
  else if (driveId === 'care') next.warmth = ema(traits.warmth, mood);
  else if (driveId === 'curiosity') next.curiosity = ema(traits.curiosity, mood);
  else if (driveId === 'rest' || driveId === 'growth' || driveId === 'unease') {
    next.steadiness = ema(traits.steadiness, mood);
  }
  return next;
}

function absorbOldest(life: StellaLifeSnapshot): StellaLifeSnapshot {
  if (life.digests.length <= STELLA_LIFE_DIGEST_MAX) return life;
  const oldest = life.digests[0]!;
  const next = { ...life, digests: life.digests.slice(1) };
  next.traits = applyDriveEma(life.traits, oldest.driveId, oldest.mood);
  return next;
}

function narrativeFrom(life: StellaLifeSnapshot): string {
  return resolveStellaLifeNarrativeLine(life.traits, 'ko').slice(0, 80);
}

function digestFromResolved(resolved: StellaLifeResolved, withPlayer: 0 | 1): StellaLifeDigestRow {
  return {
    d: resolved.dayKey,
    mood: resolved.mood,
    driveId: resolved.driveId,
    goalId: resolved.goalId,
    done: [resolved.activityKo.slice(0, 24), resolved.activityEn.slice(0, 24)],
    withPlayer,
  };
}

function hasDigest(life: StellaLifeSnapshot, dayKey: string): boolean {
  for (let i = 0; i < life.digests.length; i += 1) {
    if (life.digests[i]!.d === dayKey) return true;
  }
  return false;
}

export function consolidateStellaLifeSnapshot(
  life: StellaLifeSnapshot,
  nowMs: number,
  uid: string,
  withPlayerYesterday: boolean,
): StellaLifeSnapshot {
  const today = stellaLifeDayKey(nowMs);
  const yesterday = stellaLifeAddDayKey(today, -1);
  if (life.lastConsolidatedDayKey && stellaLifeCompareDayKey(life.lastConsolidatedDayKey, yesterday) >= 0) {
    return life;
  }

  let next: StellaLifeSnapshot = {
    ...life,
    digests: life.digests.slice(),
    traits: { ...life.traits },
    anchors: life.anchors.slice(),
    goalHistory: life.goalHistory.slice(),
    cognition: { ...life.cognition, ev: life.cognition.ev.slice() },
    cognitionSession: { ...life.cognitionSession },
  };

  if (!next.lastConsolidatedDayKey) {
    next.lastConsolidatedDayKey = yesterday;
    return clampStellaLifeSnapshotToMaxBytes(next);
  }

  const from = next.lastConsolidatedDayKey;
  const gap = stellaLifeDayKeysBetween(from, yesterday);
  if (gap.length > STELLA_LIFE_BACKFILL_MAX_DAYS) {
    if (!hasDigest(next, yesterday)) {
      next.digests.push({
        d: yesterday,
        mood: 50,
        driveId: 'rest',
        goalId: '',
        done: ['오래 비움', 'long quiet'],
        withPlayer: 0,
      });
    }
  } else {
    for (let i = 0; i < gap.length; i += 1) {
      const day = gap[i]!;
      if (hasDigest(next, day)) continue;
      const noon = stellaLifeNoonMs(day);
      const resolved = resolveStellaLifeAt(noon, uid, emptyStellaLifeEnv(noon), next);
      const withPlayer = day === yesterday && withPlayerYesterday ? 1 : 0;
      next.digests.push(digestFromResolved(resolved, withPlayer));
    }
  }

  while (next.digests.length > STELLA_LIFE_DIGEST_MAX) {
    next = absorbOldest(next);
  }
  next.narrative = narrativeFrom(next).slice(0, 240);
  if (next.goalHistory[0] !== next.digests[next.digests.length - 1]?.goalId) {
    const gid = next.digests[next.digests.length - 1]?.goalId ?? '';
    if (gid) next.goalHistory = [gid, ...next.goalHistory.filter((x) => x !== gid)].slice(0, 4);
  }
  next.lastConsolidatedDayKey = yesterday;
  if (next.todayKey !== today) {
    next.todayKey = today;
    next.withPlayerToday = false;
    next.sessionMoodDelta = 0;
    next.cognitionSession = { h5: 0, topic: 0, casual: 0, dump: 0, corr: 0 };
  }
  return clampStellaLifeSnapshotToMaxBytes(next);
}
