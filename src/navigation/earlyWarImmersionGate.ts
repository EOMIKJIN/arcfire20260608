// ============================================================
// 초반 전쟁 overlay 잠금 — persist 신설 없음.
// playerStore가 tutorialComplete만 미러. 플레이어 없음 = 추가 잠금 없음.
// ============================================================

let knownTutorialComplete: boolean | null = null;

export function syncEarlyWarImmersionTutorialComplete(complete: boolean | null): void {
  knownTutorialComplete = complete;
}

export function isEarlyWarImmersionOverlayLocked(): boolean {
  if (knownTutorialComplete === null) return false;
  return knownTutorialComplete !== true;
}

export function resetEarlyWarImmersionGateForTest(): void {
  knownTutorialComplete = null;
}
