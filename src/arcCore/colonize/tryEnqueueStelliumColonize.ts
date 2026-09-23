import { resolveHoldFactionSide } from '../territorial/territorialFactionSide';
import { isPlanetContestedZone, getPlanetOccupationSeedRow } from '../balance/balanceTableRegistry';
import { isDynamicContestedZonePlanet } from '../territorial/dynamicContestedZoneStore';
import {
  ensureStelliumColonizeHydrated,
  replaceStelliumColonizeRecords,
  useStelliumColonizeStore,
} from '../../store/stelliumColonizeStore';
import { planetAttackKstDayKey } from '../planetAttack/planetAttackKstDayKey';
import {
  collectBlueSystemIdsForColonizeHop,
  hopDistanceToNearestBlueHold,
  listAdjacentSystemIdsForColonize,
} from './stelliumColonizeHop';
import { evaluateStelliumColonizeEligibility } from './stelliumColonizeEligibility';
import { enqueueStelliumColonizeRecord } from './stelliumColonizeEngine';
import {
  resolveStelliumColonizeFleet,
  scaleStelliumColonizeTravelDays,
} from './stelliumColonizeFleet';
import {
  meetsStelliumColonizeHqDefenseSat,
  resolveStelliumColonizeDefenseSatLevel,
} from './stelliumColonizeDefenseSat';
import { bindStelliumColonizeRuntimeFiscal } from './stelliumColonizeFiscal';
import { resolveStelliumColonizePolicy } from './stelliumColonizePolicy';
import { travelDaysForHopDistance } from './stelliumColonizeTypes';

function parseSeedOwner(raw: string | undefined): 'BLUE' | 'RED' | 'NEUTRAL' | null {
  if (!raw) return null;
  const o = raw.trim().toUpperCase();
  if (o === 'BLUE' || o === 'RED' || o === 'NEUTRAL') return o;
  return null;
}

function resolvePlanetSystemId(planetId: string): string | null {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useWorldStore } = require('../../store/worldStore') as typeof import('../../store/worldStore');
  const systems = useWorldStore.getState().systems;
  const ids = Object.keys(systems);
  for (let i = 0; i < ids.length; i += 1) {
    const sys = systems[ids[i]];
    const planets = sys?.planets;
    if (!planets) continue;
    for (let j = 0; j < planets.length; j += 1) {
      if (planets[j]?.id === planetId) return sys.id;
    }
  }
  return getPlanetOccupationSeedRow(planetId)?.systemId ?? null;
}

export function tryEnqueueStelliumColonizeFromPlanetInfo(planetId: string): boolean {
  return tryEnqueueStelliumColonize(planetId, { treatLandedAsRevealed: false });
}

/** 착륙 즉시 출항 — 정보 열람·일 배치를 기다리지 않음 */
export function tryEnqueueStelliumColonizeFromLanding(planetId: string): boolean {
  const systemId = resolvePlanetSystemId(planetId);
  if (systemId) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { useWorldStore } = require('../../store/worldStore') as typeof import('../../store/worldStore');
      useWorldStore.getState().markVisited(systemId);
    } catch {
      /* store 미기동 */
    }
  }
  return tryEnqueueStelliumColonize(planetId, { treatLandedAsRevealed: true });
}

export function tryEnqueueStelliumColonizeFromSystemArrival(systemId: string): boolean {
  const id = String(systemId ?? '').trim();
  if (!id) return false;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useWorldStore } = require('../../store/worldStore') as typeof import('../../store/worldStore');
  useWorldStore.getState().confirmRuntimeCoreSystem(id);
  const planets = useWorldStore.getState().systems[id]?.planets;
  if (!planets?.length) return false;
  let sent = false;
  for (let i = 0; i < planets.length; i += 1) {
    const planetId = planets[i]?.id;
    if (planetId && tryEnqueueStelliumColonize(planetId, { treatLandedAsRevealed: true })) {
      sent = true;
    }
  }
  return sent;
}

function logColonizeSkip(id: string, reason: string): void {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log(`[stelliumColonize] skip ${id}: ${reason}`);
  }
}

function tryEnqueueStelliumColonize(
  planetId: string,
  opts: { treatLandedAsRevealed: boolean },
): boolean {
  const id = String(planetId ?? '').trim();
  if (!id) return false;
  const policy = resolveStelliumColonizePolicy();
  if (!policy.enabled) {
    logColonizeSkip(id, 'disabled');
    return false;
  }

  if (!useStelliumColonizeStore.getState().hydrated) {
    void ensureStelliumColonizeHydrated().then(() => {
      tryEnqueueStelliumColonize(id, opts);
    });
    return false;
  }
  const existing = useStelliumColonizeStore.getState().byPlanetId[id];
  if (existing) return false;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useWorldStore } = require('../../store/worldStore') as typeof import('../../store/worldStore');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useClanWarFoundationStore } = require('../../store/clanWarFoundationStore') as typeof import('../../store/clanWarFoundationStore');

  const world = useWorldStore.getState();
  const systemId = resolvePlanetSystemId(id);
  if (!systemId) {
    logColonizeSkip(id, 'no_system');
    return false;
  }
  world.confirmRuntimeCoreSystem(systemId);

  const seed = getPlanetOccupationSeedRow(id);
  const hold = useClanWarFoundationStore.getState().getHold(id);
  const inspected = world.inspectedPlanetInfoIds.includes(id);
  const eligible = evaluateStelliumColonizeEligibility({
    planetId: id,
    systemId,
    systemUnlocked: world.isSystemUnlocked(systemId),
    planetInfoRevealed: opts.treatLandedAsRevealed || inspected,
    hold,
    csvInitialOwner: parseSeedOwner(seed?.initialOwner),
    contested: isPlanetContestedZone(id) || isDynamicContestedZonePlanet(id),
  });
  if (!eligible.ok) {
    logColonizeSkip(id, eligible.reason);
    return false;
  }

  const holds = useClanWarFoundationStore.getState().planetHolds;
  const blueSystems = collectBlueSystemIdsForColonizeHop(
    holds,
    (clanId) => resolveHoldFactionSide(clanId) === 'BLUE',
  );
  const hop = hopDistanceToNearestBlueHold({
    systemId,
    blueSystemIds: blueSystems,
    listAdjacent: listAdjacentSystemIdsForColonize,
  });
  if (!hop || hop.hops <= 0) {
    logColonizeSkip(id, 'no_hop');
    return false;
  }

  const fleet = resolveStelliumColonizeFleet(policy);
  const travelDays = scaleStelliumColonizeTravelDays(
    travelDaysForHopDistance(hop.hops, policy),
    fleet.speedMul,
  );
  const defenseSatLevel = resolveStelliumColonizeDefenseSatLevel(id);
  const result = enqueueStelliumColonizeRecord({
    records: useStelliumColonizeStore.getState().byPlanetId,
    planetId: id,
    systemId,
    hopDistance: hop.hops,
    todayKey: planetAttackKstDayKey(),
    policy,
    nowMs: Date.now(),
    travelDays,
    outpostArriveSec: fleet.outpostArriveSec,
    fleetReadyAtMs: useStelliumColonizeStore.getState().fleetReadyAtMs,
    operationalCap: fleet.operationalCap,
    defenseSatLevel,
    fiscal: bindStelliumColonizeRuntimeFiscal(policy),
  });
  if (
    !meetsStelliumColonizeHqDefenseSat(policy.requireDefenseSatLevel, defenseSatLevel)
    && result.events.some((e) => e.kind === 'enqueued' && e.phase === 'queued')
  ) {
    logColonizeSkip(id, 'queued_until_defense_sat');
  }
  if (result.events.length === 0) return false;
  replaceStelliumColonizeRecords(result.records, false, result.fleetReadyAtMs);
  try {
    const { tickStelliumColonizeRealtime } =
      require('./tickStelliumColonizeRealtime') as typeof import('./tickStelliumColonizeRealtime');
    tickStelliumColonizeRealtime({ persistNow: false, presentHqAlert: true });
  } catch {
    /* 실시간 전초기지 워치 미기동 */
  }
  return true;
}

export function backfillStelliumColonizeFromInspected(): number {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useWorldStore } = require('../../store/worldStore') as typeof import('../../store/worldStore');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { usePlayerStore } = require('../../store/playerStore') as typeof import('../../store/playerStore');
  const inspected = useWorldStore.getState().inspectedPlanetInfoIds;
  let n = 0;
  const landedId = usePlayerStore.getState().player?.currentPlanetId ?? '';
  if (landedId && tryEnqueueStelliumColonizeFromLanding(landedId)) n += 1;
  for (let i = 0; i < inspected.length; i += 1) {
    if (inspected[i] === landedId) continue;
    if (tryEnqueueStelliumColonizeFromPlanetInfo(inspected[i])) n += 1;
  }
  return n;
}
