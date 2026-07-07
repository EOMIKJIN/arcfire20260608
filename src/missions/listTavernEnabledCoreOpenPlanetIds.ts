import { isPlanetCsvTavernWorldEnabled } from '../game/planetDevelopment/planetCsvWorldFlags';
import { isPlanetPopulationDomeInstalled } from '../game/planetDevelopment/planetPopulationDomeListing';
import { listCoreOpenGameplayPlanetIds } from '../world/coreOpenGameplayPlanets';

/** planetHubFacilityGates 와 동일 조건 — missionStore 순환 import 방지. */
function isArcCoreTavernPlanetEnabled(planetId: string): boolean {
  return isPlanetCsvTavernWorldEnabled(planetId) || isPlanetPopulationDomeInstalled(planetId);
}

/** ArcCore 선술집 인스턴스 보드 — 코어 개방 행성 중 선술집 활성 행성 id. */
export function listTavernEnabledCoreOpenPlanetIds(): string[] {
  const out: string[] = [];
  for (const planetId of listCoreOpenGameplayPlanetIds()) {
    if (isArcCoreTavernPlanetEnabled(planetId)) out.push(planetId);
  }
  return out;
}
