// ============================================================
// Balance overlay hot-swap — AGDS §단계 2
// ============================================================

import { useAabsPolicyStore } from './aabsPolicyStore';

let reloadSeq = 0;

export function reloadBalanceOverlayIndices(): number {
  reloadSeq += 1;
  useAabsPolicyStore.getState().reloadFromOverlayTable();
  return reloadSeq;
}

export function getBalanceOverlayReloadSeq(): number {
  return reloadSeq;
}
