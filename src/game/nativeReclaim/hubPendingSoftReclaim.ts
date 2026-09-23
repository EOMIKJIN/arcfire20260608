/**
 * 허브 5분 soft 틱이 inbound flying 중 skip되면 pending 표시 → flying=0 후 1회 flush.
 * 시각·게임성 변경 없음(회수 타이밍만). PSS floor 계단(soft 누락) 완화.
 */

let pendingHubSoftReclaim = false;

export function markHubSoftReclaimPending(reason: string): void {
  pendingHubSoftReclaim = true;
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[MEM] hubSoftReclaim pending reason=${reason}`);
  }
}

export function consumeHubSoftReclaimPending(): boolean {
  if (!pendingHubSoftReclaim) return false;
  pendingHubSoftReclaim = false;
  return true;
}

export function peekHubSoftReclaimPending(): boolean {
  return pendingHubSoftReclaim;
}

/** 테스트 전용 */
export function resetHubSoftReclaimPendingForTests(): void {
  pendingHubSoftReclaim = false;
}
