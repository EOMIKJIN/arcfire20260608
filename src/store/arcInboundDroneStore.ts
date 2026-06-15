import { create } from 'zustand';

export type ArcInboundDronePhase = 'inbound' | 'destroyed' | 'impacted';

export interface ArcInboundDrone {
  id: string;
  planetId: string;
  /** 전방향 접근 — 0..2π 랜덤 */
  approachAngleRad: number;
  inboundElapsedSec: number;
  inboundDurationSec: number;
  hp: number;
  maxHp: number;
  phase: ArcInboundDronePhase;
  /** 요격/충돌 시점(벽시계 sec) — 트레일 페이드 동안 스냅샷 유지 */
  trailEndWallSec?: number;
}

interface ArcInboundDroneState {
  drones: ArcInboundDrone[];
  initialized: boolean;
  setSnapshot: (input: { drones?: ArcInboundDrone[]; initialized?: boolean }) => void;
}

export const useArcInboundDroneStore = create<ArcInboundDroneState>((set) => ({
  drones: [],
  initialized: false,
  setSnapshot: ({ drones, initialized }) => {
    set((prev) => {
      const nextDrones = drones ?? prev.drones;
      const nextInit = initialized ?? prev.initialized;
      if (nextDrones === prev.drones && nextInit === prev.initialized) {
        return prev;
      }
      return { drones: nextDrones, initialized: nextInit };
    });
  },
}));
