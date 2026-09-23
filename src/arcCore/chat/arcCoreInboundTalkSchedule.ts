// inbound 스케줄 모듈 상태 — 타이머는 request 쪽이 보유. purge 시 eligible 잔류 방지.

let hubSlotArmed = false;
let nextEligibleAt = 0;

export function readInboundTalkHubArmed(): boolean {
  return hubSlotArmed;
}

export function writeInboundTalkHubArmed(next: boolean): void {
  hubSlotArmed = next;
}

export function readInboundTalkNextEligibleAt(): number {
  return nextEligibleAt;
}

export function writeInboundTalkNextEligibleAt(ms: number): void {
  nextEligibleAt = Math.max(0, ms);
}

export function resetArcCoreInboundTalkSchedule(): void {
  hubSlotArmed = false;
  nextEligibleAt = 0;
}
