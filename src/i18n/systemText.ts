import { getSynthSystemColonizationRow } from '../arcCore/balance/balanceTableRegistry';
import type { AppLocale } from './types';
import type { Planet, StarSystem } from '../types';
import { isKoUi, translate } from './index';
import { useAppSettingsStore } from '../store/appSettingsStore';

function pickEn(primary: string | undefined, fallbackKo: string): string {
  const en = String(primary ?? '').trim();
  if (en) return en;
  return String(fallbackKo ?? '').trim();
}

/** 레거시 PvP 팀 라벨 — 성계·행성 설명(UI)에서 제거 */
function stripLegacyTeamFactionLabels(text: string): string {
  return text
    .replace(/레드팀\s*/g, '')
    .replace(/블루팀\s*/g, '')
    .replace(/\bRed Team\s*/gi, '')
    .replace(/\bBlue Team\s*/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function resolveSynthProceduralName(nameKo: string, locale: AppLocale): string | null {
  if (isKoUi(locale)) return null;
  const unexploredDash = nameKo.match(/^미개척-(\d+)$/);
  if (unexploredDash) {
    return translate(locale, 'system.synth.unexploredLabel', { n: unexploredDash[1] });
  }
  const undiscoveredDash = nameKo.match(/^미발견-(\d+)$/);
  if (undiscoveredDash) {
    return translate(locale, 'system.synth.undiscoveredLabel', { n: undiscoveredDash[1] });
  }
  const unexploredSp = nameKo.match(/^미개척 (\d+)$/);
  if (unexploredSp) {
    return translate(locale, 'system.synth.unexploredSpLabel', { n: unexploredSp[1] });
  }
  return null;
}

/** synth B→A 코어 개방 전 — colonization CSV 실명·설명 노출 금지(은하 지도 하단 패널) */
function isSynthCoreOpenForDisplay(systemId: string): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { isCoreOpenSystemId } =
      require('../world/coreOpenGameplayPlanets') as typeof import('../world/coreOpenGameplayPlanets');
    return isCoreOpenSystemId(systemId);
  } catch {
    return false;
  }
}

function resolveSynthProceduralDescription(descKo: string, locale: AppLocale): string | null {
  if (isKoUi(locale)) return null;
  const legacy =
    '아직 항로가 개척되지 않은 성계. 센서상으로는 존재만 확인된다.';
  const expansion = '아직 발견되지 않은 외곽 성계. 아크코어 스캔 대기 상태다.';
  const colonizedFallback =
    '최초 발견 이후 아직 본격 개발되지 않은 미개척 성계.';
  if (descKo === legacy) return translate(locale, 'system.synth.unexploredDesc');
  if (descKo === expansion) return translate(locale, 'system.synth.undiscoveredDesc');
  if (descKo === colonizedFallback) return translate(locale, 'system.synth.colonizedFallbackDesc');
  return null;
}

export function resolveStarSystemDisplayName(
  system: Pick<StarSystem, 'id' | 'name' | 'nameEn'>,
  locale: AppLocale,
): string {
  if (isKoUi(locale)) return String(system.name ?? '').trim();
  const direct = pickEn(system.nameEn, system.name);
  if (direct !== String(system.name ?? '').trim()) return direct;

  const procedural = resolveSynthProceduralName(String(system.name ?? ''), locale);
  if (procedural) return procedural;

  if (system.id.startsWith('synth_') && isSynthCoreOpenForDisplay(system.id)) {
    const row = getSynthSystemColonizationRow(system.id);
    const fromCsv = String(row?.systemNameEn ?? '').trim();
    if (fromCsv) return fromCsv;
  }

  return String(system.name ?? '').trim();
}

export function resolveStarSystemDescription(
  system: Pick<StarSystem, 'id' | 'description' | 'descriptionEn'>,
  locale: AppLocale,
): string {
  if (isKoUi(locale)) {
    return stripLegacyTeamFactionLabels(String(system.description ?? '').trim());
  }
  const direct = pickEn(system.descriptionEn, system.description);
  if (direct !== String(system.description ?? '').trim()) {
    return stripLegacyTeamFactionLabels(direct);
  }

  const procedural = resolveSynthProceduralDescription(String(system.description ?? ''), locale);
  if (procedural) return stripLegacyTeamFactionLabels(procedural);

  if (system.id.startsWith('synth_') && isSynthCoreOpenForDisplay(system.id)) {
    const row = getSynthSystemColonizationRow(system.id);
    const fromCsv = String(row?.systemDescriptionEn ?? '').trim();
    if (fromCsv) return stripLegacyTeamFactionLabels(fromCsv);
  }

  return stripLegacyTeamFactionLabels(String(system.description ?? '').trim());
}

export function resolvePlanetDisplayName(
  planet: Pick<Planet, 'name' | 'nameEn'>,
  locale: AppLocale,
): string {
  if (isKoUi(locale)) return String(planet.name ?? '').trim();
  const direct = pickEn(planet.nameEn, planet.name);
  if (direct !== String(planet.name ?? '').trim()) return direct;
  if (planet.name === '미상 행성') return translate(locale, 'system.synth.unknownPlanet');
  return String(planet.name ?? '').trim();
}

export function resolvePlanetDescription(
  planet: Pick<Planet, 'name' | 'description' | 'descriptionEn'>,
  locale: AppLocale,
  systemId?: string,
): string {
  if (isKoUi(locale)) {
    return stripLegacyTeamFactionLabels(String(planet.description ?? '').trim());
  }
  const direct = pickEn(planet.descriptionEn, planet.description);
  if (direct !== String(planet.description ?? '').trim()) {
    return stripLegacyTeamFactionLabels(direct);
  }
  if (planet.description === '탐사 불가 구역.') {
    return translate(locale, 'system.synth.unsurveyedPlanetDesc');
  }
  if (systemId?.startsWith('synth_') && isSynthCoreOpenForDisplay(systemId)) {
    const row = getSynthSystemColonizationRow(systemId);
    const fromCsv = String(row?.planetDescriptionEn ?? '').trim();
    if (fromCsv) return stripLegacyTeamFactionLabels(fromCsv);
  }
  return stripLegacyTeamFactionLabels(String(planet.description ?? '').trim());
}

export function resolveStarSystemDisplayNameNow(
  system: Pick<StarSystem, 'id' | 'name' | 'nameEn'>,
): string {
  return resolveStarSystemDisplayName(system, useAppSettingsStore.getState().locale);
}
