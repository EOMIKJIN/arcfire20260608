// 스텔라 관찰 선제 — 능동형. 스텔라가 스스로 판단해 먼저 말을 건다. 순수 함수. store·RN import 금지 (플레이봇이 그대로 import).
// 하루 몇 번 같은 예산은 없다 (대표님 2026-10-06). 판단은 두 축의 곱:
//   말하고 싶은 마음 = 상황의 무게 · 심한 정도 · 방금 말했다는 자제 · 대표님 반응
//   지금이 말할 때인가 = 근거 행동이 방금인가 · 대표님이 한창 바쁜가
// 남은 제약은 기술 조정뿐: 말할 수 없는 순간(전투·대화·다른 팝업) · 근원체와 겹침 · 고장 방지 상한.
import type { StellaObserveChannel, StellaObserveHit, StellaObserveSituationRow } from './stellaObserveSituations';

export type StellaObserveGatePolicy = {
  speakThreshold: number;
  askThreshold: number;
  restraintHalfLifeMin: number;
  restraintMax: number;
  ignoreDamp: number;
  globalIgnoreDamp: number;
  dutyDamp: number;
  casualDamp: number;
  minGapMin: number;
  /** 고장 방지 — 판단 규칙 아님. 닿으면 판단 쪽을 고친다. */
  failsafeMaxPerDay: number;
  /** 근거 행동이 이 분 안이면 지금이 딱 말할 때. */
  fitFreshMin: number;
  /** 그 뒤로 때가 지나가는 반감기(분). */
  fitHalfLifeMin: number;
  /** 때가 지나도 남는 최저치. 근거 행동이 링에 없을 때도 이 값. */
  fitFloor: number;
  /** 최근 이 분 동안 행동이 busyActions 이상이면 한창 바쁜 중. */
  busyWindowMin: number;
  busyActions: number;
  /** 바쁠 때 걱정 외 상황에 곱하는 값. */
  busyDamp: number;
  /** 마지막으로 말한 뒤에 새로 생긴 일이면 자제를 이만큼만 건다 (0..1). 새 소식은 참을 이유가 적다. */
  newsRestraintScale: number;
  /** 무시당한 기억이 반으로 풀리는 시간(시간). */
  ignoreHalfLifeHours: number;
  /** 이 시간 안에 같은 상황을 꺼낸 횟수마다 repeatDamp 를 곱한다. */
  repeatWindowHours: number;
  repeatDamp: number;
  /** 같은 일상 질문을 한 뒤 이 시간 안에는 다시 묻지 않는다. */
  lifeCooldownHours: number;
  motiveWeight: Record<string, number>;
};

/** 표가 비었을 때만 쓰는 폴백. 정본은 stella_observe_gate_policy.csv. */
export const STELLA_OBSERVE_GATE_FALLBACK: StellaObserveGatePolicy = {
  speakThreshold: 0.4,
  askThreshold: 0.7,
  restraintHalfLifeMin: 90,
  restraintMax: 0.8,
  ignoreDamp: 0.6,
  globalIgnoreDamp: 0.85,
  dutyDamp: 0.5,
  casualDamp: 0.7,
  minGapMin: 15,
  failsafeMaxPerDay: 6,
  fitFreshMin: 10,
  fitHalfLifeMin: 30,
  fitFloor: 0.3,
  busyWindowMin: 5,
  busyActions: 6,
  busyDamp: 0.5,
  newsRestraintScale: 0.5,
  ignoreHalfLifeHours: 72,
  repeatWindowHours: 72,
  repeatDamp: 0.4,
  lifeCooldownHours: 24,
  motiveWeight: {},
};

const DEFAULT_MOTIVE_WEIGHT = 0.5;
const MAX_INTENSITY = 2;

/** 대화 store 에 실어 둘 상태. 상황 수만큼만 자란다. */
export type StellaObserveGateState = {
  day: number;
  /** 오늘 선제 횟수 — 고장 방지 상한 확인용. */
  count: number;
  /** 스텔라 마지막 선제 시각. */
  lastAtMs: number;
  /** 최근 연달아 무시당한 횟수 (어느 상황이든) · 마지막 무시 시각 — 시간이 지나면 풀린다. */
  globalIgn: number;
  globalIgnAt: number;
  shownAt: Record<string, number>;
  /** 그 상황을 꺼낸 최근 시각 최대 STELLA_RECENT_SHOWS_MAX 개 — 자주 한 말은 덜 하고 싶다. */
  recentShows: Record<string, number[]>;
  /** 그 상황을 말할 때의 심한 정도 — 더 나빠졌을 때만 다시 꺼낸다. */
  saidIntensity: Record<string, number>;
  ign: Record<string, number>;
  ignAt: Record<string, number>;
  announcedFirsts: number;
  lastLevelMark: number;
};

const STELLA_RECENT_SHOWS_MAX = 3;

export function emptyStellaObserveGateState(): StellaObserveGateState {
  return {
    day: 0,
    count: 0,
    lastAtMs: 0,
    globalIgn: 0,
    globalIgnAt: 0,
    shownAt: {},
    recentShows: {},
    saidIntensity: {},
    ign: {},
    ignAt: {},
    announcedFirsts: 0,
    lastLevelMark: 0,
  };
}

export type StellaObserveContext = {
  nowMs: number;
  /** KST 날짜 번호 — playerObserveDayOf. */
  day: number;
  /** 오버레이·대화·웨이브·튜토리얼·DND·앱 비활성이 아님. */
  safeSlot: boolean;
  /** 같은 허브 진입에서 다른 팝업(최초 착륙·튜토리얼·환영·첫 연락)이 떴거나 떠 있음. */
  otherPopupThisEntry: boolean;
  /** 근원체 inbound 마지막 시각. */
  originLastAtMs: number;
  /** 지금 근원체 inbound 도 울릴 이유가 있음. */
  originPendingNow: boolean;
  /** 스텔라 일상 질문(라이프) 마지막 시각 — 자기가 한 말이라 자제에 같이 들어간다. 없으면 0. */
  lifeAskLastAtMs: number;
  stellaOnDuty: boolean;
  casualFirstHigh: boolean;
  /** 최근 행동 최신순 (forEachRecentPlayerObserve 로 결정 순간에 채움). */
  recent: readonly StellaObserveRecent[];
};

export type StellaObserveRecent = { verb: string; at: number };

export type StellaObserveDecision =
  | { kind: 'speak'; hit: StellaObserveHit; channel: StellaObserveChannel; urge: number; fit: number }
  | { kind: 'silent'; reason: string };

const HOUR_MS = 3_600_000;
const MIN_MS = 60_000;

/** 같은 순간 근원체와 겹치면 스텔라가 양보하는가. 걱정·귀환 인사만 먼저 말한다. */
export function stellaYieldsToOrigin(row: StellaObserveSituationRow): boolean {
  return row.motiveId !== 'worry' && row.id !== 'sit_welcome_back';
}

/** 근원체 예정 슬롯을 취소하지 않고 다음 창으로 민다. 지연 상수 자체는 바꾸지 않는다. */
export function nextOriginInboundWindowMs(
  state: Readonly<StellaObserveGateState>,
  plannedMs: number,
  policy: StellaObserveGatePolicy,
): number {
  if (state.lastAtMs <= 0) return plannedMs;
  return Math.max(plannedMs, state.lastAtMs + policy.minGapMin * MIN_MS);
}

export const STELLA_LIFE_HIT_PREFIX = 'life_';

/**
 * 스텔라 일상 질문(§16)을 관찰 상황과 같은 판단에 올린다 — 하루 1회 규칙 대신 마음 × 때.
 * motiveId·askId 는 resolveStellaAskMotive·bindStellaAskWhy 결과. 문장은 그쪽이 낸다.
 */
export function stellaLifeAskHit(motiveId: string, askId: string, policy: StellaObserveGatePolicy): StellaObserveHit {
  return {
    row: {
      id: STELLA_LIFE_HIT_PREFIX + askId,
      priority: 0,
      detector: 'life_ask',
      paramA: 0,
      paramB: 0,
      motiveId,
      channel: 'ask',
      cooldownHours: policy.lifeCooldownHours,
      dutyGate: 'any',
      enabled: true,
      lineKo: '',
      lineEn: '',
      anchorVerb: '',
    },
    vars: { nth: 0, d: 0, intensity: 1 },
  };
}

export function isStellaLifeHit(row: StellaObserveSituationRow): boolean {
  return row.detector === 'life_ask';
}

function intensityOf(hit: StellaObserveHit): number {
  const v = hit.vars.intensity;
  if (!Number.isFinite(v) || v < 1) return 1;
  return v > MAX_INTENSITY ? MAX_INTENSITY : v;
}

/** 이 상황의 근거 행동이 가장 최근에 일어난 시각. 없으면 0. */
function anchorAt(row: StellaObserveSituationRow, ctx: StellaObserveContext): number {
  if (!row.anchorVerb) return 0;
  for (let i = 0; i < ctx.recent.length; i += 1) {
    if (ctx.recent[i]!.verb === row.anchorVerb) return ctx.recent[i]!.at;
  }
  return 0;
}

/** 지금이 말을 걸 때인가 0..1. 근거 행동이 방금일수록 · 대표님이 한창 바쁘지 않을수록 높다. */
export function stellaObserveMomentFit(
  row: StellaObserveSituationRow,
  ctx: StellaObserveContext,
  policy: StellaObserveGatePolicy,
): number {
  let fit = 1;
  if (row.anchorVerb) {
    const at = anchorAt(row, ctx);
    if (at <= 0) fit = policy.fitFloor;
    else {
      const overMin = Math.max(0, (ctx.nowMs - at) / MIN_MS - policy.fitFreshMin);
      const decay = policy.fitHalfLifeMin > 0 ? Math.pow(0.5, overMin / policy.fitHalfLifeMin) : 1;
      fit = Math.max(policy.fitFloor, decay);
    }
  }
  if (row.motiveId !== 'worry' && policy.busyActions > 0) {
    const since = ctx.nowMs - policy.busyWindowMin * MIN_MS;
    let n = 0;
    for (let i = 0; i < ctx.recent.length; i += 1) {
      const e = ctx.recent[i]!;
      if (e.at < since) break;
      if (e.verb !== 'land' && e.verb !== 'session') n += 1;
    }
    if (n >= policy.busyActions) fit *= policy.busyDamp;
  }
  return fit;
}

function fadedIgnore(n: number, at: number, nowMs: number, policy: StellaObserveGatePolicy): number {
  if (n <= 0 || at <= 0 || policy.ignoreHalfLifeHours <= 0) return n;
  return n * Math.pow(0.5, Math.max(0, nowMs - at) / (policy.ignoreHalfLifeHours * HOUR_MS));
}

/** 말하고 싶은 마음 0..1. 판정용 — 상태를 바꾸지 않는다. */
export function stellaObserveWant(
  hit: StellaObserveHit,
  state: Readonly<StellaObserveGateState>,
  ctx: StellaObserveContext,
  policy: StellaObserveGatePolicy,
): number {
  const row = hit.row;
  const w = policy.motiveWeight[row.motiveId] ?? DEFAULT_MOTIVE_WEIGHT;
  // 감지 문턱에 막 닿았으면 동기 무게 그대로, 더 심하면 최대 1.25배.
  let u = w * (1 + 0.25 * (intensityOf(hit) - 1));
  const last = Math.max(state.lastAtMs, ctx.lifeAskLastAtMs);
  if (last > 0 && policy.restraintHalfLifeMin > 0) {
    const elapsedMin = Math.max(0, ctx.nowMs - last) / MIN_MS;
    const news = anchorAt(row, ctx) > last;
    const max = news ? policy.restraintMax * policy.newsRestraintScale : policy.restraintMax;
    u *= 1 - max * Math.pow(0.5, elapsedMin / policy.restraintHalfLifeMin);
  }
  u *= Math.pow(policy.ignoreDamp, fadedIgnore(state.ign[row.id] ?? 0, state.ignAt[row.id] ?? 0, ctx.nowMs, policy));
  u *= Math.pow(policy.globalIgnoreDamp, fadedIgnore(state.globalIgn, state.globalIgnAt, ctx.nowMs, policy));
  const shows = state.recentShows[row.id];
  if (shows && policy.repeatWindowHours > 0) {
    const since = ctx.nowMs - policy.repeatWindowHours * HOUR_MS;
    for (let i = 0; i < shows.length; i += 1) if (shows[i]! >= since) u *= policy.repeatDamp;
  }
  if (row.dutyGate === 'off_only' && ctx.stellaOnDuty) u *= policy.dutyDamp;
  if (ctx.casualFirstHigh && row.motiveId !== 'worry') u *= policy.casualDamp;
  return u;
}

/** 판단만 — 상태를 바꾸지 않는다. 말했으면 noteStellaObserveShown 을 부른다. */
export function decideStellaObserve(
  hits: readonly StellaObserveHit[],
  state: Readonly<StellaObserveGateState>,
  ctx: StellaObserveContext,
  policy: StellaObserveGatePolicy,
): StellaObserveDecision {
  if (hits.length === 0) return { kind: 'silent', reason: 'none' };
  if (!ctx.safeSlot) return { kind: 'silent', reason: 'unsafe' };
  if (ctx.otherPopupThisEntry) return { kind: 'silent', reason: 'popup' };
  if (ctx.originLastAtMs > 0 && ctx.nowMs - ctx.originLastAtMs < policy.minGapMin * MIN_MS) {
    return { kind: 'silent', reason: 'gap' };
  }
  if (state.day === ctx.day && state.count >= policy.failsafeMaxPerDay) return { kind: 'silent', reason: 'failsafe' };

  let best: StellaObserveHit | null = null;
  let bestUrge = -1;
  let bestFit = 0;
  let bestWant = 0;
  let reason = 'none';
  for (let i = 0; i < hits.length; i += 1) {
    const hit = hits[i]!;
    const row = hit.row;
    const shown = state.shownAt[row.id] ?? 0;
    // 이미 한 말은 기억이 남아 있는 동안 더 나빠졌을 때만 다시 꺼낸다.
    if (shown > 0 && row.cooldownHours > 0 && ctx.nowMs < shown + row.cooldownHours * HOUR_MS) {
      if (intensityOf(hit) <= (state.saidIntensity[row.id] ?? 0)) {
        reason = 'said';
        continue;
      }
    }
    if (ctx.originPendingNow && stellaYieldsToOrigin(row)) {
      reason = 'yield_origin';
      continue;
    }
    const want = stellaObserveWant(hit, state, ctx, policy);
    const fit = stellaObserveMomentFit(row, ctx, policy);
    const u = want * fit;
    if (u > bestUrge) {
      best = hit;
      bestUrge = u;
      bestFit = fit;
      bestWant = want;
    }
  }
  if (!best) return { kind: 'silent', reason };
  if (bestUrge < policy.speakThreshold) {
    // 마음은 있는데 때가 아니면 not_now, 마음 자체가 모자라면 restraint.
    return { kind: 'silent', reason: bestWant >= policy.speakThreshold ? 'not_now' : 'restraint' };
  }
  const channel: StellaObserveChannel =
    best.row.channel === 'ask' && bestUrge < policy.askThreshold ? 'message' : best.row.channel;
  return { kind: 'speak', hit: best, channel, urge: bestUrge, fit: bestFit };
}

/** 표면이 열린 순간 1회. */
export function noteStellaObserveShown(
  state: StellaObserveGateState,
  decision: Extract<StellaObserveDecision, { kind: 'speak' }>,
  ctx: Pick<StellaObserveContext, 'nowMs' | 'day'> & { level: number },
): void {
  if (state.day !== ctx.day) {
    state.day = ctx.day;
    state.count = 0;
  }
  state.count += 1;
  const row = decision.hit.row;
  state.lastAtMs = ctx.nowMs;
  state.shownAt[row.id] = ctx.nowMs;
  const shows = (state.recentShows[row.id] ??= []);
  shows.push(ctx.nowMs);
  if (shows.length > STELLA_RECENT_SHOWS_MAX) shows.shift();
  state.saidIntensity[row.id] = intensityOf(decision.hit);
  if (row.detector === 'first_bit') state.announcedFirsts |= row.paramA;
  if (row.detector === 'level_multiple' && row.paramA > 0) {
    state.lastLevelMark = Math.max(state.lastLevelMark, Math.floor(ctx.level / row.paramA));
  }
}

/** 수락 없이 닫힘 — 그 상황과, 요즘 말 거는 것 자체를 조금 덜 하게 된다. 시간이 지나면 풀린다. */
export function noteStellaObserveIgnored(
  state: StellaObserveGateState,
  sitId: string,
  nowMs: number,
  policy: StellaObserveGatePolicy,
): void {
  state.ign[sitId] = fadedIgnore(state.ign[sitId] ?? 0, state.ignAt[sitId] ?? 0, nowMs, policy) + 1;
  state.ignAt[sitId] = nowMs;
  state.globalIgn = fadedIgnore(state.globalIgn, state.globalIgnAt, nowMs, policy) + 1;
  state.globalIgnAt = nowMs;
}

/** 받아 줌 — 눈치가 풀린다. */
export function noteStellaObserveAccepted(state: StellaObserveGateState, sitId: string): void {
  state.ign[sitId] = 0;
  state.globalIgn = 0;
}
