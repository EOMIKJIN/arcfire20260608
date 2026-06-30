// ============================================================
// 행성개발 시설 레벨 적용 — 스탯 nudge + 완료 알림(단일 진입)
// ============================================================

import { applyPlanetFacilityLevelUpBenefits } from '../../arcCore/planetDevelopment/planetDevelopmentLevelBenefits';
import { flushPlanetCoreRuntimePersist } from '../../store/planetCoreRuntimeStore';
import { showPlanetFacilityLevelUpNotification } from './showPlanetFacilityLevelUpNotification';

function syncPlanetInfoAfterDevChange(planetId: string): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { syncPlanetWorldInfoPresentation } =
      require('../planetHub/syncPlanetWorldInfoPresentation') as typeof import('../planetHub/syncPlanetWorldInfoPresentation');
    syncPlanetWorldInfoPresentation(planetId);
  } catch {
    /* optional sync */
  }
}

/** 설치·레벨업·즉시완료 등 플레이어-facing 완료 시 호출(CSV baseline materialize 제외) */
export function finalizePlanetFacilityLevelApplied(
  planetId: string,
  facilityType: string,
  newLevel: number,
): void {
  if (!planetId || !facilityType || newLevel <= 0) return;
  applyPlanetFacilityLevelUpBenefits(planetId, facilityType, newLevel);
  syncPlanetInfoAfterDevChange(planetId);
  showPlanetFacilityLevelUpNotification(planetId, facilityType, newLevel);
  void flushPlanetCoreRuntimePersist();
}
