// ============================================================
// v2.0 — 선술집 레벨 → 바운티 슬롯·갱신 주기 메타 동기화
// (바운티 보드 본체는 tavernBoardStore — 향후 bounty 슬롯 확장)
// ============================================================

import { resolveTavernBountySlots, resolveTavernRefreshIntervalHours } from '../balance/facilityTavernLevelPolicy';
import { generateTavernBountyBoard } from '../../game/tavern/tavernBountyGenerator';
import { writeFacilityModuleDetail } from '../../game/planetDevelopment/planetFacilityModuleRuntime';
import {
  PLANET_DEV_MODULE_POPULATION_DOME,
  isPlanetPopulationDomeInstalled,
  readPlanetPopulationDomeDetail,
} from '../../game/planetDevelopment/planetPopulationDomeListing';
import { useClanWarFoundationStore } from '../../store/clanWarFoundationStore';
import { usePlayerStore } from '../../store/playerStore';
import type { PlanetClanHold } from '../../types';

export type TavernBountyRefreshPassResult = {
  ran: boolean;
  planetsRefreshed: number;
};

function isPlayerOwnedHold(hold: PlanetClanHold, playerUid: string | null | undefined): boolean {
  if (!playerUid) return false;
  return hold.homePlayerUid === playerUid || (hold.kind === 'player_home' && hold.homePlayerUid === playerUid);
}

export function runTavernBountyRefreshPass(nowMs = Date.now()): TavernBountyRefreshPassResult {
  const playerUid = usePlayerStore.getState().player?.uid ?? null;
  const holds = useClanWarFoundationStore.getState().planetHolds;
  let planetsRefreshed = 0;

  for (const [planetId, hold] of Object.entries(holds)) {
    if (!isPlayerOwnedHold(hold, playerUid)) continue;
    if (!isPlanetPopulationDomeInstalled(planetId)) continue;
    const detail = readPlanetPopulationDomeDetail(planetId);
    const intervalH = resolveTavernRefreshIntervalHours(detail.level);
    const intervalMs = intervalH * 3600 * 1000;
    const last = detail.lastBountyRefreshTimestamp ?? 0;
    const slots = resolveTavernBountySlots(detail.level);
    const needsRefresh = last <= 0 || nowMs - last >= intervalMs;
    const slotsChanged = detail.activeBountyCount !== slots;

    if (!needsRefresh && !slotsChanged) continue;

    writeFacilityModuleDetail(planetId, PLANET_DEV_MODULE_POPULATION_DOME, {
      ...detail,
      version: 1,
      activeBountyCount: slots,
      lastBountyRefreshTimestamp: needsRefresh ? nowMs : last,
      bountyBoard: needsRefresh
        ? generateTavernBountyBoard(planetId, detail.level, slots, nowMs, intervalH)
        : detail.bountyBoard,
      updatedAtMs: nowMs,
    });
    planetsRefreshed += 1;
  }

  return { ran: planetsRefreshed > 0, planetsRefreshed };
}
