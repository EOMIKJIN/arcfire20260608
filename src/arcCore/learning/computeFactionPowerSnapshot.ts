// ============================================================
// 라이브 스토어 → 전력 스냅샷 (일 1회·온디맨드 · persist 없음)
// ============================================================

import { getGovernorReserveCommanderById } from '../../game/planetGovernor/planetGovernorReservePool';
import { getPlanetGovernorAssignment } from '../../game/planetGovernor/planetGovernorAssignmentStore';
import { useArcCoreVaultStore } from '../../store/factionVault/arcCoreVaultStore';
import { useBlueTeamSharedVaultStore } from '../../store/factionVault/blueTeamSharedVaultStore';
import { useClanWarFoundationStore } from '../../store/clanWarFoundationStore';
import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';
import { evaluateFactionPowerSnapshot } from './evaluateFactionPowerSnapshot';
import { gatherFactionPowerTableInputs } from './gatherFactionPowerTableInputs';
import { listScenarioCorePlanetIds } from '../territorial/resolveMaginotExternalSupply';
import type { FactionPowerEvaluateInput, FactionPowerSnapshot } from './factionPowerTypes';

function readVaultBalance(getBalance: () => number): number | null {
  try {
    const n = getBalance();
    return Number.isFinite(n) ? n : 0;
  } catch {
    return null;
  }
}

export function gatherFactionPowerLiveInputs(nowMs = Date.now()): FactionPowerEvaluateInput {
  const war = useClanWarFoundationStore.getState();
  const core = usePlanetCoreRuntimeStore.getState();
  const holdByPlanetId: Record<string, { occupierClanId?: string; kind?: string }> = {};
  const pgpByPlanetId: Record<string, number> = {};
  const governorsByPlanetId: Record<string, { side: 'BLUE' | 'RED' | 'NEUTRAL'; tacticsGrade: number }> = {};

  if (war.hydrated) {
    for (const [planetId, hold] of Object.entries(war.planetHolds)) {
      holdByPlanetId[planetId] = {
        occupierClanId: hold.occupierClanId,
        kind: hold.kind,
      };
    }
  }

  if (core.hydrated) {
    for (const [planetId, rec] of Object.entries(core.byPlanetId)) {
      if (typeof rec.pgp === 'number' && Number.isFinite(rec.pgp)) {
        pgpByPlanetId[planetId] = rec.pgp;
      }
    }
  }

  const coreIds = listScenarioCorePlanetIds();
  for (let i = 0; i < coreIds.length; i += 1) {
    const planetId = coreIds[i]!;
    const assignment = getPlanetGovernorAssignment(planetId);
    if (!assignment) continue;
    const reserve = getGovernorReserveCommanderById(assignment.captainId);
    governorsByPlanetId[planetId] = {
      side: assignment.occupationSide,
      tacticsGrade: reserve?.combatTacticsGrade ?? 0,
    };
  }

  const liveHolds = Object.keys(holdByPlanetId).length > 0;
  return gatherFactionPowerTableInputs({
    nowMs,
    holdByPlanetId: liveHolds ? holdByPlanetId : undefined,
    pgpByPlanetId: Object.keys(pgpByPlanetId).length > 0 ? pgpByPlanetId : undefined,
    governorsByPlanetId,
    vaults: {
      blue: readVaultBalance(() => useBlueTeamSharedVaultStore.getState().getBalance()),
      redArcCore: readVaultBalance(() => useArcCoreVaultStore.getState().getBalance()),
    },
    source: liveHolds || core.hydrated ? 'live_stores' : 'table_seed',
  });
}

export function computeFactionPowerSnapshotFromStores(nowMs = Date.now()): FactionPowerSnapshot {
  return evaluateFactionPowerSnapshot(gatherFactionPowerLiveInputs(nowMs));
}

export function computeFactionPowerSnapshotFromTables(nowMs = Date.now()): FactionPowerSnapshot {
  return evaluateFactionPowerSnapshot(gatherFactionPowerTableInputs({ nowMs, source: 'table_seed' }));
}
