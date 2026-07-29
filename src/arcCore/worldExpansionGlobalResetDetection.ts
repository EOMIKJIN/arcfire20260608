// ============================================================
// 전역 성계 개방 — 세대/epoch mismatch(hardReset) 순수 판정 (2026-07-29)
// 스토어/AsyncStorage 의존 없음 — syncArcCoreGlobalWorldExpansion.ts가 감싸서 사용.
// ============================================================

export type AppliedGlobalExpansionEpochState = {
  resetGeneration: number;
  epochDayKey: string;
};

/**
 * 저장된 `applied`(직전 sync 결과)와 현재 정책의 세대/epoch가 다르면 hardReset.
 * `applied === null`(과거 기록 없음 + 정책 존재)도 hardReset — 스펙 M1.
 * `applied === undefined`(아직 하이드레이트 전, 동기 호출 캐시 레이스)는 안전 기본값 false —
 * 파괴적 remove를 함부로 하지 않고 다음 호출에서 재판정한다.
 */
export function resolveWorldExpansionHardReset(
  applied: AppliedGlobalExpansionEpochState | null | undefined,
  policy: AppliedGlobalExpansionEpochState,
): boolean {
  if (applied === undefined) return false;
  if (applied === null) return true;
  return applied.resetGeneration !== policy.resetGeneration || applied.epochDayKey !== policy.epochDayKey;
}
