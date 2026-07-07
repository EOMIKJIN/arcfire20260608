import { create } from 'zustand';

export type ArcInboundDronePhase = 'inbound' | 'destroyed' | 'impacted';

export interface ArcInboundDrone {
  id: string;
  planetId: string;
  /** 전방향 접근 — 0..2π 랜덤 */
  approachAngleRad: number;
  /** 스폰 시점 orbitClockMs — 트레일·FX 앵커(연출 보조) */
  inboundStartOrbitMs?: number;
  /** 스폰 시점 ArcCore 벽시계(sec) — inbound 진행 정본 */
  inboundStartWallSec?: number;
  inboundElapsedSec: number;
  inboundDurationSec: number;
  hp: number;
  maxHp: number;
  phase: ArcInboundDronePhase;
  /** 방어위성 방어구 내 누적 체류(초) — 이탈 시 0 */
  defenseZoneDwellSec?: number;
  /** 방어구 통과 중 최소 누수율(0.05..1) — impact 시 스탯 intensityMul */
  strikeLeakMul?: number;
  /** 스파이 유도 — impact intensity 배율 (spawn 시 스냅샷) */
  spyStrikeDamageMul?: number;
  /** 스파이 유도 — 요격 전 최소 누수율 하한 */
  spyMinStrikeLeakMul?: number;
  /** 요격/충돌 시점(벽시계 sec) — 트레일 페이드 동안 스냅샷 유지 */
  trailEndWallSec?: number;
  /** 요격/충돌 시점 orbitClockMs — FX·트레일 머리와 마크 동기 */
  inboundEndOrbitMs?: number;
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

export function resetArcInboundDroneStore(): void {
  useArcInboundDroneStore.setState({ drones: [], initialized: false });
}
