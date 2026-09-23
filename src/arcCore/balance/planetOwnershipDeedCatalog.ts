// ============================================================
// 행성 소유권 증서 — 무역소 진열 단일 eligibility 계약
// CSV 21행성(A) + B→A synth — hop 능선 무역소·개방 성계 기준
// (정적 GALAXY hasTradePort=false · isCoreOpenPlanetId 순환 잔재 회피)
// ============================================================

import { isPlanetCsvTradePortWorldEnabled } from '../../game/planetDevelopment/planetCsvWorldFlags';
import { resolveFrontierWorldFacilitySeed } from '../../world/galaxyFrontierDevelopmentRidge';
import { isSynthFrontierPlanetId } from '../../world/isSynthFrontierPlanetId';

function normalizeSynthSystemId(id: string): string {
  if (!id.startsWith('synth_')) return id;
  const raw = id.slice('synth_'.length);
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return id;
  return `synth_${String(n).padStart(3, '0')}`;
}

/** B→A synth — worldStore unlocked + phase≥1 + hop 능선 무역소 */
function isUnlockedSynthPlanetOwnershipDeedEligible(planetId: string): boolean {
  if (!isSynthFrontierPlanetId(planetId)) return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useWorldStore } = require('../../store/worldStore') as typeof import('../../store/worldStore');
    const world = useWorldStore.getState();
    if (!world.loaded) return false;
    const systemId = normalizeSynthSystemId(planetId.replace(/_p$/, ''));
    if (!world.unlockedSystemIds.includes(systemId)) return false;
    const phase = world.getSynthColonizationPhase(planetId);
    if (phase < 1) return false;
    return resolveFrontierWorldFacilitySeed(planetId, phase).hasTradePort;
  } catch {
    return false;
  }
}

/** 무역소 구매 탭에 `ownership_{planetId}` 를 넣을 수 있는 행성 */
export function isPlanetOwnershipDeedCatalogEligible(planetId: string): boolean {
  const id = planetId.trim();
  if (!id) return false;
  if (isUnlockedSynthPlanetOwnershipDeedEligible(id)) return true;
  return isPlanetCsvTradePortWorldEnabled(id);
}

export function resolvePlanetOwnershipDeedItemId(planetId: string): string {
  return `ownership_${planetId.trim()}`;
}
