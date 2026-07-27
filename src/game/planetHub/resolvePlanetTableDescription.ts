// ============================================================
// planets.csv description — Table-First 단일 조회 (행성 정보 UI·스냅샷 공용)
// ============================================================

import { findPlanetById } from '../../arcCore/planetEnvironment/resolvePlanetAsteroidVisualPolicy';
import { resolvePlanetDescription } from '../../i18n/systemText';
import { resolvePlanetInfoPanelPresentation } from './resolvePlanetInfoPanelStage';
import { withRuntimeNationPrefix } from '../../world/resolvePlanetRuntimeNationDisplay';
import type { AppLocale } from '../../i18n/types';

/**
 * `planets.csv` + `planet_info_panel_stage.csv` 단계 설명.
 * 반환 직전 단일 지점에서 정적 `[국가:…]` 접두(있으면 제거)를 런타임 hold 기준으로 재작성한다
 * (2026-07-27) — stage 설명도 내부적으로 `resolvePlanetDescription` 폴백을 타는 경로가 있어
 * (`resolvePlanetInfoPanelStage.ts` `pickDescription`), 분기별로 따로 감싸지 않고 최종 반환값
 * 1곳에서만 적용해 모든 소비처(행성정보·스냅샷)가 항상 동일하게 동기화되도록 한다.
 */
export function resolvePlanetTableDescription(planetId: string, locale: AppLocale): string {
  const pres = resolvePlanetInfoPanelPresentation(planetId, locale);
  const raw = pres.description.trim() || (() => {
    const planet = findPlanetById(planetId);
    return planet ? resolvePlanetDescription(planet, locale, planet.systemId) : '';
  })();
  if (!raw) return '';
  return withRuntimeNationPrefix(raw, planetId, locale);
}

// 총사령관 이름 줄을 덧붙이던 resolvePlanetInfoPanelDescription은 제거됨(2026-07-19)
// — 행성 정보창의 총사령관 포트레이트 카드(`PlanetInfoGovernorCard`)와 중복 표기였다.
