// ============================================================
// planets.csv / synth colonization 월드 시설 플래그 — listing·gates 공용
// A(21 CSV) + B→A 개방 synth — resolvePlanetById hasTradePort 등 동일 경로
// planetTradePortDb import 금지( itemRegistry ↔ goods 순환 방지 )
// ============================================================

import { getSynthSystemColonizationRow } from '../../arcCore/balance/balanceTableRegistry';
import { isCoreOpenPlanetId } from '../../world/coreOpenGameplayPlanets';
import { isSynthFrontierPlanetId } from '../../world/isSynthFrontierPlanetId';
import { resolvePlanetById } from '../../world/resolvePlanetById';

function parseCsvBool(raw: string | undefined): boolean {
  return String(raw ?? '').trim().toLowerCase() === 'true';
}

function readCoreOpenPlanet(planetId: string) {
  if (!isCoreOpenPlanetId(planetId)) return null;
  return resolvePlanetById(planetId);
}

/** B→A synth — worldStore autogen 지연 시 colonization CSV 시설 플래그 */
function readSynthColonizationFacilityFlags(planetId: string): {
  hasTradePort: boolean;
  hasShipyard: boolean;
  hasTavern: boolean;
} | null {
  if (!isSynthFrontierPlanetId(planetId) || !isCoreOpenPlanetId(planetId)) return null;
  const systemId = planetId.replace(/_p$/, '');
  const row = getSynthSystemColonizationRow(systemId);
  if (!row) return null;
  return {
    hasTradePort: parseCsvBool(String(row.hasTradePort)),
    hasShipyard: parseCsvBool(String(row.hasShipyard)),
    hasTavern: parseCsvBool(String(row.hasTavern)),
  };
}

/** zone 카탈로그(무기·전함 등) — 코어 개방 행성(A+B) 무역소 보유 */
export function isPlanetCsvTradePortWorldEnabled(planetId: string): boolean {
  if (Boolean(readCoreOpenPlanet(planetId)?.hasTradePort)) return true;
  return readSynthColonizationFacilityFlags(planetId)?.hasTradePort ?? false;
}

/** zone 카탈로그 전함 — 코어 개방 행성 조선소 보유 */
export function isPlanetCsvShipyardWorldEnabled(planetId: string): boolean {
  if (Boolean(readCoreOpenPlanet(planetId)?.hasShipyard)) return true;
  return readSynthColonizationFacilityFlags(planetId)?.hasShipyard ?? false;
}

/** CSV·colonization 선술집 보유 코어 개방 행성 */
export function isPlanetCsvTavernWorldEnabled(planetId: string): boolean {
  if (Boolean(readCoreOpenPlanet(planetId)?.hasTavern)) return true;
  return readSynthColonizationFacilityFlags(planetId)?.hasTavern ?? false;
}
