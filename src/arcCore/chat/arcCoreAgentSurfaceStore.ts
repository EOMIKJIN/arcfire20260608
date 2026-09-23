import { create } from 'zustand';
import { isArcCoreAgentSurfaceCombatBlocked } from './arcCoreAgentSurfaceCombatGate';

export type ArcCoreAgentSurfaceFront = 'game' | 'agent';

/** ✕ 터치가 허브 「대화」로 새어 즉시 재오픈되는 것 차단 */
export const ARC_CORE_AGENT_REOPEN_LOCK_MS = 480;

type ArcCoreAgentSurfaceState = {
  mounted: boolean;
  front: ArcCoreAgentSurfaceFront;
  immediate: boolean;
  /** 닫는 중 — 게임으로 터치가 통과하지 않게 면을 잠시 유지 */
  closing: boolean;
  /** 열릴 때마다 증가 — 닫은 뒤 네이티브 opacity 0 잔류 방지 */
  openNonce: number;
  activateAgent: (opts?: { ignoreReopenLock?: boolean }) => boolean;
  activateGame: (opts?: { immediate?: boolean }) => void;
  settleClosing: () => void;
  unmountSurface: () => void;
};

let lastClosedAtMs = 0;
let pendingResumeAfterIngameDialog = false;

export function markResumeArcCoreAgentAfterIngameDialog(): void {
  pendingResumeAfterIngameDialog = true;
}

export function clearResumeArcCoreAgentAfterIngameDialog(): void {
  pendingResumeAfterIngameDialog = false;
}

export function hasPendingResumeArcCoreAgentAfterIngameDialog(): boolean {
  return pendingResumeAfterIngameDialog;
}

export function consumeResumeArcCoreAgentAfterIngameDialog(): boolean {
  if (!pendingResumeAfterIngameDialog) return false;
  pendingResumeAfterIngameDialog = false;
  return true;
}

export function isArcCoreAgentSurfaceReopenLocked(nowMs = Date.now()): boolean {
  return nowMs - lastClosedAtMs < ARC_CORE_AGENT_REOPEN_LOCK_MS;
}

export const useArcCoreAgentSurfaceStore = create<ArcCoreAgentSurfaceState>((set, get) => ({
  mounted: false,
  front: 'game',
  immediate: false,
  closing: false,
  openNonce: 0,
  activateAgent: (opts) => {
    if (isArcCoreAgentSurfaceCombatBlocked()) return false;
    if (!opts?.ignoreReopenLock && isArcCoreAgentSurfaceReopenLocked()) return false;
    const cur = get();
    if (cur.mounted && cur.front === 'agent') return true;
    set({
      mounted: true,
      front: 'agent',
      immediate: false,
      closing: false,
      openNonce: cur.openNonce + 1,
    });
    return true;
  },
  activateGame: (opts) => {
    const cur = get();
    if (!cur.mounted) return;
    const immediate = opts?.immediate === true;
    if (cur.front === 'game' && immediate === cur.immediate && !cur.closing) return;
    lastClosedAtMs = Date.now();
    set({
      front: 'game',
      immediate,
      closing: !immediate,
    });
  },
  settleClosing: () => {
    if (!get().closing) return;
    set({ closing: false });
  },
  unmountSurface: () => {
    lastClosedAtMs = 0;
    pendingResumeAfterIngameDialog = false;
    if (!get().mounted && get().front === 'game' && !get().closing) return;
    set({ mounted: false, front: 'game', immediate: true, closing: false, openNonce: 0 });
  },
}));

export function isArcCoreAgentSurfaceOpen(): boolean {
  const s = useArcCoreAgentSurfaceStore.getState();
  return s.mounted && s.front === 'agent';
}

export function isArcCoreAgentSurfaceAbsorbing(): boolean {
  const s = useArcCoreAgentSurfaceStore.getState();
  return s.mounted && (s.front === 'agent' || s.closing);
}

export function hideArcCoreAgentSurfaceForCombat(): void {
  pendingResumeAfterIngameDialog = false;
  useArcCoreAgentSurfaceStore.getState().activateGame({ immediate: true });
}

export function unmountArcCoreAgentSurface(): void {
  useArcCoreAgentSurfaceStore.getState().unmountSurface();
}
