import { WorldExpansionTimingPolicy_FROM_BALANCE_CSV } from '../../src/data/balance/generated';
import { GALAXY_SYSTEMS } from '../../src/data/galaxy100';
import type { ArcCoreWorldExpansionGlobalPolicy } from '../../src/arcCore/worldExpansionGlobalPolicy';
import { buildGlobalSynthUnlockTargetIds } from '../../src/arcCore/worldExpansionGlobalSchedule';
import type { ZoneType } from '../../src/types';

export type ColonizedSynthPlanetTarget = {
  systemId: string;
  planetId: string;
  zone: ZoneType;
};

function policyFromBalanceCsv(): ArcCoreWorldExpansionGlobalPolicy {
  const row = WorldExpansionTimingPolicy_FROM_BALANCE_CSV[0];
  if (!row) {
    throw new Error('world_expansion_timing_policy.csv empty');
  }
  return {
    globalScheduleEnabled: String(row.globalScheduleEnabled).toLowerCase() === 'true',
    epochDayKey: String(row.epochDayKey),
    timeZone: String(row.timeZone),
    resetGeneration: Math.max(1, Number(row.resetGeneration) || 1),
    systemsPerDay: Math.max(1, Number(row.systemsPerDay) || 1),
    source: 'csv',
  };
}

/** CSV epoch 기준 현재 일일개방(개척) synth 행성. 정본 21코어 제외. */
export function listColonizedSynthPlanetTargets(nowMs = Date.now()): {
  asOfDayKey: string;
  policyEpoch: string;
  targets: ColonizedSynthPlanetTarget[];
} {
  const policy = policyFromBalanceCsv();
  const { targetSynthIds } = buildGlobalSynthUnlockTargetIds(
    GALAXY_SYSTEMS,
    policy,
    nowMs,
    [],
    false,
  );
  const targets: ColonizedSynthPlanetTarget[] = [];
  for (const systemId of targetSynthIds) {
    const sys = GALAXY_SYSTEMS[systemId];
    if (!sys) continue;
    for (const planet of sys.planets) {
      if (!planet?.id) continue;
      targets.push({ systemId, planetId: planet.id, zone: sys.zone });
    }
  }
  return {
    asOfDayKey: new Date(nowMs).toISOString().slice(0, 10),
    policyEpoch: policy.epochDayKey,
    targets,
  };
}
