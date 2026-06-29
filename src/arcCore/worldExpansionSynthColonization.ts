// ============================================================
// 아크코어 — synth 성계 개척 단계 (중립 프론티어 → 점진 정착)
// ============================================================

import { useClanWarFoundationStore } from '../store/clanWarFoundationStore';
import { useWorldStore } from '../store/worldStore';
import { SYNTH_COLONIZATION_MAX_PHASE } from './synthColonizationPhasePolicy';
import { integrateUnlockedSynthFrontierStatEconomy } from './planetCore/integrateUnlockedSynthFrontierStatEconomy';
import { dispatchArcCoreSeedTransportForSystem, dispatchArcCoreSystemUnlockNotice } from './worldExpansionUnlockDispatch';
import type { ArcCoreSystemUnlockKind } from './worldExpansionUnlockDispatch';

export { SYNTH_COLONIZATION_MAX_PHASE, SYNTH_FRONTIER_FACTION_ID } from './synthColonizationPhasePolicy';

/** 개방 직후 — phase 1(초기화 완료) · 궤도 수송 시드 · 중립 hold + 공지 */
export function finalizeArcCoreSynthFrontierUnlock(
  systemId: string,
  kind: ArcCoreSystemUnlockKind,
): void {
  const world = useWorldStore.getState();
  const system = world.getSystem(systemId);
  const planetId = system?.planets[0]?.id;
  if (!planetId) return;

  if (world.getSynthColonizationPhase(planetId) < 1) {
    world.applySynthColonizationPhase(systemId, 1);
  }

  useClanWarFoundationStore.getState().seedSynthFrontierNeutralHold(planetId, systemId);
  integrateUnlockedSynthFrontierStatEconomy();
  dispatchArcCoreSeedTransportForSystem(systemId, 'frontier_system_unlock_orbit_seed');
  dispatchArcCoreSystemUnlockNotice(systemId, kind);
}

/** 일 1회 — 잠금 해제된 synth 중 phase < 3 행성 1단계 진행(phase 3 useQuadrantFaction) */
export function runSynthColonizationAdvancePass(): { advanced: number } {
  const world = useWorldStore.getState();
  if (!world.loaded) return { advanced: 0 };

  let advanced = 0;
  for (const systemId of world.unlockedSystemIds) {
    if (!systemId.startsWith('synth_')) continue;
    const system = world.getSystem(systemId);
    const planetId = system?.planets[0]?.id;
    if (!planetId) continue;

    const phase = world.getSynthColonizationPhase(planetId);
    if (phase >= SYNTH_COLONIZATION_MAX_PHASE) continue;

    world.applySynthColonizationPhase(systemId, phase + 1);
    advanced += 1;
  }
  return { advanced };
}
