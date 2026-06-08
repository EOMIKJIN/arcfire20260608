import { create } from 'zustand';

export type ArcNpcTrafficPhase = 'entering' | 'dwelling' | 'departing';

export interface ArcNpcTrafficCaptain {
  id: string;
  name: string;
}

export interface ArcNpcTrafficShip {
  id: string;
  captainId: string;
  planetId: string;
  phase: ArcNpcTrafficPhase;
  phaseElapsedSec: number;
  phaseDurationSec: number;
  orbitAngleRad: number;
  orbitRadiusPx: number;
  edgeAngleRad: number;
  /** `npc_ai_ships.csv` — 체류 궤도 각속도(rad/s), Reanimated 패킹과 스냅샷 앵커에 동일 적용 */
  arcTrafficDwellRadPerSec: number;
  /** 같은 CSV — 위상 길이 랜덤에 곱함 */
  arcTrafficPhaseDurationMul: number;
  /** 행성 체류(dwell) 초 — [min,max] 샘플, max 상한 600 */
  arcTrafficPlanetDwellSecMin: number;
  arcTrafficPlanetDwellSecMax: number;
}

interface ArcNpcTrafficState {
  captains: ArcNpcTrafficCaptain[];
  ships: ArcNpcTrafficShip[];
  initialized: boolean;
  setSnapshot: (input: {
    captains?: ArcNpcTrafficCaptain[];
    ships?: ArcNpcTrafficShip[];
    initialized?: boolean;
  }) => void;
}

export const useArcNpcTrafficStore = create<ArcNpcTrafficState>((set) => ({
  captains: [],
  ships: [],
  initialized: false,
  setSnapshot: ({ captains, ships, initialized }) => {
    set((prev) => {
      const nextCaptains = captains ?? prev.captains;
      const nextShips = ships ?? prev.ships;
      const nextInit = initialized ?? prev.initialized;
      if (nextCaptains === prev.captains && nextShips === prev.ships && nextInit === prev.initialized) {
        return prev;
      }
      return {
        captains: nextCaptains,
        ships: nextShips,
        initialized: nextInit,
      };
    });
  },
}));
