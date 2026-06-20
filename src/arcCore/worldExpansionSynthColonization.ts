// ============================================================
// 아크코어 — synth 성계 개척 단계 (중립 프론티어 → 점진 정착)
// ============================================================

import { useClanWarFoundationStore } from '../store/clanWarFoundationStore';
import { useWorldStore } from '../store/worldStore';
import {
  getSynthColonizationPhaseRow,
  SYNTH_COLONIZATION_MAX_PHASE,
} from './synthColonizationPhasePolicy';
import { dispatchArcCoreSeedTransportForSystem, dispatchArcCoreSystemUnlockNotice } from './worldExpansionUnlockDispatch';
import type { ArcCoreSystemUnlockKind } from './worldExpansionUnlockDispatch';

export { SYNTH_COLONIZATION_MAX_PHASE, SYNTH_FRONTIER_FACTION_ID } from './synthColonizationPhasePolicy';

/** 개방 직후 — 중립 hold + 공지(수송 없음) */
export function finalizeArcCoreSynthFrontierUnlock(
  systemId: string,
  kind: ArcCoreSystemUnlockKind,
): void {
  const world = useWorldStore.getState();
  const system = world.getSystem(systemId);
  const planetId = system?.planets[0]?.id;
  if (!planetId) return;

  useClanWarFoundationStore.getState().seedSynthFrontierNeutralHold(planetId, systemId);
  dispatchArcCoreSystemUnlockNotice(systemId, kind);
}

/** 일 1회 — 잠금 해제된 synth 중 phase < 3 행성 1단계 진행 */
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

    const nextPhase = phase + 1;
    world.applySynthColonizationPhase(systemId, nextPhase);

    const row = getSynthColonizationPhaseRow(nextPhase);
    if (row.seedTransport) {
      dispatchArcCoreSeedTransportForSystem(systemId, 'daily_colonization_advance_transport');
    }
    advanced += 1;
  }
  return { advanced };
}
