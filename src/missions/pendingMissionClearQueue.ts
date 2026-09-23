/**
 * 미션 클리어 대사 대기열 — 세션 메모리만(persist 없음).
 * 같은 이벤트에서 활성 미션 2건이 동시에 마지막 목표를 채울 때 덮어쓰기 방지.
 */

export const MAX_PENDING_MISSION_CLEAR_QUEUE = 8;

export type PendingMissionClearFields<T extends { missionId: string }> = {
  pendingMissionDialogId: string | null;
  pendingMissionClearDialog: T | null;
  pendingMissionClearQueue: T[];
};

export function emptyPendingMissionClearFields<T extends { missionId: string }>(): PendingMissionClearFields<T> {
  return {
    pendingMissionDialogId: null,
    pendingMissionClearDialog: null,
    pendingMissionClearQueue: [],
  };
}

export function isMissionInClearPipeline<T extends { missionId: string }>(
  state: Pick<PendingMissionClearFields<T>, 'pendingMissionDialogId' | 'pendingMissionClearQueue'>,
  missionId: string,
): boolean {
  if (state.pendingMissionDialogId === missionId) return true;
  const queue = state.pendingMissionClearQueue;
  for (let i = 0; i < queue.length; i += 1) {
    if (queue[i]!.missionId === missionId) return true;
  }
  return false;
}

export function enqueuePendingMissionClear<T extends { missionId: string }>(
  state: PendingMissionClearFields<T>,
  incoming: T,
): PendingMissionClearFields<T> {
  if (isMissionInClearPipeline(state, incoming.missionId)) {
    return state;
  }
  if (!state.pendingMissionDialogId) {
    return {
      pendingMissionDialogId: incoming.missionId,
      pendingMissionClearDialog: incoming,
      pendingMissionClearQueue: state.pendingMissionClearQueue,
    };
  }
  if (state.pendingMissionClearQueue.length >= MAX_PENDING_MISSION_CLEAR_QUEUE) {
    return state;
  }
  return {
    pendingMissionDialogId: state.pendingMissionDialogId,
    pendingMissionClearDialog: state.pendingMissionClearDialog,
    pendingMissionClearQueue: [...state.pendingMissionClearQueue, incoming],
  };
}

export function promoteNextPendingMissionClear<T extends { missionId: string }>(
  queue: readonly T[],
): PendingMissionClearFields<T> {
  if (queue.length === 0) return emptyPendingMissionClearFields<T>();
  const next = queue[0]!;
  const rest: T[] = [];
  for (let i = 1; i < queue.length; i += 1) {
    rest.push(queue[i]!);
  }
  return {
    pendingMissionDialogId: next.missionId,
    pendingMissionClearDialog: next,
    pendingMissionClearQueue: rest,
  };
}

export function collectHydratePendingMissionClears<T extends { missionId: string }>(
  slots: readonly T[],
): PendingMissionClearFields<T> {
  if (slots.length === 0) return emptyPendingMissionClearFields<T>();
  const head = slots[0]!;
  const overflow: T[] = [];
  for (let i = 1; i < slots.length && overflow.length < MAX_PENDING_MISSION_CLEAR_QUEUE; i += 1) {
    overflow.push(slots[i]!);
  }
  return {
    pendingMissionDialogId: head.missionId,
    pendingMissionClearDialog: head,
    pendingMissionClearQueue: overflow,
  };
}
