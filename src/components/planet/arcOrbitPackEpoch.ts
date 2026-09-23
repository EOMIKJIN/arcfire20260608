/**
 * 아크 수송 flat 재-pack — orbit-clock 기준 phaseElapsed 연속.
 *
 * store.phaseElapsedSec는 wall tick 기준이라 orbitFrame 시계와 장기 드리프트할 수 있다.
 * 재-pack 시 wall elapsed를 그대로 넣으면 각도가 튀므로,
 * **직전 pack의 elapsed + (mirrorNow - syncMs)** 로 UI 적분과 동일 축을 유지한다.
 * phase가 바뀐 함선만 store elapsed(보통 0)로 리셋.
 *
 * 할당: Map 갱신만 · 함선 배열 복사 없음 · setState 없음.
 */

import type { ArcNpcTrafficPhase, ArcNpcTrafficShip } from '../../store/arcNpcTrafficStore';
import { packArcNpcShipsToFloat32 } from './planetOrbitHubWorklets';
import { readPlanetOrbitClockMs } from '../../arcCore/orbitClockMsBridge';

export type ArcOrbitPackEpochState = {
  syncMs: number;
  elapsedById: Map<string, number>;
  phaseById: Map<string, ArcNpcTrafficPhase>;
};

export function createArcOrbitPackEpochState(): ArcOrbitPackEpochState {
  return {
    syncMs: 0,
    elapsedById: new Map(),
    phaseById: new Map(),
  };
}

/** 재-pack용 연속 phaseElapsed 맵 + syncMs (mirror) */
export function resolveArcOrbitPackElapsed(
  ships: readonly ArcNpcTrafficShip[],
  epoch: ArcOrbitPackEpochState,
  mirrorNowMs: number = readPlanetOrbitClockMs(),
): { elapsedById: Map<string, number>; syncMs: number } {
  const mirror = Number.isFinite(mirrorNowMs) ? mirrorNowMs : 0;
  const prevSync = Number.isFinite(epoch.syncMs) ? epoch.syncMs : 0;
  const dtSec =
    epoch.elapsedById.size > 0 && mirror >= prevSync
      ? (mirror - prevSync) * 0.001
      : 0;

  const nextElapsed = new Map<string, number>();
  const nextPhase = new Map<string, ArcNpcTrafficPhase>();

  for (let i = 0; i < ships.length; i += 1) {
    const s = ships[i]!;
    const prevPhase = epoch.phaseById.get(s.id);
    const phaseChanged = prevPhase !== s.phase;
    let el: number;
    if (phaseChanged || !epoch.elapsedById.has(s.id)) {
      el = Number.isFinite(s.phaseElapsedSec) ? Math.max(0, s.phaseElapsedSec) : 0;
    } else {
      el = (epoch.elapsedById.get(s.id) ?? 0) + dtSec;
    }
    nextElapsed.set(s.id, el);
    nextPhase.set(s.id, s.phase);
  }

  epoch.syncMs = mirror;
  epoch.elapsedById = nextElapsed;
  epoch.phaseById = nextPhase;
  return { elapsedById: nextElapsed, syncMs: mirror };
}

export function packArcNpcShipsWithEpoch(
  ships: readonly ArcNpcTrafficShip[],
  epoch: ArcOrbitPackEpochState,
): { flat: number[]; syncMs: number } {
  const { elapsedById, syncMs } = resolveArcOrbitPackElapsed(ships, epoch);
  return {
    flat: packArcNpcShipsToFloat32(ships, elapsedById),
    syncMs,
  };
}
