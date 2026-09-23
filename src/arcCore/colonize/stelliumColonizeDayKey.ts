/** ISO YYYY-MM-DD 일 키에 달력 일수를 더한다. 사전순 비교 유지. */
export function addKstDayKey(dayKey: string, days: number): string {
  const parts = dayKey.split('-');
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return dayKey;
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function isKstDayKeyDue(dueDayKey: string | null | undefined, todayKey: string): boolean {
  if (!dueDayKey) return false;
  return dueDayKey <= todayKey;
}
