// ============================================================
// planet_occupation_seeds.csv -> boot default occupation seeds
// During territorial/contested process: runtime hold ALWAYS beats seed
// ============================================================

import { PlanetOccupationSeeds_FROM_BALANCE_CSV } from '../../data/balance/generated';
import type { ClanBasicsRecord, PlanetClanHold } from '../../types';
import {
  BLUE_COMMERCIAL_CAPITAL_PLANET_ID,
  RED_FACTION_CAPITAL_PLANET_ID,
} from '../../world/galaxyRouteFactionBridge';
import {
  MEGA_FACTION_BLUE_NATION,
  MEGA_FACTION_RED_NATION,
} from '../../world/megaFactionNationPolicy';
import { isDynamicContestedZonePlanet } from '../territorial/dynamicContestedZoneStore';
import { isTerritorialProcessPlanet } from '../territorial/isTerritorialProcessPlanet';
import { hasAdjacentHostileFactionSystem } from '../territorial/territorialSupplyLine';
import { getArcCoreCapitalDefensePolicy } from '../territorial/arcCoreCapitalDefensePolicy';
import { isRouteCapitalPlanetId } from '../../world/galaxyFrontierDevelopmentRidge';

const SEED_BLUE_CLAN_ID = 'balance_seed_faction_blue';
export const ARC_CORE_SEED_BLUE_CLAN_ID = SEED_BLUE_CLAN_ID;
export const ARC_CORE_SEED_RED_CLAN_ID = 'balance_seed_faction_red';
const SEED_RED_CLAN_ID = ARC_CORE_SEED_RED_CLAN_ID;

function parseBool(raw: string | undefined): boolean {
  return String(raw ?? '').trim().toLowerCase() === 'true';
}

function parseOwner(owner: string): 'BLUE' | 'RED' | 'NEUTRAL' {
  const o = owner.trim().toUpperCase();
  if (o === 'RED') return 'RED';
  if (o === 'BLUE') return 'BLUE';
  return 'NEUTRAL';
}

function buildSeedClans(now: number): Record<string, ClanBasicsRecord> {
  return {
    [SEED_BLUE_CLAN_ID]: {
      id: SEED_BLUE_CLAN_ID,
      displayName: MEGA_FACTION_BLUE_NATION.displayNameKo,
      leaderUid: 'balance_seed_blue',
      megaFactionId: 'mega_stellium_alliance',
      createdAt: now,
      ext: {
        source: 'planet_occupation_seeds',
        owner: 'BLUE',
        capitalPlanetId: BLUE_COMMERCIAL_CAPITAL_PLANET_ID,
      },
    },
    [SEED_RED_CLAN_ID]: {
      id: SEED_RED_CLAN_ID,
      displayName: MEGA_FACTION_RED_NATION.displayNameKo,
      leaderUid: 'balance_seed_red',
      megaFactionId: 'mega_crimson_legion',
      createdAt: now,
      ext: {
        source: 'planet_occupation_seeds',
        owner: 'RED',
        capitalPlanetId: RED_FACTION_CAPITAL_PLANET_ID,
      },
    },
  };
}

function shouldSkipOccupationSeedReconcile(hold: PlanetClanHold): boolean {
  if (hold.kind === 'player_home') return true;
  // Player independent nation  never restore to seed
  if (hold.kind === 'player_independent') return true;
  // 플레이어 정찰 개척 hold — 시드 파이프가 덮어쓰면 purge 구분이 무너진다
  if (hold.occupationOrigin === 'player_colonize') return true;
  // Player-owned hold (non-AI)  do not overwrite
  if (hold.homePlayerUid && !isAiClanOccupier(hold.occupierClanId)) return true;
  return false;
}

function isAiClanOccupier(clanId: string | null | undefined): boolean {
  return Boolean(clanId?.startsWith('ai_clan_'));
}

/**
 * Never restore nation seed over live holds on territorial-process planets.
 * Seeds only fill missing holds (defaults).
 */
/**
 * ??? ?? ?????? OFF? ?? ?? ?? ??? ???? ?? ??? ????.
 * CSV contestedZone=true(?? ?? 5?)? ?? ??? ????? ??.
 * ???? ??? ???(neutralizedAt)? ??.
 */
function shouldForceRestoreAllyHinterlandSeed(input: {
  occupationCombatEnabled: boolean;
  csvContestedZone: boolean;
  planetId: string;
  systemId: string;
  seedSide: 'BLUE' | 'RED';
  nationClanId: string;
  cur: PlanetClanHold;
  holds: Readonly<Record<string, PlanetClanHold>>;
}): boolean {
  const { occupationCombatEnabled, csvContestedZone, planetId, systemId, seedSide, nationClanId, cur, holds } =
    input;
  if (shouldSkipOccupationSeedReconcile(cur)) return false;
  if (cur.occupierClanId === nationClanId && cur.kind === 'clan_hold') return false;
  if (cur.neutralizedAt) return false;
  if (
    (cur.occupierClanId === SEED_BLUE_CLAN_ID || cur.occupierClanId === SEED_RED_CLAN_ID)
    && cur.occupierClanId !== nationClanId
  ) {
    return false;
  }
  const capitalPolicy = getArcCoreCapitalDefensePolicy();
  if (
    capitalPolicy.enabled
    && capitalPolicy.capitalSeedRestoreIgnoresHostileAdj
    && isRouteCapitalPlanetId(planetId)
  ) {
    return true;
  }
  if (!occupationCombatEnabled) return true;
  if (csvContestedZone) return false;
  return !hasAdjacentHostileFactionSystem({
    systemId,
    side: seedSide,
    holds,
  });
}

function shouldRestoreNationSeedOccupier(input: {
  contestedZone: boolean;
  planetId: string;
  nationClanId: string;
  cur: PlanetClanHold;
}): boolean {
  const { contestedZone, planetId, nationClanId, cur } = input;
  if (contestedZone || isTerritorialProcessPlanet(planetId)) return false;
  if (cur.kind === 'player_independent') return false;
  if (
    isRouteCapitalPlanetId(planetId)
    && (cur.occupierClanId === SEED_BLUE_CLAN_ID || cur.occupierClanId === SEED_RED_CLAN_ID)
    && cur.occupierClanId !== nationClanId
  ) {
    return false;
  }
  if (isAiClanOccupier(cur.occupierClanId)) return true;
  if (
    cur.neutralizedAt
    && (cur.kind === 'neutral' || cur.occupierClanId === 'neutral')
  ) {
    return false;
  }
  if (cur.kind === 'neutral' || cur.occupierClanId === 'neutral') return true;
  if (cur.occupierClanId !== nationClanId) return true;
  return false;
}

function buildNationSeedHold(
  row: (typeof PlanetOccupationSeeds_FROM_BALANCE_CSV)[number],
  nationClanId: string,
  cur: PlanetClanHold | undefined,
  now: number,
): PlanetClanHold {
  return {
    planetId: row.planetId,
    systemId: row.systemId,
    occupierClanId: nationClanId,
    deedOwnerClanId: cur?.deedOwnerClanId ?? null,
    homePlayerUid: null,
    kind: 'clan_hold',
    capturedAt: cur && cur.capturedAt > 0 ? cur.capturedAt : now,
  };
}

/**
 * Non-process planets only: realign mismatched neutral/AI to CSV BLUE/RED seed.
 * Contested / territorial-process planets keep ArcCore progress holds.
 */
function reconcileCsvSeedFactionOccupationHolds(
  holds: Record<string, PlanetClanHold>,
  now: number,
): boolean {
  let mutated = false;
  // ?? ??? ?? ??? ?? ??? ?? ? ?? ?? 2?(21?? bounded)
  for (let pass = 0; pass < 2; pass += 1) {
    let passChanged = false;
    for (const row of PlanetOccupationSeeds_FROM_BALANCE_CSV) {
      const owner = parseOwner(row.initialOwner);
      if (owner === 'NEUTRAL') continue;

      const csvContestedZone = parseBool(row.contestedZone);
      const occupationCombatEnabled = parseBool(row.occupationCombatEnabled);
      const contestedZone = csvContestedZone || isDynamicContestedZonePlanet(row.planetId);
      const nationClanId = owner === 'RED' ? SEED_RED_CLAN_ID : SEED_BLUE_CLAN_ID;
      const cur = holds[row.planetId];

      if (!cur) {
        holds[row.planetId] = buildNationSeedHold(row, nationClanId, undefined, now);
        mutated = true;
        passChanged = true;
        continue;
      }
      if (shouldForceRestoreAllyHinterlandSeed({
        occupationCombatEnabled,
        csvContestedZone,
        planetId: row.planetId,
        systemId: row.systemId,
        seedSide: owner,
        nationClanId,
        cur,
        holds,
      })) {
        holds[row.planetId] = buildNationSeedHold(row, nationClanId, cur, now);
        mutated = true;
        passChanged = true;
        continue;
      }
      if (shouldSkipOccupationSeedReconcile(cur)) continue;
      if (!shouldRestoreNationSeedOccupier({
        contestedZone,
        planetId: row.planetId,
        nationClanId,
        cur,
      })) continue;

      holds[row.planetId] = buildNationSeedHold(row, nationClanId, cur, now);
      mutated = true;
      passChanged = true;
    }
    if (!passChanged) break;
  }
  return mutated;
}

/** Keep existing holds; fill missing planets from CSV seeds only */
export function seedPlanetOccupationHoldsFromBalance(
  existingHolds: Record<string, PlanetClanHold>,
): {
  holds: Record<string, PlanetClanHold>;
  clans: Record<string, ClanBasicsRecord>;
  holdsMutated: boolean;
} {
  const now = Date.now();
  const holds = { ...existingHolds };
  const clans = buildSeedClans(now);
  let holdsMutated = false;

  for (const row of PlanetOccupationSeeds_FROM_BALANCE_CSV) {
    const cur = holds[row.planetId];
    if (cur) continue;

    holdsMutated = true;
    const owner = parseOwner(row.initialOwner);
    if (owner === 'NEUTRAL') {
      holds[row.planetId] = {
        planetId: row.planetId,
        systemId: row.systemId,
        occupierClanId: 'neutral',
        homePlayerUid: null,
        kind: 'neutral',
        capturedAt: now,
      };
      continue;
    }

    const clanId = owner === 'RED' ? SEED_RED_CLAN_ID : SEED_BLUE_CLAN_ID;
    holds[row.planetId] = {
      planetId: row.planetId,
      systemId: row.systemId,
      occupierClanId: clanId,
      homePlayerUid: null,
      kind: 'clan_hold',
      capturedAt: now,
    };
  }

  if (reconcileCsvSeedFactionOccupationHolds(holds, now)) holdsMutated = true;

  return { holds, clans, holdsMutated };
}
