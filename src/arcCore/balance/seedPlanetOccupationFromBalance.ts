// ============================================================
// planet_occupation_seeds.csv — 초기 행성 점유·점령전 플래그 시드
// ============================================================

import { PlanetOccupationSeeds_FROM_BALANCE_CSV } from '../../data/balance/generated';
import type { ClanBasicsRecord, PlanetClanHold } from '../../types';
import {
  BLUE_COMMERCIAL_CAPITAL_PLANET_ID,
  RED_FACTION_CAPITAL_PLANET_ID,
} from '../../world/galaxyRouteFactionBridge';

const SEED_BLUE_CLAN_ID = 'balance_seed_faction_blue';
export const ARC_CORE_SEED_BLUE_CLAN_ID = SEED_BLUE_CLAN_ID;
export const ARC_CORE_SEED_RED_CLAN_ID = 'balance_seed_faction_red';
const SEED_RED_CLAN_ID = ARC_CORE_SEED_RED_CLAN_ID;

const MEGA_FACTION_CAPITAL_PLANETS: readonly { planetId: string; owner: 'BLUE' | 'RED' }[] = [
  { planetId: BLUE_COMMERCIAL_CAPITAL_PLANET_ID, owner: 'BLUE' },
  { planetId: RED_FACTION_CAPITAL_PLANET_ID, owner: 'RED' },
] as const;

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
      displayName: '스텔리움 연합 (블루)',
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
      displayName: '크림슨 레기온 (레드)',
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

/** 기존 중립 시드 → 수도 행성은 occupation CSV 소유(블루/레드)로 정렬 */
function reconcileMegaFactionCapitalHolds(
  holds: Record<string, PlanetClanHold>,
  now: number,
): boolean {
  let mutated = false;
  for (const cap of MEGA_FACTION_CAPITAL_PLANETS) {
    const row = PlanetOccupationSeeds_FROM_BALANCE_CSV.find((r) => r.planetId === cap.planetId);
    if (!row) continue;

    const cur = holds[cap.planetId];
    if (!cur) continue;
    if (cur.kind === 'player_home' || cur.homePlayerUid) continue;
    if (cur.occupierClanId !== 'neutral') continue;

    const clanId = cap.owner === 'RED' ? SEED_RED_CLAN_ID : SEED_BLUE_CLAN_ID;
    holds[cap.planetId] = {
      planetId: cap.planetId,
      systemId: row.systemId,
      occupierClanId: clanId,
      homePlayerUid: null,
      kind: 'clan_hold',
      capturedAt: now,
    };
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

  if (reconcileMegaFactionCapitalHolds(holds, now)) holdsMutated = true;

  return { holds, clans, holdsMutated };
}
