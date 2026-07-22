/**
 * 전함 진형(formation) 공급자 — Phase 2 (2026-07-22)
 *
 * 진형은 특수 케이스가 아니라 "목표 포즈 공급자 1종"이다:
 * 판단 계층이 채택 여부(독트린 `formationType`·`formationCohesion`)를 정하고,
 * 본 모듈은 리드 기준 슬롯 앵커 포즈만 계산한다. 최종 반영은 레이어의
 * 포즈 블렌드(cohesion 가중)로 수행 — 물리(`integrateAgentKinematics`)는 불변.
 *
 * 메모리: 호출 측 사전 할당 버퍼에 in-place 기록(틱당 할당 0). 에셋 import 없음.
 */

export type FormationAnchorPose = { x: number; y: number; headingRad: number };

export function createFormationAnchorPose(): FormationAnchorPose {
  return { x: 0, y: 0, headingRad: 0 };
}

/** 진형 슬롯 간격 기본값(px) — 독트린 `formationSpacingPx=0`일 때 사용 */
export const FORMATION_DEFAULT_SPACING_PX = 64;
/** 후열 오프셋 비율 — 슬롯 랭크당 리드 후방으로 물러나는 거리(간격 대비) */
export const FORMATION_LINE_BACK_RATIO = 0.4;

/**
 * 라인 진형 앵커 — 리드 헤딩에 수직인 라인 위, 슬롯 홀/짝 좌·우 교차 배치.
 * slot 0 = 리드 자신(호출 측에서 제외). slot 1,2 → 1랭크 좌/우, 3,4 → 2랭크 …
 * 결과는 맵(궤도 사각형) 안으로 클램프.
 */
export function resolveLineFormationAnchor(
  out: FormationAnchorPose,
  lead: { x: number; y: number; headingRad: number },
  slotIndex: number,
  spacingPx: number,
  margin: number,
  orbitSize: number,
): FormationAnchorPose {
  const spacing = spacingPx > 0 ? spacingPx : FORMATION_DEFAULT_SPACING_PX;
  const slot = Math.max(1, Math.floor(slotIndex));
  const rank = Math.ceil(slot / 2);
  const side = slot % 2 === 1 ? 1 : -1;
  const fx = Math.cos(lead.headingRad);
  const fy = Math.sin(lead.headingRad);
  // 리드 헤딩 좌표계: 수직(라인) 방향 + 랭크당 소폭 후열
  const px = -fy;
  const py = fx;
  const lateral = side * rank * spacing;
  const back = rank * spacing * FORMATION_LINE_BACK_RATIO;
  const rawX = lead.x + px * lateral - fx * back;
  const rawY = lead.y + py * lateral - fy * back;
  out.x = Math.min(orbitSize - margin, Math.max(margin, rawX));
  out.y = Math.min(orbitSize - margin, Math.max(margin, rawY));
  out.headingRad = lead.headingRad;
  return out;
}
