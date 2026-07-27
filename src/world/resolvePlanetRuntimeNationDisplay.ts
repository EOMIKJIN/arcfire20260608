// ============================================================
// 성계 점유(hold) 런타임 → 행성정보 「국가」표시 단일 해석기
// (M0~M1, 2026-07-27) — 국경(Voronoi)·월드맵 국가 라벨과 동일 판정 규칙 재사용.
// 지도가 이미 정답인데 행성정보만 CSV 고정 [국가:…]를 그대로 보여주던 불일치를 없앤다.
// 순수 계산은 resolvePlanetRuntimeNationDisplayCore.ts — 이 파일은 store 조회 글루만.
// ============================================================

import { useClanWarFoundationStore } from '../store/clanWarFoundationStore';
import { resolveMapFactionSideFromClanId } from '../galaxyMap/resolveMapFactionSide';
import { usePlayerStore } from '../store/playerStore';
import type { AppLocale } from '../i18n/types';
import { resolveNationDisplayForSide, withRuntimeNationPrefixForSide } from './resolvePlanetRuntimeNationDisplayCore';

export { stripNationDescriptionPrefix } from './resolvePlanetRuntimeNationDisplayCore';

/**
 * planetId → 런타임 hold 기준 표시용 국가명. 중립이면 null(접두 없음).
 * 지도와 동일하게 `resolveMapFactionSideFromClanId`(occupierClanId → blue/red/independent/neutral)를
 * 그대로 재사용 — 별도 판정 로직을 만들지 않는다(국경·라벨·행성정보 3곳이 항상 같은 답을 내도록).
 * 렌더/useMemo에서 호출 가능(동기 getState 조회만, dispatch·전 행성 루프·persist 없음).
 */
export function resolvePlanetRuntimeNationDisplay(
  planetId: string,
  locale: AppLocale,
): string | null {
  const hold = useClanWarFoundationStore.getState().getHold(planetId);
  const side = resolveMapFactionSideFromClanId(hold?.occupierClanId);
  const nickname = usePlayerStore.getState().player?.nickname ?? '';
  return resolveNationDisplayForSide(side, locale, nickname);
}

/** 정적 접두 제거 후 런타임 hold 기준으로 재접두(중립이면 접두 없이 본문만). */
export function withRuntimeNationPrefix(raw: string, planetId: string, locale: AppLocale): string {
  const hold = useClanWarFoundationStore.getState().getHold(planetId);
  const side = resolveMapFactionSideFromClanId(hold?.occupierClanId);
  const nickname = usePlayerStore.getState().player?.nickname ?? '';
  return withRuntimeNationPrefixForSide(raw, side, locale, nickname);
}
