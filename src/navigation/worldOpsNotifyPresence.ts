/**
 * 일일운영 요약·스파이 긴급보고 — 행성 허브 도착 전 억제.
 * 틱/persist 없음. 타이틀·스토리·파일럿 등록·차원항로에서 잠그고, 허브 포커스에서만 해제.
 * 접전·이상현상 팝업은 이 잠금을 쓰지 않는다.
 */

let hubArrived = false;
let preHubDepth = 0;

export function markPlanetHubWorldOpsNotifyUnlocked(): void {
  hubArrived = true;
}

export function lockWorldOpsNotifyUntilPlanetHub(): void {
  hubArrived = false;
}

export function hasPlanetHubWorldOpsNotifyUnlocked(): boolean {
  return hubArrived;
}

export function beginPreHubWorldOpsAlertSuppress(): void {
  preHubDepth += 1;
}

export function endPreHubWorldOpsAlertSuppress(): void {
  if (preHubDepth > 0) preHubDepth -= 1;
}

export function isPreHubWorldOpsAlertSuppressed(): boolean {
  return preHubDepth > 0;
}

/** 최초 행성 허브 도착 전 — 접전·스파이 긴급보고 큐/자동창 스킵 */
export function shouldSkipWorldOpsNotifyUntilPlanetHub(): boolean {
  return isPreHubWorldOpsAlertSuppressed() || !hasPlanetHubWorldOpsNotifyUnlocked();
}

export function resetWorldOpsNotifyPresenceForTest(): void {
  hubArrived = false;
  preHubDepth = 0;
}
