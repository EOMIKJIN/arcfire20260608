/** 순환 import 방지 — 스토어는 이 모듈만 import */

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
/** 아크코어 행성 코어 틱 등 고빈도 persist — 클라우드 동기화 최소 간격(ms) */
const MIN_CLOUD_SYNC_INTERVAL_MS = 120_000;
let lastCloudSyncStartedAt = 0;

export function scheduleUserCloudSync(): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    const now = Date.now();
    if (now - lastCloudSyncStartedAt < MIN_CLOUD_SYNC_INTERVAL_MS) return;
    lastCloudSyncStartedAt = now;
    void import('./userDataSync').then(m => m.syncUserDataWithServer());
  }, 900);
}

/** 부팅·닉네임 확정 등 즉시 동기화가 필요한 경로 */
export function scheduleUserCloudSyncImmediate(): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = null;
  lastCloudSyncStartedAt = Date.now();
  void import('./userDataSync').then(m => m.syncUserDataWithServer());
}

/** 앱 백그라운드/종료 전환 시 대기 중인 디바운스 동기화 예약 취소 */
export function cancelScheduledUserCloudSync(): void {
  if (!debounceTimer) return;
  clearTimeout(debounceTimer);
  debounceTimer = null;
}
