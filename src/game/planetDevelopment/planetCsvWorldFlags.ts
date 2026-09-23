// ============================================================
// planets.csv / synth 월드 시설 플래그 — listing·gates 공용
// A(21 CSV) + B→A 개방 synth — 시설은 거리 hop 능선(비콘 개척지 하한)
// planetTradePortDb import 금지( itemRegistry ↔ goods 순환 방지 )
// ============================================================

import { isCoreOpenPlanetId } from '../../world/coreOpenGameplayPlanets';
import { resolveFrontierWorldFacilitySeed } from '../../world/galaxyFrontierDevelopmentRidge';
import { isSynthFrontierPlanetId } from '../../world/isSynthFrontierPlanetId';
import { resolvePlanetById } from '../../world/resolvePlanetById';

function normalizeSynthSystemId(id: string): string {
  if (!id.startsWith('synth_')) return id;
  const raw = id.slice('synth_'.length);
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return id;
  return `synth_${String(n).padStart(3, '0')}`;
}

function readCoreOpenPlanet(planetId: string) {
  if (!isCoreOpenPlanetId(planetId)) return null;
  return resolvePlanetById(planetId);
}

/** B→A synth — worldStore unlocked + phase≥1 + hop 능선 시설 */
function readSynthRidgeFacilityFlags(planetId: string): {
  hasTradePort: boolean;
  hasShipyard: boolean;
  hasBar: boolean;
} | null {
  if (!isSynthFrontierPlanetId(planetId)) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useWorldStore } = require('../../store/worldStore') as typeof import('../../store/worldStore');
    const world = useWorldStore.getState();
    if (!world.loaded) return null;
    const systemId = normalizeSynthSystemId(planetId.replace(/_p$/, ''));
    if (!world.unlockedSystemIds.includes(systemId)) return null;
    const phase = world.getSynthColonizationPhase(planetId);
    if (phase < 1) return null;
    return resolveFrontierWorldFacilitySeed(planetId, phase);
  } catch {
    return null;
  }
}

/** zone 카탈로그(무기·전함 등) — 코어 개방 행성(A+B) 무역소 보유 */
export function isPlanetCsvTradePortWorldEnabled(planetId: string): boolean {
  if (Boolean(readCoreOpenPlanet(planetId)?.hasTradePort)) return true;
  return readSynthRidgeFacilityFlags(planetId)?.hasTradePort ?? false;
}

/** zone 카탈로그 전함 — 코어 개방 행성 조선소 보유 */
export function isPlanetCsvShipyardWorldEnabled(planetId: string): boolean {
  if (Boolean(readCoreOpenPlanet(planetId)?.hasShipyard)) return true;
  return readSynthRidgeFacilityFlags(planetId)?.hasShipyard ?? false;
}

/** CSV·능선 바 보유 코어 개방 행성 */
export function isPlanetCsvBarWorldEnabled(planetId: string): boolean {
  if (Boolean(readCoreOpenPlanet(planetId)?.hasBar)) return true;
  return readSynthRidgeFacilityFlags(planetId)?.hasBar ?? false;
}
