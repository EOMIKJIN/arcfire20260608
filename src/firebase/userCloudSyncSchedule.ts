/** 순환 import 방지 — 스토어는 이 모듈만 import */

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleUserCloudSync(): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void import('./userDataSync').then(m => m.syncUserDataWithServer());
  }, 900);
}

/** 앱 백그라운드/종료 전환 시 대기 중인 디바운스 동기화 예약 취소 */
export function cancelScheduledUserCloudSync(): void {
  if (!debounceTimer) return;
  clearTimeout(debounceTimer);
  debounceTimer = null;
}
