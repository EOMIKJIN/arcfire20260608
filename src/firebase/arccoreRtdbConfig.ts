// ============================================================
// ArcCore RTDB — Database URL · boot read budget
// Firebase Console → Realtime Database → URL 과 일치해야 함
// ============================================================

/** google-services.json project_id 기준 (미설정 시 Android RTDB 연결 실패) */
export const ARCORE_RTDB_DATABASE_URL =
  'https://arcfire-49d69-default-rtdb.firebaseio.com';

/** boot 1회 read 상한 — withBootTimeout 8s 대기 방지 */
export const ARCORE_RTDB_BOOT_READ_TIMEOUT_MS = 4_000;
