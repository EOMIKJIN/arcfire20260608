import { signalHubSkiaNativeReclaim } from './hubSkiaNativeReclaimSignal';
import { runPlanetHubCombatSafeReclaimPass } from './runPlanetHubCombatSafeReclaimPass';

/**
 * battleReady 카운트다운 시작(전투 Canvas 마운트 전) 1회.
 * inbound dodge overlay를 먼저 내리고, 전투 중에도 안전한 Fresco/nebula LRU만 비운다.
 * Canvas 순차 마운트·RN 백드롭 remount·90s followup 없음.
 */
export function runPlanetHubPreCombatReclaimPass(reason: string): void {
  signalHubSkiaNativeReclaim(reason);
  runPlanetHubCombatSafeReclaimPass(reason);
}
