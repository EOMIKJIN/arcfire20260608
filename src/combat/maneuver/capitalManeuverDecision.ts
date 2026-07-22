/**
 * 전함 교전 기동 — 판단(결정) 계층 (Phase 0 · 2026-07-22)
 *
 * `PlanetEdenRaidTestLayer` 틱 루프에 인라인으로 흩어져 있던 "전술 판단" 로직을
 * 행동 불변(behavior-identical)으로 추출한 순수 모듈.
 *
 * 계층 계약:
 * - 이 모듈 = 판단(교전 단계 FSM · 기세 역할 · 추격 가중 · kite 정체 상태기계).
 * - `compositeNavigatePose` = 포즈 블렌더(목표 좌표·헤딩 합성).
 * - `integrateAgentKinematics` = 물리(서지·선회·가속 적분).
 *
 * 메모리 규율: 매 틱 호출되므로 신규 할당 금지 — 결정 결과는 호출 측이 1회
 * 사전 할당한 `CapitalManeuverDecision` 버퍼에 in-place 기록한다.
 * 에셋 import 없음(테스트에서 tsx 직접 실행 가능).
 *
 * 이후 Phase 1(전술 독트린 CSV) · Phase 2(진형 공급자) · Phase 3(표적 선택 다변화)는
 * 이 모듈의 입력/출력 계약 위에 얹는다 — 틱 본문에 if 분기를 다시 늘리지 말 것.
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

/** 판단 계층이 읽고(전체)·쓰는(kiteDist*) 에이전트 상태 — `Agent`가 구조적으로 만족 */
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
  };
}

/**
 * 에이전트 1척의 이번 틱 기동 판단.
 * - `state`의 `kiteDistStallSinceMs`/`kiteDistResumeAdvanceUntilMs`를 in-place 갱신.
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
