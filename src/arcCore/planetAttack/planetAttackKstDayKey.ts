/** Android Hermes에서 Intl.DateTimeFormat 생성은 호출당 수 ms — 모듈당 1회만 만든다. */
let kstDayKeyFormatter: Intl.DateTimeFormat | null = null;

/** arc_core_daily_ops_policy 와 동일 — 일일 이벤트 상한 집계용 KST 날짜 키(YYYY-MM-DD). */
export function planetAttackKstDayKey(nowMs = Date.now()): string {
  if (!kstDayKeyFormatter) {
    kstDayKeyFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }
  return kstDayKeyFormatter.format(nowMs);
}
