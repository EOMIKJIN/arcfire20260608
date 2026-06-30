import { HUB_NATIVE_RECLAIM_MIN_GAP_MS } from './processMemoryBudgetPolicy';

let lastHubNativeReclaimAtMs = 0;

/** 5분 soft + 15분 deep 동시 발화·연속 trim race 방지 */
export function tryBeginHubNativeReclaim(reason: string): boolean {
  const now = Date.now();
  if (now - lastHubNativeReclaimAtMs < HUB_NATIVE_RECLAIM_MIN_GAP_MS) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // eslint-disable-next-line no-console
      console.log(`[MEM] hubNativeReclaim skip reason=${reason} gap_ms=${now - lastHubNativeReclaimAtMs}`);
    }
    return false;
  }
  lastHubNativeReclaimAtMs = now;
  return true;
}

/** 테스트 전용 */
export function resetHubNativeReclaimCoalesceForTests(): void {
  lastHubNativeReclaimAtMs = 0;
}
