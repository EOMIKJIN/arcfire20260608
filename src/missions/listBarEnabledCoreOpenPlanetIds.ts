import { isPlanetCsvBarWorldEnabled } from '../game/planetDevelopment/planetCsvWorldFlags';
import { isPlanetPopulationDomeInstalled } from '../game/planetDevelopment/planetPopulationDomeListing';
import { isCoreOpenPlanetId, listCoreOpenGameplayPlanetIds } from '../world/coreOpenGameplayPlanets';

/** planetHubFacilityGates 와 동일 조건 — missionStore 순환 import 방지. */
function isArcCoreBarPlanetEnabled(planetId: string): boolean {
  return isPlanetCsvBarWorldEnabled(planetId) || isPlanetPopulationDomeInstalled(planetId);
}

export function isBarEnabledCoreOpenPlanetId(planetId: string): boolean {
  const id = String(planetId ?? '').trim();
  if (!id || !isCoreOpenPlanetId(id)) return false;
  return isArcCoreBarPlanetEnabled(id);
}

/** ArcCore 바 인스턴스 보드 — 코어 개방 행성 중 바 활성 행성 id. */
export function listBarEnabledCoreOpenPlanetIds(): string[] {
  const out: string[] = [];
  for (const planetId of listCoreOpenGameplayPlanetIds()) {
    if (isArcCoreBarPlanetEnabled(planetId)) out.push(planetId);
  }
  return out;
}
