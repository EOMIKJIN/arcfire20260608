// ============================================================
// ArcCore RTDB — Database URL · boot read budget
// Firebase Console → Realtime Database → URL 과 일치해야 함
// ============================================================

/**
 * 정본 RTDB URL (Asia Southeast 1).
 * ⚠️ `.firebaseio.com`(US 기본)은 프로젝트에 인스턴스가 없어 404 → boot 4s timeout → offline 오인.
 * google-services.json `firebase_url` 과 반드시 동기화. `getRtdb()`가 이 상수를 명시 사용.
 */
export const ARCORE_RTDB_DATABASE_URL =
  'https://arcfire-49d69-default-rtdb.asia-southeast1.firebasedatabase.app';

/** boot 1회 read 상한 — withBootTimeout 8s 대기 방지 · 정상 Asia 호스트면 충분 */
export const ARCORE_RTDB_BOOT_READ_TIMEOUT_MS = 4_000;

/**
 * 일일 KPI write 상한 — RTDB `.set()`은 오프라인이면 재연결 전까지 promise가 안 풀리는
 * SDK 기본 동작이 있다. 이 write는 일일 배치(economyLearning) 내부에서 호출되고,
 * 배치는 차원항로 진입 로딩(`runContinueSessionPrewarm`)에서 안전장치 없이 join되므로,
 * 여기서 안 끊으면 로딩 화면이 무한 대기로 보일 수 있다(2026-08-04 대표님 실기 재현).
 */
export const ARCORE_RTDB_DAILY_KPI_WRITE_TIMEOUT_MS = 6_000;
