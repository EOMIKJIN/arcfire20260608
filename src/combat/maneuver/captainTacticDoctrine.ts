/**
 * 함장 전투 전술 독트린 — Table-First 카탈로그 (Phase 1 · 2026-07-22)
 *
 * 정본: `tables/balance/captain_tactic_doctrine.csv` (전술 파라미터)
 *      + `tables/balance/captain_tactic_assignment.csv` (함장 → 전술 배정, `__default__` 폴백)
 *
 * 계약:
 * - 인덱스는 모듈 레벨 1회 빌드(O(1) Map 조회) — 렌더/틱 경로 재빌드 금지.
 * - 독트린 객체는 카탈로그가 소유하는 불변 참조 — 에이전트는 스폰 시 참조만 바인딩.
 * - `default` 독트린 수치는 추출 전 하드코딩 상수와 100% 동일해야 한다
 *   (기존값 변경 시 사전 재확인 규칙 — `arcfire-existing-value-change-confirm.mdc`).
 * - 에셋 import 없음(tsx 테스트 직접 실행 가능).
 */

import { CaptainTacticDoctrine_FROM_BALANCE_CSV } from '../../data/balance/generated/csvCaptainTacticDoctrine';
import { CaptainTacticAssignment_FROM_BALANCE_CSV } from '../../data/balance/generated/csvCaptainTacticAssignment';

/** 표적 선택 우선순위 — nearest: 최근접(현행) · focus_fire: 팀 리드 표적 집중 · lowest_hull: 최저 선체 우선 */
export type TacticTargetPriority = 'nearest' | 'focus_fire' | 'lowest_hull';
/** 진형 — none: 현행(스폰 슬롯만) · line: 리드 기준 라인 유지 */
export type TacticFormationType = 'none' | 'line';

export type CaptainTacticDoctrine = {
  tacticId: string;
  /** 교전 단계별 기본 추격 가중 */
  chaseClosing: number;
  chaseMissilePattern: number;
  chaseReposition: number;
  chaseBrawl: number;
  /** 기세 우세(press) 시 추격 하한 */
  pressChaseFloor: number;
  /** 기세 열세(kite) 시 추격 상한 */
  kiteChaseCap: number;
  /** 교전 시작 지연 중 추격 상한 */
  preEngageChaseCap: number;
  /** 무기 정체 부스트: press 하한 / kite 상한 */
  stallBoostPressFloor: number;
  stallBoostKiteCap: number;
  /** 스탠드오프 링 거리 오프셋(px) — press/kite 역할별. +면 더 먼 거리 유지(장거리형) */
  pressRingOffsetPx: number;
  kiteRingOffsetPx: number;
  targetPriority: TacticTargetPriority;
  formationType: TacticFormationType;
  /** 진형 응집 블렌드 가중(0=진형 없음 · 현행) */
  formationCohesion: number;
  /** 진형 슬롯 간격(px) — 0이면 레이어 기본값 사용 */
  formationSpacingPx: number;
  /** 기세(가위바위보) 승률 바이어스(%) — +면 press 선호 */
  tempoWinBiasPct: number;
  tacticLabelKo: string;
};

function num(v: string | undefined, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function parseTargetPriority(v: string | undefined): TacticTargetPriority {
  if (v === 'focus_fire' || v === 'lowest_hull') return v;
  return 'nearest';
}

function parseFormationType(v: string | undefined): TacticFormationType {
  if (v === 'line') return 'line';
  return 'none';
}

/** CSV 부재·행 누락 시 하드 폴백 — 추출 전 상수와 동일(현행 동작) */
export const FALLBACK_DEFAULT_TACTIC_DOCTRINE: CaptainTacticDoctrine = Object.freeze({
  tacticId: 'default',
  chaseClosing: 1,
  chaseMissilePattern: 0.42,
  chaseReposition: 0.16,
  chaseBrawl: 0.3,
  pressChaseFloor: 0.9,
  kiteChaseCap: 0.24,
  preEngageChaseCap: 0.28,
  stallBoostPressFloor: 0.88,
  stallBoostKiteCap: 0.32,
  pressRingOffsetPx: 0,
  kiteRingOffsetPx: 0,
  targetPriority: 'nearest',
  formationType: 'none',
  formationCohesion: 0,
  formationSpacingPx: 0,
  tempoWinBiasPct: 0,
  tacticLabelKo: '표준 교전',
});

let doctrineIndexCache: Map<string, CaptainTacticDoctrine> | null = null;
let assignmentIndexCache: Map<string, string> | null = null;

function getDoctrineIndex(): Map<string, CaptainTacticDoctrine> {
  if (doctrineIndexCache) return doctrineIndexCache;
  const map = new Map<string, CaptainTacticDoctrine>();
  for (const row of CaptainTacticDoctrine_FROM_BALANCE_CSV) {
    const tacticId = String(row.tacticId ?? '').trim();
    if (!tacticId) continue;
    const fb = FALLBACK_DEFAULT_TACTIC_DOCTRINE;
    map.set(
      tacticId,
      Object.freeze({
        tacticId,
        chaseClosing: num(row.chaseClosing, fb.chaseClosing),
        chaseMissilePattern: num(row.chaseMissilePattern, fb.chaseMissilePattern),
        chaseReposition: num(row.chaseReposition, fb.chaseReposition),
        chaseBrawl: num(row.chaseBrawl, fb.chaseBrawl),
        pressChaseFloor: num(row.pressChaseFloor, fb.pressChaseFloor),
        kiteChaseCap: num(row.kiteChaseCap, fb.kiteChaseCap),
        preEngageChaseCap: num(row.preEngageChaseCap, fb.preEngageChaseCap),
        stallBoostPressFloor: num(row.stallBoostPressFloor, fb.stallBoostPressFloor),
        stallBoostKiteCap: num(row.stallBoostKiteCap, fb.stallBoostKiteCap),
        pressRingOffsetPx: num(row.pressRingOffsetPx, 0),
        kiteRingOffsetPx: num(row.kiteRingOffsetPx, 0),
        targetPriority: parseTargetPriority(row.targetPriority),
        formationType: parseFormationType(row.formationType),
        formationCohesion: Math.max(0, Math.min(1, num(row.formationCohesion, 0))),
        formationSpacingPx: Math.max(0, num(row.formationSpacingPx, 0)),
        tempoWinBiasPct: num(row.tempoWinBiasPct, 0),
        tacticLabelKo: String(row.tacticLabelKo ?? '').trim() || tacticId,
      }),
    );
  }
  doctrineIndexCache = map;
  return map;
}

function getAssignmentIndex(): Map<string, string> {
  if (assignmentIndexCache) return assignmentIndexCache;
  const map = new Map<string, string>();
  for (const row of CaptainTacticAssignment_FROM_BALANCE_CSV) {
    const captainId = String(row.captainId ?? '').trim();
    const tacticId = String(row.tacticId ?? '').trim();
    if (!captainId || !tacticId) continue;
    map.set(captainId, tacticId);
  }
  assignmentIndexCache = map;
  return map;
}

/** 전술 id → 독트린. 미존재 시 `default` → 하드 폴백 순 */
export function getCaptainTacticDoctrine(tacticId: string | null | undefined): CaptainTacticDoctrine {
  const idx = getDoctrineIndex();
  if (tacticId) {
    const found = idx.get(tacticId.trim());
    if (found) return found;
  }
  return idx.get('default') ?? FALLBACK_DEFAULT_TACTIC_DOCTRINE;
}

/** 함장 id → 배정 전술 독트린. 배정 없으면 `__default__` 행 → default 독트린 */
export function resolveDoctrineForCaptain(captainId: string | null | undefined): CaptainTacticDoctrine {
  const assign = getAssignmentIndex();
  const tacticId =
    (captainId ? assign.get(captainId.trim()) : undefined) ?? assign.get('__default__');
  return getCaptainTacticDoctrine(tacticId);
}

export function listCaptainTacticDoctrines(): CaptainTacticDoctrine[] {
  return [...getDoctrineIndex().values()];
}
