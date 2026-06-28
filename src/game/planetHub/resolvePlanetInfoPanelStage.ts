// ============================================================
// 행성 정보창 — 개발 단계별 portrait·설명·배경 (Table-First)
// ============================================================

import {
  resolveBestPlanetInfoPanelStageRow,
  type PlanetInfoPanelStageRow,
} from '../../arcCore/balance/planetInfoPanelStageRegistry';
import { findPlanetById } from '../../arcCore/planetEnvironment/resolvePlanetAsteroidVisualPolicy';
import { resolvePlanetDescription } from '../../i18n/systemText';
import type { AppLocale } from '../../i18n/types';
import { isSynthFrontierPlanetId } from '../../world/isSynthFrontierPlanetId';
import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';

export type PlanetInfoPanelPresentation = {
  stageRow: PlanetInfoPanelStageRow | null;
  description: string;
  infoPanelPortraitAssetKey: string | null;
  backdropImageAssetKey: string | null;
};

/** 행성개발 byModuleId — installed=true 모듈 수 */
export function countPlanetInstalledDevModules(planetId: string): number {
  const id = planetId.trim();
  if (!id) return 0;
  const runtime = usePlanetCoreRuntimeStore.getState().getPlanetCoreRuntime(id);
  const byModule = runtime?.detail?.development?.byModuleId;
  if (!byModule || typeof byModule !== 'object') return 0;
  let count = 0;
  for (const mod of Object.values(byModule)) {
    if (mod && typeof mod === 'object' && (mod as { installed?: boolean }).installed) count += 1;
  }
  return count;
}

function readSynthColonizationPhase(planetId: string): number {
  if (!isSynthFrontierPlanetId(planetId)) return 0;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useWorldStore } = require('../../store/worldStore') as typeof import('../../store/worldStore');
  return useWorldStore.getState().getSynthColonizationPhase(planetId);
}

function pickDescription(
  row: PlanetInfoPanelStageRow | null,
  planet: ReturnType<typeof findPlanetById>,
  locale: AppLocale,
): string {
  if (row) {
    const fromStage = locale === 'ko'
      ? row.descriptionKo
      : (row.descriptionEn || row.descriptionKo);
    if (fromStage.trim()) return fromStage.trim();
  }
  if (!planet) return '';
  return resolvePlanetDescription(planet, locale, undefined);
}

function pickAssetKey(rowValue: string, planetValue: string | null | undefined): string | null {
  const staged = rowValue.trim();
  if (staged) return staged;
  const base = String(planetValue ?? '').trim();
  return base || null;
}

/** 행성 정보창·월드 sync 공용 — synth phase + dev 모듈 수로 최고 tier stage 선택 */
export function resolvePlanetInfoPanelPresentation(
  planetId: string,
  locale: AppLocale,
): PlanetInfoPanelPresentation {
  const planet = findPlanetById(planetId);
  const synthPhase = readSynthColonizationPhase(planetId);
  const devModulesInstalled = countPlanetInstalledDevModules(planetId);
  const stageRow = resolveBestPlanetInfoPanelStageRow(
    planetId,
    synthPhase,
    devModulesInstalled,
  );
  return {
    stageRow,
    description: pickDescription(stageRow, planet, locale),
    infoPanelPortraitAssetKey: pickAssetKey(
      stageRow?.infoPanelPortraitAssetKey ?? '',
      planet?.infoPanelPortraitAssetKey,
    ),
    backdropImageAssetKey: pickAssetKey(
      stageRow?.backdropImageAssetKey ?? '',
      planet?.backdropImageAssetKey,
    ),
  };
}

/** economy info session revision — dev·phase 변경 시 스냅샷 재빌드 */
export function readPlanetInfoPanelPresentationRevision(planetId: string): string {
  const synthPhase = readSynthColonizationPhase(planetId);
  const devModulesInstalled = countPlanetInstalledDevModules(planetId);
  const row = resolveBestPlanetInfoPanelStageRow(planetId, synthPhase, devModulesInstalled);
  return `${synthPhase}|${devModulesInstalled}|${row?.stageTier ?? -1}`;
}
