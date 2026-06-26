// ============================================================
// ArcCore RTDB boot session flags — 메모리 only (persist 없음)
// ============================================================

let learningSyncEnabled = true;

/** boot RTDB config read 결과 반영 */
export function setArcCoreRtdbBootLearningSyncEnabled(enabled: boolean): void {
  learningSyncEnabled = enabled;
}

export function isArcCoreRtdbLearningSyncEnabled(): boolean {
  return learningSyncEnabled;
}
