/**
 * 전함 교전 기동 — 판단(결정) 계층 (Phase 0 · 2026-07-22 · 운용/교착 Phase 4 · 2026-09-11)
 *
 * `PlanetEdenRaidTestLayer` 틱 루프에 인라인으로 흩어져 있던 "전술 판단" 로직을
 * 순수 모듈로 추출한 뒤, 함장 운용(장거리→선회)·교착 타파를 같은 계약에 얹는다.
 *
 * 계층 계약:
 * - 이 모듈 = 판단(교전 단계 FSM · 기세 · 추격 가중 · kite 정체 · 운용 밴드 · 우선 무기 · 방위 · 교착).
 * - `compositeNavigatePose` = 포즈 블렌더(목표 좌표·헤딩 합성).
 * - `integrateAgentKinematics` = 물리(서지·선회·가속 적분).
 *
 * 메모리 규율: 매 틱 호출되므로 신규 할당 금지 — 결정 결과는 호출 측이 1회
 * 사전 할당한 `CapitalManeuverDecision` 버퍼에 in-place 기록한다.
 * 에셋 import 없음(테스트에서 tsx 직접 실행 가능).
 *
 * `weaponProfileReady=false`(테스트 기본)면 Phase 0 추격/FSM만 — 기존 테스트 행동 불변.
 * 틱 본문에 전술 if 트리를 다시 늘리지 말 것.
 */

import {
  CAPITAL_MISSILE_RANGE_LOOSEN_PX,
  type CapitalCombatRangeBands,
} from '../../game/capitalWeaponRange';
import {
  FALLBACK_DEFAULT_TACTIC_DOCTRINE,
  type CaptainTacticDoctrine,
} from './captainTacticDoctrine';

export type CombatMotionStage = 'closing' | 'missile_pattern' | 'missile_reposition' | 'brawl';
export type TempoRole = 'press' | 'kite';
export type KiteEvasionMode = 'standoff' | 'planet_orbit';
export type RpsHand = 0 | 1 | 2; // 0:가위, 1:바위, 2:보
/** 함장 운용 밴드 — 거리 FSM과 별개. approach=사거리 밖 접근, standoff_long=장거리 사격, mid=선회, brawl=근접 */
export type EmployBand = 'approach' | 'standoff_long' | 'mid' | 'brawl';
export type PreferredWeapon = 'missile' | 'laser' | 'close' | 'any';
export type BearingGoal = 'bow' | 'beam_port' | 'beam_starboard' | 'stern';
/** 0 방위전환 · 1 밴드전환 · 2 무기전환 */
export type StalemateBreakKind = 0 | 1 | 2;

/** 기세 우세 시 추격 강화(근접 강요) — `default` 독트린 정본과 동일 */
export const TEMPO_PRESS_CHASE_WEIGHT = FALLBACK_DEFAULT_TACTIC_DOCTRINE.pressChaseFloor;
/** 기세 열세 시 추격 약화(거리 벌리기) — `default` 독트린 정본과 동일 */
export const TEMPO_KITE_CHASE_WEIGHT = FALLBACK_DEFAULT_TACTIC_DOCTRINE.kiteChaseCap;
/** 거리벌림(kite·재배치) 중 정지에 가까운 선속(px/ms) */
export const KITE_DIST_STALL_SPEED_PX_PER_MS = 0.0055;
/** 위 저속이 이 시간(ms) 유지되면 적 방향 전진 회복 구간 진입 */
export const KITE_DIST_STALL_HOLD_MS = 1900;
/** 회복 구간: 적함 방향으로 일반 항법·전진(ms) */
export const KITE_DIST_RESUME_ADVANCE_MS = 2600;

/**
 * 페어 교착 — 지루하지 않게 짧게.
 * kite 저속 회복(1.9+2.6s)과 독립. 마주보고 거리가 안 변하면 ~2.2s 후 타파.
 */
export const PAIR_STALEMATE_DETECT_MS = 2200;
export const PAIR_STALEMATE_BREAK_MS = 2600;
export const PAIR_STALEMATE_REARM_MS = 700;
export const PAIR_STALEMATE_DIST_DELTA_PX = 18;
/** 교착 시계 동안 이 거리 이상 변하면 접근/이탈로 보고 취소 */
export const PAIR_STALEMATE_PROGRESS_PX = 32;
export const PAIR_STALEMATE_BOW_ALIGN_RAD = 0.62;
/** 장거리 운용 중 추격 상한 — 사거리 안이면 접근하지 않음(CSV 숫자는 불변) */
export const LONG_RANGE_CHASE_CAP = 0.16;
/** 근접 강습형은 장거리도 밀어붙임 */
export const CLOSE_ASSAULT_LONG_CHASE_CAP = 0.78;
export const MID_BEAM_CHASE_CAP = 0.4;
export const DEFAULT_LONG_RANGE_SPEND_MS = 3800;
export const CLOSE_ASSAULT_LONG_RANGE_SPEND_MS = 1800;
export const LONG_RANGE_HOLD_SPEND_MS = 5600;

/** 거리 하나로 판정하는 교전 단계 FSM — 경계값은 무기 CSV 유래 range bands */
export function combatMotionStageFromDist(
  dist: number,
  detectR: number,
  bands: CapitalCombatRangeBands,
): CombatMotionStage {
  if (dist > detectR + 6) return 'closing';
  if (dist > bands.missileMaxRangePx + CAPITAL_MISSILE_RANGE_LOOSEN_PX) return 'closing';
  if (dist > bands.laserBrawlOuterPx) return 'missile_pattern';
  if (dist > bands.laserBrawlInnerPx + 0.5) return 'missile_reposition';
  return 'brawl';
}

/** 단계별 기본 추격 가중 — 독트린 값(`default` = 추출 전 상수 1/0.42/0.16/0.3) */
export function chaseWeightForCombatStage(
  stage: CombatMotionStage,
  doctrine: CaptainTacticDoctrine = FALLBACK_DEFAULT_TACTIC_DOCTRINE,
): number {
  if (stage === 'closing') return doctrine.chaseClosing;
  if (stage === 'missile_pattern') return doctrine.chaseMissilePattern;
  if (stage === 'missile_reposition') return doctrine.chaseReposition;
  /** 브롤: 링 선회 비중↑ (`BRAWL_CHASE_WEIGHT_CAP`과 함께 직추격 억제) */
  return doctrine.chaseBrawl;
}

/** 판단 계층이 읽고(전체)·쓰는(kiteDist* · 운용/교착) 에이전트 상태 — `Agent`가 구조적으로 만족 */
export type ManeuverAgentState = {
  tempoRole: TempoRole;
  kiteEvasionMode: KiteEvasionMode;
  /** 거리벌림 중 저속 정체 시작 시각, null 이면 비정체 (본 모듈이 갱신) */
  kiteDistStallSinceMs: number | null;
  /** 0 초과이면 이 시각까지 적·전진 회복 항법 (본 모듈이 갱신) */
  kiteDistResumeAdvanceUntilMs: number;
  stallChaseBoostUntilMs: number;
  engageStartDelayMs: number;
  /** 함장 전술 독트린(Table-First) — 스폰 시 1회 바인딩(카탈로그 불변 참조) */
  doctrine: CaptainTacticDoctrine;
  stalemateSinceMs: number | null;
  /** 교착 시계를 켠 순간의 페어 거리 — 실제로 접근/이탈 중이면 교착 취소 */
  stalemateAnchorDist: number;
  stalemateBreakUntilMs: number;
  stalemateRearmUntilMs: number;
  stalemateBreakSeq: number;
  stalemateBreakKind: StalemateBreakKind;
  stalemateWeaponLock: boolean;
  bearingGoal: BearingGoal;
  forcedEmployBand: EmployBand | null;
  longRangeEmploySinceMs: number | null;
  longRangeSalvoSpent: number;
  lastPairDist: number;
  employBand: EmployBand;
  preferredWeapon: PreferredWeapon;
};

export type CapitalManeuverInput = {
  elapsedMs: number;
  /** 직전 프레임 기준 자·적 중심 거리(px) */
  pairDist: number;
  /** 탐지 거리(px) — detectRangeScale 반영 후 값 */
  detectRangePx: number;
  bands: CapitalCombatRangeBands;
  /** 현재 선속 크기(px/ms) — kite 정체 판정용 */
  speedPxPerMs: number;
  /** 팀 내 슬롯 index(0..) — standoff 곡선 후진 좌/우 방향 결정 */
  teamSlot: number;
  /**
   * true면 장착 무기 프로필로 운용·교착·방위를 판정.
   * false(테스트 기본)면 Phase 0 추격/FSM만 — 기존 단위테스트 불변.
   */
  weaponProfileReady: boolean;
  hasMissile: boolean;
  hasLaser: boolean;
  hasClose: boolean;
  selfHeadingRad: number;
  enemyHeadingRad: number;
  bearingToEnemyRad: number;
  /** 좌/우 선회 시드 — 보통 agent.id. 양 리드가 같은 teamSlot 0이어도 반대 현측 */
  maneuverSeed: number;
};

/** 틱당 판단 결과 — 호출 측 1회 사전 할당 버퍼에 in-place 기록 */
export type CapitalManeuverDecision = {
  combatStage: CombatMotionStage;
  /** 기세 판정 우선 반영 단계 — kite는 항상 거리벌리기로 취급 */
  navStage: CombatMotionStage;
  engageReady: boolean;
  chaseWeight: number;
  inKiteDistancing: boolean;
  /** 거리벌림 정체 복구: 적함 방향 일반 항법·전진 */
  kiteDistResumeAdvance: boolean;
  /** standoff 곡선 후진 이격(전진 금지) */
  openingReverseOnly: boolean;
  kiteReverseTurnSign: -1 | 1;
  /** 스탠드오프 링 거리 오프셋(px) — 독트린 press/kite 역할별(장거리 유지형 등). 0=현행 */
  standoffRingOffsetPx: number;
  employBand: EmployBand;
  preferredWeapon: PreferredWeapon;
  bearingGoal: BearingGoal;
  stalemateWeaponLock: boolean;
  /** 이번 틱 유지 링(px). 0이면 포즈가 단계 기본값 */
  holdPairDistPx: number;
};

export function createCapitalManeuverDecision(): CapitalManeuverDecision {
  return {
    combatStage: 'closing',
    navStage: 'closing',
    engageReady: false,
    chaseWeight: 1,
    inKiteDistancing: false,
    kiteDistResumeAdvance: false,
    openingReverseOnly: false,
    kiteReverseTurnSign: 1,
    standoffRingOffsetPx: 0,
    employBand: 'approach',
    preferredWeapon: 'any',
    bearingGoal: 'bow',
    stalemateWeaponLock: false,
    holdPairDistPx: 0,
  };
}

export function createManeuverEmploymentDefaults(): Pick<
  ManeuverAgentState,
  | 'stalemateSinceMs'
  | 'stalemateAnchorDist'
  | 'stalemateBreakUntilMs'
  | 'stalemateRearmUntilMs'
  | 'stalemateBreakSeq'
  | 'stalemateBreakKind'
  | 'stalemateWeaponLock'
  | 'bearingGoal'
  | 'forcedEmployBand'
  | 'longRangeEmploySinceMs'
  | 'longRangeSalvoSpent'
  | 'lastPairDist'
  | 'employBand'
  | 'preferredWeapon'
> {
  return {
    stalemateSinceMs: null,
    stalemateAnchorDist: 0,
    stalemateBreakUntilMs: 0,
    stalemateRearmUntilMs: 0,
    stalemateBreakSeq: 0,
    stalemateBreakKind: 0,
    stalemateWeaponLock: false,
    bearingGoal: 'bow',
    forcedEmployBand: null,
    longRangeEmploySinceMs: null,
    longRangeSalvoSpent: 0,
    lastPairDist: -1,
    employBand: 'approach',
    preferredWeapon: 'any',
  };
}

export function absWrappedAngleDelta(a: number, b: number): number {
  let d = a - b;
  d -= Math.PI * 2 * Math.round(d / (Math.PI * 2));
  return d < 0 ? -d : d;
}

export function longRangeSpendMsForTactic(tacticId: string): number {
  if (tacticId === 'close_assault') return CLOSE_ASSAULT_LONG_RANGE_SPEND_MS;
  if (tacticId === 'long_range_hold') return LONG_RANGE_HOLD_SPEND_MS;
  if (tacticId === 'hunter_finisher') return 2800;
  if (tacticId === 'skirmish_focus') return 4000;
  return DEFAULT_LONG_RANGE_SPEND_MS;
}

export function longRangeSalvoNeedForTactic(tacticId: string): number {
  if (tacticId === 'close_assault') return 1;
  if (tacticId === 'long_range_hold') return 3;
  return 2;
}

export function naturalBeamGoal(maneuverSeed: number): BearingGoal {
  return (maneuverSeed & 1) === 0 ? 'beam_port' : 'beam_starboard';
}

export function employBandLabelKo(band: EmployBand): string {
  if (band === 'approach') return '접근';
  if (band === 'standoff_long') return '장거리';
  if (band === 'mid') return '선회';
  return '근접';
}

/** 발사 루프 게이트 — 살보가 이미 시작됐으면 호출 측에서 완료를 우선한다. */
export function capitalWeaponFireAllowed(
  employBand: EmployBand,
  preferredWeapon: PreferredWeapon,
  kind: 'laser' | 'missile' | 'close',
  stalemateWeaponLock: boolean,
): boolean {
  if (preferredWeapon === 'any') return true;
  if (stalemateWeaponLock) return kind === preferredWeapon;
  if (employBand === 'approach' || employBand === 'standoff_long') return kind === 'missile';
  if (employBand === 'mid') return kind === 'laser' || kind === 'missile';
  return kind === 'laser' || kind === 'close';
}

function preferredWeaponForBand(
  band: EmployBand,
  hasMissile: boolean,
  hasLaser: boolean,
  hasClose: boolean,
): PreferredWeapon {
  if (band === 'approach' || band === 'standoff_long') {
    if (hasMissile) return 'missile';
    if (hasLaser) return 'laser';
    return hasClose ? 'close' : 'any';
  }
  if (band === 'mid') {
    if (hasLaser) return 'laser';
    if (hasMissile) return 'missile';
    return hasClose ? 'close' : 'any';
  }
  if (hasClose) return 'close';
  if (hasLaser) return 'laser';
  return hasMissile ? 'missile' : 'any';
}

function nextBearingAfterBreak(current: BearingGoal, maneuverSeed: number): BearingGoal {
  if (current === 'beam_port') return 'beam_starboard';
  if (current === 'beam_starboard') return 'stern';
  if (current === 'stern') return 'beam_port';
  return naturalBeamGoal(maneuverSeed) === 'beam_port' ? 'beam_starboard' : 'beam_port';
}

function applyStalemateBreak(state: ManeuverAgentState, input: CapitalManeuverInput): void {
  const kind = (state.stalemateBreakSeq % 3) as StalemateBreakKind;
  state.stalemateBreakSeq += 1;
  state.stalemateBreakKind = kind;
  state.stalemateBreakUntilMs = input.elapsedMs + PAIR_STALEMATE_BREAK_MS;
  state.stalemateSinceMs = null;
  state.stalemateWeaponLock = false;
  if (kind === 0) {
    state.bearingGoal = nextBearingAfterBreak(state.bearingGoal, input.maneuverSeed);
    if (state.employBand === 'approach' || state.employBand === 'standoff_long') {
      state.forcedEmployBand = 'mid';
    }
    return;
  }
  if (kind === 1) {
    const cur = state.forcedEmployBand ?? state.employBand;
    if (cur === 'standoff_long' || cur === 'approach') state.forcedEmployBand = 'mid';
    else state.forcedEmployBand = 'mid';
    if (state.bearingGoal === 'bow') state.bearingGoal = naturalBeamGoal(input.maneuverSeed);
    return;
  }
  state.stalemateWeaponLock = true;
  if (state.preferredWeapon === 'missile') {
    state.preferredWeapon = input.hasLaser ? 'laser' : input.hasClose ? 'close' : 'missile';
  } else if (state.preferredWeapon === 'laser') {
    state.preferredWeapon = input.hasClose ? 'close' : input.hasMissile ? 'missile' : 'laser';
  } else {
    state.preferredWeapon = input.hasLaser ? 'laser' : input.hasMissile ? 'missile' : 'close';
  }
  if (state.bearingGoal === 'bow') state.bearingGoal = naturalBeamGoal(input.maneuverSeed);
}

/**
 * 에이전트 1척의 이번 틱 기동 판단.
 * - `state`의 `kiteDistStallSinceMs`/`kiteDistResumeAdvanceUntilMs`·운용/교착 필드를 in-place 갱신.
 * - `out` 버퍼에 결과 기록 후 그대로 반환(할당 없음).
 */
export function resolveCapitalManeuverDecision(
  state: ManeuverAgentState,
  input: CapitalManeuverInput,
  out: CapitalManeuverDecision,
): CapitalManeuverDecision {
  const { elapsedMs, pairDist, detectRangePx, bands, speedPxPerMs, teamSlot } = input;
  const doctrine = state.doctrine ?? FALLBACK_DEFAULT_TACTIC_DOCTRINE;
  const combatStage = combatMotionStageFromDist(pairDist, detectRangePx, bands);
  // 우선순위 강제: 거리 판단보다 기세 판정 우선.
  // 기세 열세(kite)는 항상 거리벌리기 단계로 취급한다.
  const navStage: CombatMotionStage =
    state.tempoRole === 'kite' ? 'missile_reposition' : combatStage;
  const engageReady = elapsedMs >= state.engageStartDelayMs;

  let chaseW = chaseWeightForCombatStage(navStage, doctrine);
  if (state.tempoRole === 'press') {
    chaseW = Math.max(chaseW, doctrine.pressChaseFloor);
  } else {
    chaseW = Math.min(chaseW, doctrine.kiteChaseCap);
  }
  if (!engageReady) {
    // 시작 지연 중에는 즉시 교전으로 붙지 않도록 추격 강도 제한
    chaseW = Math.min(chaseW, doctrine.preEngageChaseCap);
  }
  if (elapsedMs < state.stallChaseBoostUntilMs) {
    if (state.tempoRole === 'press') {
      chaseW = Math.max(chaseW, doctrine.stallBoostPressFloor);
    } else {
      // 기세 열세(kite)는 정체 복구 중에도 거리벌리기 성향 유지
      chaseW = Math.min(chaseW, doctrine.stallBoostKiteCap);
    }
  }

  const inKiteDistancing = state.tempoRole === 'kite' && navStage === 'missile_reposition';
  if (state.kiteDistResumeAdvanceUntilMs > 0 && elapsedMs >= state.kiteDistResumeAdvanceUntilMs) {
    state.kiteDistResumeAdvanceUntilMs = 0;
  }
  if (!inKiteDistancing) {
    state.kiteDistStallSinceMs = null;
    state.kiteDistResumeAdvanceUntilMs = 0;
  } else if (engageReady) {
    const recovering =
      state.kiteDistResumeAdvanceUntilMs > 0 && elapsedMs < state.kiteDistResumeAdvanceUntilMs;
    if (recovering) {
      state.kiteDistStallSinceMs = null;
    } else if (speedPxPerMs < KITE_DIST_STALL_SPEED_PX_PER_MS) {
      if (state.kiteDistStallSinceMs === null) {
        state.kiteDistStallSinceMs = elapsedMs;
      } else if (elapsedMs - state.kiteDistStallSinceMs >= KITE_DIST_STALL_HOLD_MS) {
        state.kiteDistResumeAdvanceUntilMs = elapsedMs + KITE_DIST_RESUME_ADVANCE_MS;
        state.kiteDistStallSinceMs = null;
      }
    } else {
      state.kiteDistStallSinceMs = null;
    }
  }

  const kiteDistResumeAdvance =
    engageReady &&
    inKiteDistancing &&
    state.kiteDistResumeAdvanceUntilMs > 0 &&
    elapsedMs < state.kiteDistResumeAdvanceUntilMs;

  const openingReverseOnly =
    inKiteDistancing && state.kiteEvasionMode === 'standoff' && !kiteDistResumeAdvance;

  let employBand: EmployBand = 'approach';
  let preferredWeapon: PreferredWeapon = 'any';
  let bearingGoal: BearingGoal = 'bow';
  let stalemateWeaponLock = false;
  let holdPairDistPx = 0;

  if (input.weaponProfileReady) {
    const missileMax = bands.missileMaxRangePx + CAPITAL_MISSILE_RANGE_LOOSEN_PX;
    const minHold = bands.minHoldPairDistPx ?? bands.laserBrawlInnerPx;
    const inMissileBand =
      input.hasMissile && pairDist <= missileMax && pairDist > minHold + 8;
    const inFightRange = pairDist <= missileMax + 8 || pairDist <= bands.laserBrawlOuterPx + 8;
    const farOut = pairDist > missileMax + 40;
    const tacticId = doctrine.tacticId;
    const spendMs = longRangeSpendMsForTactic(tacticId);
    const salvoNeed = longRangeSalvoNeedForTactic(tacticId);

    if (farOut) {
      state.longRangeEmploySinceMs = null;
      state.longRangeSalvoSpent = 0;
    }

    const spendDone =
      !farOut &&
      ((state.longRangeEmploySinceMs !== null &&
        elapsedMs - state.longRangeEmploySinceMs >= spendMs) ||
        state.longRangeSalvoSpent >= salvoNeed);

    const inLaserBand = input.hasLaser && pairDist <= bands.laserBrawlOuterPx + 8;
    if (pairDist > missileMax + 6 && !inLaserBand) {
      employBand = 'approach';
    } else if (pairDist <= minHold + 0.5 && (input.hasClose || !input.hasMissile)) {
      employBand = 'brawl';
    } else if (inMissileBand && tacticId !== 'close_assault') {
      employBand = 'standoff_long';
    } else if (inMissileBand && tacticId === 'close_assault') {
      employBand =
        elapsedMs - (state.longRangeEmploySinceMs ?? elapsedMs) >= CLOSE_ASSAULT_LONG_RANGE_SPEND_MS
          ? 'mid'
          : 'standoff_long';
    } else {
      employBand = 'mid';
    }

    if (employBand === 'standoff_long') {
      if (state.longRangeEmploySinceMs === null) state.longRangeEmploySinceMs = elapsedMs;
    }

    if (state.stalemateBreakUntilMs > 0 && elapsedMs >= state.stalemateBreakUntilMs) {
      state.stalemateBreakUntilMs = 0;
      state.stalemateRearmUntilMs = elapsedMs + PAIR_STALEMATE_REARM_MS;
      state.stalemateWeaponLock = false;
      state.forcedEmployBand = null;
    }
    if (state.forcedEmployBand) {
      employBand = state.forcedEmployBand;
    }

    if (employBand === 'standoff_long' && state.bearingGoal === 'bow' && spendDone) {
      state.bearingGoal = naturalBeamGoal(input.maneuverSeed);
    }
    if (employBand === 'mid' && state.bearingGoal === 'bow' && spendDone) {
      state.bearingGoal = naturalBeamGoal(input.maneuverSeed);
    }
    if (employBand === 'approach') {
      state.bearingGoal = 'bow';
    } else if (employBand === 'standoff_long' && state.bearingGoal === 'bow') {
      // 장거리 페이즈는 선수 대적 유지 — 선회는 spend 이후
    } else if (employBand === 'brawl' && state.bearingGoal === 'bow') {
      state.bearingGoal = naturalBeamGoal(input.maneuverSeed);
    }

    preferredWeapon = preferredWeaponForBand(
      employBand,
      input.hasMissile,
      input.hasLaser,
      input.hasClose,
    );
    if (state.stalemateWeaponLock && state.stalemateBreakUntilMs > elapsedMs) {
      preferredWeapon = state.preferredWeapon;
    }

    const distDelta =
      state.lastPairDist < 0 ? 999 : Math.abs(pairDist - state.lastPairDist);
    const mutualBow =
      absWrappedAngleDelta(input.selfHeadingRad, input.bearingToEnemyRad) <=
        PAIR_STALEMATE_BOW_ALIGN_RAD &&
      absWrappedAngleDelta(input.enemyHeadingRad, input.bearingToEnemyRad + Math.PI) <=
        PAIR_STALEMATE_BOW_ALIGN_RAD;
    const frozenRing =
      distDelta < 10 &&
      speedPxPerMs < 0.01 &&
      pairDist > bands.laserBrawlInnerPx &&
      pairDist < missileMax + 20;
    const canJudgeStalemate =
      engageReady &&
      inFightRange &&
      elapsedMs >= state.engageStartDelayMs + 1200 &&
      elapsedMs >= state.stalemateRearmUntilMs &&
      !(state.stalemateBreakUntilMs > elapsedMs);
    const isStale =
      canJudgeStalemate &&
      distDelta <= PAIR_STALEMATE_DIST_DELTA_PX &&
      (mutualBow || frozenRing);

    if (state.stalemateBreakUntilMs > elapsedMs) {
      // 타파 유지
    } else if (isStale) {
      if (state.stalemateSinceMs === null) {
        state.stalemateSinceMs = elapsedMs;
        state.stalemateAnchorDist = pairDist;
      } else if (Math.abs(pairDist - state.stalemateAnchorDist) > PAIR_STALEMATE_PROGRESS_PX) {
        state.stalemateSinceMs = elapsedMs;
        state.stalemateAnchorDist = pairDist;
      } else if (elapsedMs - state.stalemateSinceMs >= PAIR_STALEMATE_DETECT_MS) {
        applyStalemateBreak(state, input);
        if (state.forcedEmployBand) employBand = state.forcedEmployBand;
        if (state.stalemateWeaponLock) preferredWeapon = state.preferredWeapon;
      }
    } else {
      state.stalemateSinceMs = null;
    }

    if (employBand === 'standoff_long') {
      const cap =
        tacticId === 'close_assault' ? CLOSE_ASSAULT_LONG_CHASE_CAP : LONG_RANGE_CHASE_CAP;
      chaseW = Math.min(chaseW, cap);
      if (pairDist < bands.missileIdealPairDistPx - 16) {
        chaseW = Math.min(chaseW, 0.06);
      }
    } else if (state.bearingGoal !== 'bow' && employBand === 'mid') {
      chaseW = Math.min(chaseW, MID_BEAM_CHASE_CAP);
    }

    if (employBand === 'standoff_long') holdPairDistPx = bands.missileIdealPairDistPx;
    else if (employBand === 'mid') holdPairDistPx = bands.laserEngageRangePx;
    else if (employBand === 'brawl') holdPairDistPx = minHold;

    bearingGoal = state.bearingGoal;
    stalemateWeaponLock = state.stalemateWeaponLock && state.stalemateBreakUntilMs > elapsedMs;
    state.employBand = employBand;
    state.preferredWeapon = preferredWeapon;
  } else {
    state.employBand = 'approach';
    state.preferredWeapon = 'any';
    state.bearingGoal = 'bow';
    state.stalemateWeaponLock = false;
  }

  state.lastPairDist = pairDist;

  out.combatStage = combatStage;
  out.navStage = navStage;
  out.engageReady = engageReady;
  out.chaseWeight = chaseW;
  out.inKiteDistancing = inKiteDistancing;
  out.kiteDistResumeAdvance = kiteDistResumeAdvance;
  out.openingReverseOnly = openingReverseOnly;
  out.kiteReverseTurnSign = Math.max(0, teamSlot) % 2 === 0 ? 1 : -1;
  out.standoffRingOffsetPx =
    state.tempoRole === 'press' ? doctrine.pressRingOffsetPx : doctrine.kiteRingOffsetPx;
  out.employBand = employBand;
  out.preferredWeapon = preferredWeapon;
  out.bearingGoal = bearingGoal;
  out.stalemateWeaponLock = stalemateWeaponLock;
  out.holdPairDistPx = holdPairDistPx;
  return out;
}

// ─── 기세(템포) 판정 — 가위바위보 ────────────────────────────────────────────

export function rollRpsHand(): RpsHand {
  return Math.floor(Math.random() * 3) as RpsHand;
}

export function rpsOutcome(a: RpsHand, b: RpsHand): 1 | -1 | 0 {
  if (a === b) return 0;
  if ((a + 1) % 3 === b) return -1;
  return 1;
}

/** 기세 판정이 읽고 쓰는 최소 상태 — `Agent`가 구조적으로 만족 */
export type TempoJudgeAgentState = {
  id: number;
  tempoRole: TempoRole;
  kiteEvasionMode: KiteEvasionMode;
  /** 독트린 기세 바이어스(%) — 없으면 0(현행 순수 랜덤) */
  doctrine?: { tempoWinBiasPct: number } | null;
};

export function applyTempoJudge(a: TempoJudgeAgentState, b: TempoJudgeAgentState): void {
  let ah = rollRpsHand();
  let bh = rollRpsHand();
  let out = rpsOutcome(ah, bh);
  for (let i = 0; i < 5 && out === 0; i++) {
    ah = rollRpsHand();
    bh = rollRpsHand();
    out = rpsOutcome(ah, bh);
  }
  if (out === 0) {
    out = a.id < b.id ? 1 : -1;
  }
  // 독트린 기세 바이어스: 순 바이어스(%)만큼의 확률로 우세 측을 강제(0이면 현행과 동일)
  const netBiasPct =
    (a.doctrine?.tempoWinBiasPct ?? 0) - (b.doctrine?.tempoWinBiasPct ?? 0);
  if (netBiasPct !== 0 && Math.random() < Math.min(0.9, Math.abs(netBiasPct) / 100)) {
    out = netBiasPct > 0 ? 1 : -1;
  }
  if (out > 0) {
    a.tempoRole = 'press';
    b.tempoRole = 'kite';
    /** 열세 측 거리벌림: 스탠드오프 후진 이격 OR 적 중심 광궤도 */
    b.kiteEvasionMode = Math.random() < 0.5 ? 'standoff' : 'planet_orbit';
  } else {
    a.tempoRole = 'kite';
    b.tempoRole = 'press';
    /** 열세 측 거리벌림: 스탠드오프 후진 이격 OR 적 중심 광궤도 */
    a.kiteEvasionMode = Math.random() < 0.5 ? 'standoff' : 'planet_orbit';
  }
}

/** 함대 기세 전파용 — `Agent`가 구조적으로 만족. orange(자유교전)는 대상 아님 */
export type FleetTempoMember = TempoJudgeAgentState & {
  team: 'red' | 'blue' | 'orange';
  alive: boolean;
};

/**
 * 리드 기세(RPS)를 같은 팀 생존 함선에 in-place 복사.
 * 윙맨이 스폰값 `press`로 남는 것을 막아 독트린·진형과 모순되지 않게 한다.
 */
export function propagateFleetTempoFromLeads(
  agents: FleetTempoMember[],
  redLead: TempoJudgeAgentState,
  blueLead: TempoJudgeAgentState,
): void {
  const redRole = redLead.tempoRole;
  const blueRole = blueLead.tempoRole;
  const redKite = redLead.kiteEvasionMode;
  const blueKite = blueLead.kiteEvasionMode;
  for (let i = 0; i < agents.length; i++) {
    const a = agents[i];
    if (!a?.alive) continue;
    if (a.team === 'red') {
      a.tempoRole = redRole;
      a.kiteEvasionMode = redKite;
    } else if (a.team === 'blue') {
      a.tempoRole = blueRole;
      a.kiteEvasionMode = blueKite;
    }
  }
}
