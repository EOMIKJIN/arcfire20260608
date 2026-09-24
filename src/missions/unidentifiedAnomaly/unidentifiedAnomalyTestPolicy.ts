/**
 * 미확인 이상현상 — [테스트] 스폰 주기만.
 * 연구원·수색·유물 본선은 적용. 스폰은 30분/10분 로테이션.
 * 본선 스폰(일 2회·TTL 12h·50:50)은 아직 미승격.
 */

export const UNIDENTIFIED_ANOMALY_TEST_INTERVAL_MS = 30 * 60 * 1000;
export const UNIDENTIFIED_ANOMALY_TEST_ACTIVE_MS = 10 * 60 * 1000;
export const UNIDENTIFIED_ANOMALY_TEST_HISTORY_CAP = 8;
/** 보이는 성계가 아직 없을 때 — 0ms 재스케줄 금지 */
export const UNIDENTIFIED_ANOMALY_EMPTY_POOL_RETRY_MS = 15_000;
export const UNIDENTIFIED_ANOMALY_RING_COLOR = 'rgba(188, 120, 255, 0.90)';
