/**
 * 이동중 전투 — 출발지·목적지 성계 세션 (인카운터 시 moveToSystem 지연)
 */

import { create } from 'zustand';
import { usePlayerStore } from '../../store/playerStore';
import { useWorldStore } from '../../store/worldStore';
import { applyReachSystemMissionObjectives } from '../../missions/applyReachSystemMissionObjectives';

export type TransitCombatSession = {
  originSystemId: string;
  destinationSystemId: string;
};

type TransitCombatSessionState = {
  session: TransitCombatSession | null;
  /** 전투 종료 후 worldmap 진입 시 목적지 패널 1회 표시 */
  pendingWorldmapArrivalUi: boolean;
  begin: (session: TransitCombatSession) => void;
  clear: () => void;
  consumeWorldmapArrivalUi: () => boolean;
  commitArrival: (opts?: {
    deliverFailTitle?: string;
    deliverFailBody?: string;
  }) => boolean;
};

export const useTransitCombatSessionStore = create<TransitCombatSessionState>((set, get) => ({
  session: null,
  pendingWorldmapArrivalUi: false,

  begin: (session) => set({ session }),

  clear: () => set({ session: null, pendingWorldmapArrivalUi: false }),

  consumeWorldmapArrivalUi: () => {
    if (!get().pendingWorldmapArrivalUi) return false;
    set({ pendingWorldmapArrivalUi: false });
    return true;
  },

  commitArrival: (opts) => {
    const session = get().session;
    if (!session) return false;

    const player = usePlayerStore.getState().player;
    if (!player) {
      set({ session: null });
      return false;
    }

    const { moveToSystem, persist } = usePlayerStore.getState();
    const { markVisited } = useWorldStore.getState();

    moveToSystem(session.destinationSystemId);
    markVisited(session.destinationSystemId);

    const playerAfterMove = usePlayerStore.getState().player;
    if (playerAfterMove) {
      applyReachSystemMissionObjectives(session.destinationSystemId, playerAfterMove, opts);
      // 미션 클리어 대화는 transitCombatPostFlow.presentMissionClearWhenReady 에서만 연출.
      // commitArrival 에서 즉시 present 하면 combat 의 LOADING blocking 과 겹쳐 멈춤(해적소탕 등).
    }

    void persist();
    set({ session: null, pendingWorldmapArrivalUi: true });
    return true;
  },
}));
