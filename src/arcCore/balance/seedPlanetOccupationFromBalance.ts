// ============================================================
// planet_occupation_seeds.csv ???? ??? ???·?????????????
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
  // ?????? ???????????? ??) ????? ??? ?? ???????, ??? ??? ??? ??
  if (hold.kind === 'player_independent') return true;
  // ?????? uid ?????? ??AI ?????homePlayerUid ????? ??? ?? ???
  if (hold.homePlayerUid && !isAiClanOccupier(hold.occupierClanId)) return true;
  return false;
}

/** AI ??? occupier ????? CSV ??? ?? ????*/
function isAiClanOccupier(clanId: string | null | undefined): boolean {
  return Boolean(clanId?.startsWith('ai_clan_'));
}

function shouldRestoreNationSeedOccupier(input: {
  contestedZone: boolean;
  nationClanId: string;
  cur: PlanetClanHold;
}): boolean {
  const { contestedZone, nationClanId, cur } = input;
  // ?????? ?????????? ??? ?? ???(shouldSkipOccupationSeedReconcile?? ??? ??)
  if (cur.kind === 'player_independent') return false;
  if (isAiClanOccupier(cur.occupierClanId)) return true;
  if (contestedZone) return false;
  // ?????? ??? ?????????? ??? ???????? ????RED/BLUE ????????
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
 * CSV BLUE/RED ??? ??? ??? ??neutral·AI??? ???????.
 * contestedZone=true ??ArcCore neutral/blue/red ?????????(AI??? ????????????? ???).
 */
function reconcileCsvSeedFactionOccupationHolds(
  holds: Record<string, PlanetClanHold>,
  now: number,
): boolean {
  let mutated = false;
  for (const row of PlanetOccupationSeeds_FROM_BALANCE_CSV) {
    const owner = parseOwner(row.initialOwner);
    if (owner === 'NEUTRAL') continue;

    // ?? ????(???? ?? ??) ?? ? ArcCore ?? ??(neutral/blue/red)? ??? ???? ??
    const contestedZone = parseBool(row.contestedZone) || isDynamicContestedZonePlanet(row.planetId);
    const nationClanId = owner === 'RED' ? SEED_RED_CLAN_ID : SEED_BLUE_CLAN_ID;
    const cur = holds[row.planetId];

    if (!cur) {
      holds[row.planetId] = buildNationSeedHold(row, nationClanId, undefined, now);
      mutated = true;
      continue;
    }
    if (shouldSkipOccupationSeedReconcile(cur)) continue;
    if (!shouldRestoreNationSeedOccupier({ contestedZone, nationClanId, cur })) continue;

    holds[row.planetId] = buildNationSeedHold(row, nationClanId, cur, now);
    mutated = true;
  }
  return mutated;
}

/** ?? hold·player_home ?????????? ??? ?????????? */
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
