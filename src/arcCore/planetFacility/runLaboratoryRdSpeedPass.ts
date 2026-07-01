// ============================================================
// v2.0 — 연구소 레벨 → 진행 중 R&D rdSpeedBonusPct 캐시 동기화
// (15단계 R&D 본체는 getEffectiveRdTimeHours 연동)
// ============================================================

import { resolveLaboratoryRdSpeedReductionPct } from '../balance/facilityLaboratoryLevelPolicy';
import { writeFacilityModuleDetail } from '../../game/planetDevelopment/planetFacilityModuleRuntime';
import {
  PLANET_DEV_MODULE_RESEARCH_LAB,
  isPlanetResearchLabInstalled,
  readPlanetResearchLabDetail,
} from '../../game/planetDevelopment/planetResearchLabListing';
import { useClanWarFoundationStore } from '../../store/clanWarFoundationStore';
import { usePlayerStore } from '../../store/playerStore';
import { isPlayerOwnedHold } from '../planetCore/resolvePlanetCoreStatContext';

export type LaboratoryRdSpeedPassResult = {
  ran: boolean;
  planetsUpdated: number;
};

export function runLaboratoryRdSpeedPass(): LaboratoryRdSpeedPassResult {
  const playerUid = usePlayerStore.getState().player?.uid ?? null;
  const holds = useClanWarFoundationStore.getState().planetHolds;
  let planetsUpdated = 0;

  for (const [planetId, hold] of Object.entries(holds)) {
    if (!isPlayerOwnedHold(hold, playerUid)) continue;
    if (!isPlanetResearchLabInstalled(planetId)) continue;
    const detail = readPlanetResearchLabDetail(planetId);
    const bonus = resolveLaboratoryRdSpeedReductionPct(detail.level);
    if (detail.rdSpeedBonusPct === bonus) continue;
    writeFacilityModuleDetail(planetId, PLANET_DEV_MODULE_RESEARCH_LAB, {
      ...detail,
      version: 1,
      rdSpeedBonusPct: bonus,
      updatedAtMs: Date.now(),
    });
    planetsUpdated += 1;
  }

  return { ran: planetsUpdated > 0, planetsUpdated };
}
