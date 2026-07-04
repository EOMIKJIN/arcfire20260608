// ============================================================
// CSV occupation 시드 — hydrate · AI 동기화 · repair 단일 파이프라인
// ============================================================

import {
  seedPlanetOccupationHoldsFromBalance,
  ARC_CORE_SEED_BLUE_CLAN_ID,
  ARC_CORE_SEED_RED_CLAN_ID,
} from '../arcCore/balance/seedPlanetOccupationFromBalance';
import { migratePlanetHoldsOwnershipSplit } from './planetOwnershipModel';
import type { ClanBasicsRecord, PlanetClanHold } from '../types';

export type PlanetOccupationSeedPipelineResult = {
  holds: Record<string, PlanetClanHold>;
  clans: Record<string, ClanBasicsRecord>;
  mutated: boolean;
  /** occupierClanId 가 바뀐 행성 — 총사령관 재배정용 */
  occupierChangedPlanetIds: string[];
};

function collectOccupierChanges(
  before: Record<string, PlanetClanHold>,
  after: Record<string, PlanetClanHold>,
): string[] {
  const changed: string[] = [];
  for (const planetId of Object.keys(after)) {
    if (before[planetId]?.occupierClanId !== after[planetId]?.occupierClanId) {
      changed.push(planetId);
    }
  }
  return changed;
}

/** loadLocalClanWarFoundation · syncNpcAiClanTerritory 후처리 공용 — idempotent */
export function applyPlanetOccupationSeedPipeline(
  existingHolds: Record<string, PlanetClanHold>,
  existingClans: Record<string, ClanBasicsRecord>,
): PlanetOccupationSeedPipelineResult {
  const seeded = seedPlanetOccupationHoldsFromBalance(existingHolds);
  const migrated = migratePlanetHoldsOwnershipSplit(seeded.holds);
  const clans = { ...existingClans, ...seeded.clans };
  const clansChanged =
    clans[ARC_CORE_SEED_BLUE_CLAN_ID]?.displayName !==
      existingClans[ARC_CORE_SEED_BLUE_CLAN_ID]?.displayName
    || clans[ARC_CORE_SEED_RED_CLAN_ID]?.displayName !==
      existingClans[ARC_CORE_SEED_RED_CLAN_ID]?.displayName;
  const occupierChangedPlanetIds = collectOccupierChanges(existingHolds, migrated.holds);

  return {
    holds: migrated.holds,
    clans,
    mutated: seeded.holdsMutated || migrated.changed || clansChanged,
    occupierChangedPlanetIds,
  };
}
