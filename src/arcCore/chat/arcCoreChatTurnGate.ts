// 전송 1건 inFlight — 메모리만. persist/부트 없음.

let inFlight = false;

export function isArcCoreChatTurnInFlight(): boolean {
  return inFlight;
}

export function tryBeginArcCoreChatTurn(): boolean {
  if (inFlight) return false;
  inFlight = true;
  return true;
}

export function endArcCoreChatTurn(): void {
  inFlight = false;
}
