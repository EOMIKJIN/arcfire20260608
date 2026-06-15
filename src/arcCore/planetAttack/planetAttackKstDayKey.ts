/** arc_core_daily_ops_policy 와 동일 — 일일 이벤트 상한 집계용 KST 날짜 키(YYYY-MM-DD). */
export function planetAttackKstDayKey(nowMs = Date.now()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(nowMs);
}
