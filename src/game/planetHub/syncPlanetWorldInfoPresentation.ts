// ============================================================
// 개발 단계 반영 — worldStore 행성 description·portrait·backdrop 동기화
// ============================================================

import { resolvePlanetInfoPanelPresentation } from './resolvePlanetInfoPanelStage';
import { resolveSystemIdForPlanetId } from '../../world/resolvePlanetSystemId';

/** 행성개발·synth phase 변경 후 — 월드 행성 레코드에 정보창 단계 반영 */
export function syncPlanetWorldInfoPresentation(planetId: string): void {
  const id = planetId.trim();
  if (!id) return;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useWorldStore } = require('../../store/worldStore') as typeof import('../../store/worldStore');
  const world = useWorldStore.getState();
  const systemId = resolveSystemIdForPlanetId(id);
  if (!systemId) return;
  const system = world.systems[systemId];
  if (!system) return;
  const idx = system.planets.findIndex((p) => p.id === id);
  if (idx < 0) return;

  const pres = resolvePlanetInfoPanelPresentation(id, 'ko');
  const stage = pres.stageRow;
  const prev = system.planets[idx]!;
  const nextPlanet = {
    ...prev,
    description: pres.description || prev.description,
    descriptionEn: stage?.descriptionEn?.trim() || prev.descriptionEn,
    infoPanelPortraitAssetKey: pres.infoPanelPortraitAssetKey ?? prev.infoPanelPortraitAssetKey ?? null,
    backdropImageAssetKey: pres.backdropImageAssetKey ?? prev.backdropImageAssetKey ?? null,
  };

  if (
    nextPlanet.description === prev.description
    && nextPlanet.descriptionEn === prev.descriptionEn
    && nextPlanet.infoPanelPortraitAssetKey === prev.infoPanelPortraitAssetKey
    && nextPlanet.backdropImageAssetKey === prev.backdropImageAssetKey
  ) {
    return;
  }

  const nextPlanets = [...system.planets];
  nextPlanets[idx] = nextPlanet;
  useWorldStore.setState({
    systems: {
      ...world.systems,
      [systemId]: { ...system, planets: nextPlanets },
    },
  });
}
