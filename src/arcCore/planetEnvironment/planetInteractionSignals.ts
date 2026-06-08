// ============================================================
// 아크코어 — 행성 허브 상호작용 스냅샷 (수송 궤도·전투 등)
// UI 전용 컨텍스트 없이 getState() 기준 — 벽시계 패스에서만 읽음
// ============================================================

import { hasCapitalRealtimeCombatSlotsForPlanet } from '../../combat/capitalRealtimeBridge';
import { useArcNpcTrafficStore } from '../../store/arcNpcTrafficStore';
import type { ArcNpcTrafficShip } from '../../store/arcNpcTrafficStore';

export type PlanetInteractionSignals = {
  arcTrafficShipCount: number;
  /** 0..1 — 궤도 수송선 밀도 + 위상 진행(움직임·체류 리듬) */
  arcTrafficMotionScore: number;
  /** 자본궤도 실시간 전투 CSV 조건 충족 */
  capitalCombatOrbitActive: boolean;
};

function motionScoreForShips(ships: ArcNpcTrafficShip[]): number {
  if (ships.length === 0) return 0;
  let sum = 0;
  for (const sh of ships) {
    const dur = Math.max(1e-3, sh.phaseDurationSec);
    sum += Math.min(1, sh.phaseElapsedSec / dur);
  }
  const avgPhase = sum / ships.length;
  const density = Math.min(1, ships.length / 10);
  return Math.min(1, density * 0.38 + avgPhase * 0.62);
}

export function collectPlanetInteractionSignals(planetId: string, systemId: string): PlanetInteractionSignals {
  const ships = useArcNpcTrafficStore.getState().ships.filter((s) => s.planetId === planetId);
  return {
    arcTrafficShipCount: ships.length,
    arcTrafficMotionScore: motionScoreForShips(ships),
    capitalCombatOrbitActive: hasCapitalRealtimeCombatSlotsForPlanet(planetId, systemId),
  };
}
