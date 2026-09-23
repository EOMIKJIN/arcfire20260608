// ============================================================
// 점령 성공 EXP 지급 판정 — 스토어 의존 없음
// ============================================================

export const GOVERNOR_OCCUPATION_CAPTURE_SOURCE = 'arc_core_territorial';

export function shouldGrantGovernorOccupationCaptureExp(input: {
  changed: boolean;
  factionSide: 'BLUE' | 'RED' | 'NEUTRAL';
  source: unknown;
}): boolean {
  if (!input.changed) return false;
  if (input.factionSide !== 'BLUE' && input.factionSide !== 'RED') return false;
  return input.source === GOVERNOR_OCCUPATION_CAPTURE_SOURCE;
}
