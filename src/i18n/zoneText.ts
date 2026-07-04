import type { ZoneType } from '../types';
import type { I18nParams } from './types';
import { resolveTerritorialNationClanIdForPlanet } from '../clanWar/planetOwnershipModel';
import { resolveMapFactionSideFromClanIdPure } from '../galaxyMap/mapFactionSideCore';
import type { ClanBasicsRecord } from '../types';

type TFn = (key: string, params?: I18nParams) => string;

export function resolveZoneLabel(zone: ZoneType, t: TFn): string {
  const key = `zone.${zone}`;
  const val = t(key);
  return val !== key ? val : zone;
}

/**
 * CSV 국가(BLUE/RED) 점유 시드 행성 — gameplay zone=neutral 이라도 「점유지역」 표기.
 * (zone CSV ≠ territorial occupation — Fable Table-First 정합)
 */
export function resolvePlanetZoneDisplayLabel(
  planetId: string,
  zone: ZoneType,
  t: TFn,
  clans: Record<string, ClanBasicsRecord> = {},
): string {
  const nationClanId = resolveTerritorialNationClanIdForPlanet(planetId);
  if (nationClanId) {
    const side = resolveMapFactionSideFromClanIdPure(nationClanId, clans);
    if (side === 'blue' || side === 'red') {
      const occupied = t('zone.occupied');
      return occupied !== 'zone.occupied' ? occupied : '점유지역';
    }
  }
  return resolveZoneLabel(zone, t);
}
