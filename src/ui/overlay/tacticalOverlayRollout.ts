/**
 * Tactical Archive (G-ARCHIVE) UI — 기준 확정 · 점진 롤아웃 레지스트리
 *
 * 2026-06-18: 행성정보(planetEconomyInfo) 모달 기준으로 범용 셸 스타일 확정.
 * 2026-06-25: settings · planetDevelopment · tradeQuantity · waveResult + 허브 버튼 톤 (Phase T1).
 * 2026-06-25: bmShop · alert — 미구현·단순 셸 (Phase T1 보류 판단 정정).
 */
import type { ArcOverlayKind } from './arcOverlayStore';

export type ArcOverlayVisualTheme = 'phosphor' | 'tactical';

/** 범용 tactical 셸·토큰 기준 확정일 (전면 교체 착수 전 리그레션 기준점) */
export const TACTICAL_UI_BASELINE_FROZEN_AT = '2026-06-18';

/** false → 행성정보만 즉시 phosphor 복구 (kind 플래그와 동기) */
export const TACTICAL_OVERLAY_PREVIEW_PLANET_ECONOMY = true;

/**
 * kind 별 tactical 적용 — true 일 때만 `visualTheme='tactical'`.
 * 전면 교체 시 kind 를 하나씩 true 로 전환한다.
 */
export const TACTICAL_OVERLAY_KIND_FLAGS: Readonly<Record<ArcOverlayKind, boolean>> = {
  planetEconomyInfo: TACTICAL_OVERLAY_PREVIEW_PLANET_ECONOMY,
  settings: true,
  planetDevelopment: true,
  tradeQuantity: true,
  waveResult: true,
  alert: true,
  levelUp: true,
  reward: true,
  narrative: true,
  blocking: true,
  bmShop: true,
  nearbyPresenceInfo: true,
  relicLore: true,
};

/** tactical 활성 kind 목록 (감사·리포트용) */
export function listTacticalEnabledOverlayKinds(): ArcOverlayKind[] {
  return (Object.keys(TACTICAL_OVERLAY_KIND_FLAGS) as ArcOverlayKind[]).filter(
    (kind) => TACTICAL_OVERLAY_KIND_FLAGS[kind],
  );
}

/** 단일 진입점 — Content 는 kind 만 넘기면 visualTheme 가 결정된다. */
export function resolveArcOverlayVisualTheme(kind: ArcOverlayKind): ArcOverlayVisualTheme {
  return TACTICAL_OVERLAY_KIND_FLAGS[kind] ? 'tactical' : 'phosphor';
}

/** @deprecated `resolveArcOverlayVisualTheme('planetEconomyInfo')` 사용 */
export function resolvePlanetEconomyOverlayVisualTheme(): ArcOverlayVisualTheme {
  return resolveArcOverlayVisualTheme('planetEconomyInfo');
}
