// ============================================================
// planet_occupation_seeds.csv — 초기 행성 점유·점령전 플래그 시드
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
  // 플레이어 uid 거점만 보호 — AI 클랜장 homePlayerUid 는 국가 시드 복구 허용
  if (hold.homePlayerUid && !isAiClanOccupier(hold.occupierClanId)) return true;
  return false;
}

/** AI 클랜 occupier — 국가 CSV 시드 복구 대상 */
function isAiClanOccupier(clanId: string | null | undefined): boolean {
  return Boolean(clanId?.startsWith('ai_clan_'));
}

function shouldRestoreNationSeedOccupier(input: {
  contestedZone: boolean;
  nationClanId: string;
  cur: PlanetClanHold;
}): boolean {
  const { contestedZone, nationClanId, cur } = input;
  if (isAiClanOccupier(cur.occupierClanId)) return true;
  if (contestedZone) return false;
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
 * CSV BLUE/RED 국가 시드 행성 — neutral·AI클랜 오점유 복구.
 * contestedZone=true 는 ArcCore neutral/blue/red 판정만 유지(AI클랜 덮어쓰기는 항상 제거).
 */
function reconcileCsvSeedFactionOccupationHolds(
  holds: Record<string, PlanetClanHold>,
  now: number,
): boolean {
  let mutated = false;
  for (const row of PlanetOccupationSeeds_FROM_BALANCE_CSV) {
    const owner = parseOwner(row.initialOwner);
    if (owner === 'NEUTRAL') continue;

    const contestedZone = parseBool(row.contestedZone);
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

/** 기존 hold·player_home 을 덮어쓰지 않고 빈 행성만 시드 */
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
