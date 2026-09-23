import { getPlayScenarioZoneIndexBySystemId } from '../arcCore/balance/balanceTableRegistry';
import { parseSynthOrdinal } from '../data/galaxy100';
import { resolveStarSystemDisplayName } from '../i18n/systemText';
import { translate, type AppLocale } from '../i18n';
import type { StarSystem } from '../types';

/** 미방문 성계 네임태그 — #9A9A9A 대비 밝기 약 30% 하향 */
export const GALAXY_MAP_UNIDENTIFIED_LABEL_FILL = '#6C6C6C';

export function padGalaxyMapCatalogOrdinal(ordinal: number): string {
  const n = Number.isFinite(ordinal) ? Math.max(0, Math.floor(ordinal)) : 0;
  return String(n).padStart(3, '0');
}

/** synth `001` · 코어 21 `zoneIndex` — 기존 이름_넘버링의 숫자축만 재사용 */
export function resolveGalaxyMapSystemCatalogOrdinal(
  system: Pick<StarSystem, 'id'> & { planets?: readonly { id?: string }[] },
): number {
  const synth = parseSynthOrdinal(system.id);
  if (synth != null) return synth;
  const zone = getPlayScenarioZoneIndexBySystemId(system.id);
  if (zone != null) return zone;
  return 0;
}

export function formatUnidentifiedSystemLabel(ordinal: number, locale: AppLocale): string {
  return translate(locale, 'worldmap.unidentifiedSystem', {
    n: padGalaxyMapCatalogOrdinal(ordinal),
  });
}

export function isGalaxyMapSystemNameRevealed(isVisited: boolean, isCurrent: boolean): boolean {
  return isVisited || isCurrent;
}

/** 전함 마크가 `arrivedHopCount`홉 도착한 뒤 본명이 열릴 성계(출발 제외). 이동 버튼 시점 = 0. */
export function listGalaxyMapNameRevealIdsAfterHops(
  pathSystemIds: readonly string[],
  arrivedHopCount: number,
): string[] {
  if (pathSystemIds.length < 2) return [];
  const n = Math.max(0, Math.min(Math.floor(arrivedHopCount), pathSystemIds.length - 1));
  return pathSystemIds.slice(1, 1 + n);
}

/** 개방 성계는 라벨 유지(미확인 포함). 잠금은 선택 시에만 — Views 상한. */
export function shouldShowGalaxyMapSystemLabel(isGameplay: boolean, isSelected: boolean): boolean {
  return isGameplay || isSelected;
}

export function resolveGalaxyMapSystemDisplayLabel(
  system: Pick<StarSystem, 'id' | 'name' | 'nameEn'> & { planets?: readonly { id?: string }[] },
  locale: AppLocale,
  nameRevealed: boolean,
): string {
  if (nameRevealed) return resolveStarSystemDisplayName(system, locale);
  return formatUnidentifiedSystemLabel(resolveGalaxyMapSystemCatalogOrdinal(system), locale);
}
