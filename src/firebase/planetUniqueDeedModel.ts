export const PLANET_UNIQUE_DEEDS_COLLECTION = 'planet_unique_deeds';
export const PLANET_UNIQUE_DEED_ROSTER_CAP = 128;

export const PLANET_UNIQUE_DEED_NICKNAME_MAX = 32;
export const PLANET_UNIQUE_DEED_FACTION_MAX = 48;
export const PLANET_UNIQUE_DEED_PLANET_ID_MAX = 64;
export const PLANET_UNIQUE_DEED_UID_MAX = 80;

export type PlanetUniqueDeedRow = {
  planetId: string;
  ownerUid: string;
  nickname: string;
  playerLevel: number;
  megaFactionId: string;
  securedAt: number;
};

export type PlanetUniqueDeedWriteInput = {
  planetId: string;
  ownerUid: string;
  nickname: string;
  playerLevel: number;
  megaFactionId: string;
  securedAt?: number;
};

export function clipPlanetUniqueDeedField(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max);
}

export function sanitizePlanetUniqueDeedWrite(
  input: PlanetUniqueDeedWriteInput,
): PlanetUniqueDeedWriteInput | null {
  const planetId = clipPlanetUniqueDeedField(input.planetId, PLANET_UNIQUE_DEED_PLANET_ID_MAX);
  const ownerUid = clipPlanetUniqueDeedField(input.ownerUid, PLANET_UNIQUE_DEED_UID_MAX);
  const nickname = clipPlanetUniqueDeedField(input.nickname, PLANET_UNIQUE_DEED_NICKNAME_MAX);
  const megaFactionId = clipPlanetUniqueDeedField(input.megaFactionId, PLANET_UNIQUE_DEED_FACTION_MAX);
  const playerLevel = Math.max(1, Math.min(999, Math.floor(Number(input.playerLevel) || 1)));
  if (!planetId || !ownerUid || !nickname) return null;
  return {
    planetId,
    ownerUid,
    nickname,
    playerLevel,
    megaFactionId,
    securedAt:
      typeof input.securedAt === 'number' && Number.isFinite(input.securedAt) && input.securedAt > 0
        ? Math.floor(input.securedAt)
        : Date.now(),
  };
}

export function parsePlanetUniqueDeedRow(
  planetId: string,
  data: Record<string, unknown> | undefined,
): PlanetUniqueDeedRow | null {
  const id = clipPlanetUniqueDeedField(planetId, PLANET_UNIQUE_DEED_PLANET_ID_MAX);
  if (!id || !data) return null;
  const ownerUid = typeof data.ownerUid === 'string'
    ? clipPlanetUniqueDeedField(data.ownerUid, PLANET_UNIQUE_DEED_UID_MAX)
    : '';
  const nickname = typeof data.nickname === 'string'
    ? clipPlanetUniqueDeedField(data.nickname, PLANET_UNIQUE_DEED_NICKNAME_MAX)
    : '';
  if (!ownerUid || !nickname) return null;
  const playerLevel = Math.max(1, Math.min(999, Math.floor(Number(data.playerLevel) || 1)));
  const megaFactionId = typeof data.megaFactionId === 'string'
    ? clipPlanetUniqueDeedField(data.megaFactionId, PLANET_UNIQUE_DEED_FACTION_MAX)
    : '';
  const securedAt =
    typeof data.securedAt === 'number' && Number.isFinite(data.securedAt) && data.securedAt > 0
      ? Math.floor(data.securedAt)
      : 0;
  if (securedAt <= 0) return null;
  return {
    planetId: id,
    ownerUid,
    nickname,
    playerLevel,
    megaFactionId,
    securedAt,
  };
}

export function sortPlanetUniqueDeedRows(
  rows: readonly PlanetUniqueDeedRow[],
): PlanetUniqueDeedRow[] {
  const copy = rows.slice();
  copy.sort((a, b) => {
    if (a.securedAt !== b.securedAt) return a.securedAt - b.securedAt;
    return a.planetId.localeCompare(b.planetId);
  });
  return copy.slice(0, PLANET_UNIQUE_DEED_ROSTER_CAP);
}

/** 클라우드 행이 행성 키를 이기고, 없는 로컬만 합친 뒤 정렬·캡. */
export function mergePlanetUniqueDeedRosterRows(
  cloud: readonly PlanetUniqueDeedRow[],
  local: readonly PlanetUniqueDeedRow[],
): PlanetUniqueDeedRow[] {
  const have = new Set<string>();
  for (let i = 0; i < cloud.length; i += 1) {
    const id = cloud[i]?.planetId;
    if (id) have.add(id);
  }
  const extra: PlanetUniqueDeedRow[] = [];
  for (let i = 0; i < local.length; i += 1) {
    const row = local[i];
    if (!row || have.has(row.planetId)) continue;
    extra.push(row);
  }
  if (extra.length === 0) return sortPlanetUniqueDeedRows(cloud);
  return sortPlanetUniqueDeedRows([...cloud, ...extra]);
}

/** 같은 행성 키가 없을 때만 한 장 추가. */
export function appendUniqueDeedRowIfMissing(
  rows: readonly PlanetUniqueDeedRow[],
  extra: PlanetUniqueDeedRow | null | undefined,
): PlanetUniqueDeedRow[] {
  if (!extra?.planetId) return rows.slice();
  for (let i = 0; i < rows.length; i += 1) {
    if (rows[i]?.planetId === extra.planetId) return rows.slice();
  }
  return [...rows, extra];
}
