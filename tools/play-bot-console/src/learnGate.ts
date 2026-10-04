import type { ActionKind } from './types';

export type GrowthLite = {
  combatWins: number;
  combatLosses: number;
  totalExp: number;
  questCleared: number;
  level: number;
  shipDestroys?: number;
  hangarShips?: number;
};

/** 창 점수 대비 10% 하락만 롤백. 절대 −150은 잡음. */
export const ROLLBACK_RATIO = 0.1;
export const ROLLBACK_MIN_PREV = 200;

export type PatternLite = {
  dominantAction: string;
  lastHoldReason: string;
};

export type LearningLite = {
  growth: readonly GrowthLite[];
  patterns: readonly PatternLite[];
};

/**
 * 예전 120일 컷. 학습 상한으로 쓰지 않는다.
 * 창을 닫기 전까지 한 세계를 이어 가고, 범프를 멈추는 조건은 포화(L60·퀘스트 정체)뿐이다.
 */
export const LEARN_HORIZON_DAYS = 120;
export const LEARN_WINDOW_DAYS = 8;
const CAMPAIGN_SEED_STRIDE = 100_003;
const CAMPAIGN_SEED_MOD = 1_000_000_007;

/** until-close는 일수 상한 없이 한 세계. 지정 --days 는 그 일수만 1회. */
export function campaignDaysForHarness(untilClose: boolean, requestedDays: number): number {
  if (untilClose) return 0;
  return Math.max(1, Math.min(3650, requestedDays));
}

export function nextCampaignSeed(seed: number, campaignIndex: number): number {
  if (campaignIndex <= 0) return seed;
  return (Math.abs(seed) + campaignIndex * CAMPAIGN_SEED_STRIDE) % CAMPAIGN_SEED_MOD || 1;
}

export function nextCampaignRunId(baseRunId: string, campaignIndex: number): string {
  if (campaignIndex <= 0) return baseRunId;
  return `${baseRunId}-c${campaignIndex}`;
}

/** 120일·until-close 루프로 레벨 1에 되돌리지 않는다. 정체 재플레이는 stallReplay 가 하니스에서 따로 끊는다. */
export function shouldLoopNextCampaign(_untilClose: boolean, _recording: boolean): boolean {
  return false;
}

export const CODE_WINDOW_CAP = 90;
export const WEIGHT_COLLAPSE_EPS = 0.008;

const TWIN_CODES = new Set([
  'BORDER_RED_SLOPE',
  'BORDER_BLUE_THIN',
  'BORDER_RED_ACCEL',
]);

const EARLY_CODES = new Set([
  'EARLY_OFF_SPINE',
  'EARLY_HANGAR_WIPE',
  'EARLY_DEAD_AIR',
  'EARLY_QUEST_GAP',
  'EARLY_DENSITY_THIN',
  'EARLY_L0_GUIDE_OK',
  'EARLY_L0_GUIDE_GAP',
  'EARLY_SPINE_OK',
]);

/** 가상일이 있는 동안 학습한다. 120일에서 끊지 않는다. */
export function inCampaignLearnWindow(day: number): boolean {
  return day > 0;
}

export function isTwinLearnCode(code: string): boolean {
  return TWIN_CODES.has(code);
}

export function isEarlyLearnCode(code: string): boolean {
  return EARLY_CODES.has(code) || code.startsWith('EARLY_');
}

/** 적응 입력에서 빼는 코드 — 트윈 국경 · 초반 Clock S · 포화. */
export function isAdaptExcludedCode(code: string): boolean {
  return isTwinLearnCode(code) || isEarlyLearnCode(code)
    || code === 'LEARN_SATURATED' || code === 'LEARN_HORIZON';
}

export function windowCombatDelta(state: LearningLite, n = LEARN_WINDOW_DAYS): {
  dWins: number;
  dLoss: number;
  fights: number;
} {
  const g = state.growth.slice(-n);
  if (g.length < 2) {
    return { dWins: 0, dLoss: 0, fights: 0 };
  }
  const a = g[0];
  const b = g[g.length - 1];
  const dWins = Math.max(0, b.combatWins - a.combatWins);
  const dLoss = Math.max(0, b.combatLosses - a.combatLosses);
  return { dWins, dLoss, fights: dWins + dLoss };
}

export function windowHangarDelta(state: LearningLite, n = LEARN_WINDOW_DAYS): {
  dDestroys: number;
  lastHangar: number;
} {
  const g = state.growth.slice(-n);
  if (g.length < 2) {
    return { dDestroys: 0, lastHangar: g[0]?.hangarShips ?? 99 };
  }
  const a = g[0];
  const b = g[g.length - 1];
  return {
    dDestroys: Math.max(0, (b.shipDestroys ?? 0) - (a.shipDestroys ?? 0)),
    lastHangar: b.hangarShips ?? 99,
  };
}

/** 기준점수를 잰 가상일보다 지금이 이르면 새 런/캠페인 — 이전 런 점수와 비교 금지(T1). */
export function isNewRunForScore(lastScoreDay: number | null | undefined, day: number): boolean {
  return lastScoreDay != null && day < lastScoreDay;
}

export function shouldRollbackScore(prev: number, next: number): boolean {
  if (!(prev >= ROLLBACK_MIN_PREV)) return false;
  return next < prev * (1 - ROLLBACK_RATIO);
}

export function windowScore(state: LearningLite, n = LEARN_WINDOW_DAYS): number {
  const g = state.growth.slice(-n);
  if (g.length < 2) return 0;
  const a = g[0];
  const b = g[g.length - 1];
  const dExp = Math.max(0, b.totalExp - a.totalExp);
  const dQuest = Math.max(0, b.questCleared - a.questCleared);
  let holdDays = 0;
  const pats = state.patterns.slice(-n);
  for (let i = 0; i < pats.length; i += 1) {
    if (pats[i].dominantAction === 'HOLD' && pats[i].lastHoldReason) holdDays += 1;
  }
  return dExp + dQuest * 200 - holdDays * 80;
}

export function isSaturatedGrowth(g: readonly GrowthLite[]): boolean {
  if (g.length < 4) return false;
  const last = g[g.length - 1];
  if (!last || last.level < 60) return false;
  const first = g[g.length - 4];
  const flatQuest = last.questCleared === first.questCleared;
  const flatLevel = last.level === first.level;
  return flatQuest && flatLevel;
}

export function rebuildCodeCounts(window: readonly { codes: readonly string[] }[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (let i = 0; i < window.length; i += 1) {
    const codes = window[i].codes;
    for (let j = 0; j < codes.length; j += 1) {
      const c = codes[j];
      out[c] = (out[c] ?? 0) + 1;
    }
  }
  return out;
}

export function isCollapsedWeights(w: Record<ActionKind, number>): boolean {
  const keys: ActionKind[] = ['combat', 'travel', 'develop', 'capital'];
  let min = 1;
  let max = 0;
  for (let i = 0; i < keys.length; i += 1) {
    const v = w[keys[i]] ?? 0;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return max - min < WEIGHT_COLLAPSE_EPS && max > 0.05;
}

export function weightsNear(
  a: Record<ActionKind, number>,
  b: Record<ActionKind, number>,
  eps = 0.002,
): boolean {
  const keys = Object.keys(a) as ActionKind[];
  for (let i = 0; i < keys.length; i += 1) {
    if (Math.abs((a[keys[i]] ?? 0) - (b[keys[i]] ?? 0)) > eps) return false;
  }
  return true;
}

export function notesEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
