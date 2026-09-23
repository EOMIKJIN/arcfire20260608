/** KST 시계 — 타이머 없음. 순수. */

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export const STELLA_LIFE_SLOT_MINUTES = 30;
export const STELLA_LIFE_SLOT_COUNT = 48;

export function stellaLifeKstParts(nowMs: number): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
} {
  const kst = new Date(nowMs + KST_OFFSET_MS);
  return {
    year: kst.getUTCFullYear(),
    month: kst.getUTCMonth() + 1,
    day: kst.getUTCDate(),
    hour: kst.getUTCHours(),
    minute: kst.getUTCMinutes(),
    weekday: kst.getUTCDay(),
  };
}

export function stellaLifeDayKey(nowMs: number): string {
  const p = stellaLifeKstParts(nowMs);
  const m = p.month < 10 ? `0${p.month}` : String(p.month);
  const d = p.day < 10 ? `0${p.day}` : String(p.day);
  return `${p.year}-${m}-${d}`;
}

export function stellaLifeSlotIndex(nowMs: number): number {
  const p = stellaLifeKstParts(nowMs);
  return Math.floor((p.hour * 60 + p.minute) / STELLA_LIFE_SLOT_MINUTES) % STELLA_LIFE_SLOT_COUNT;
}

/** 1=월 … 7=일 */
export function stellaLifeWeekdayMaskKey(nowMs: number): string {
  const wd = stellaLifeKstParts(nowMs).weekday;
  return wd === 0 ? '7' : String(wd);
}

export function stellaLifeAddDayKey(dayKey: string, days: number): string {
  const parts = dayKey.split('-');
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!y || !m || !d) return dayKey;
  const utc = Date.UTC(y, m - 1, d) + days * 24 * 60 * 60 * 1000;
  return stellaLifeDayKey(utc - KST_OFFSET_MS);
}

export function stellaLifeNoonMs(dayKey: string): number {
  const parts = dayKey.split('-');
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  return Date.UTC(y, m - 1, d, 3, 0, 0, 0);
}

export function stellaLifeCompareDayKey(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

export function stellaLifeDayKeysBetween(fromExclusive: string, toInclusive: string): string[] {
  const out: string[] = [];
  if (!fromExclusive || !toInclusive) return out;
  if (stellaLifeCompareDayKey(fromExclusive, toInclusive) >= 0) return out;
  let cursor = stellaLifeAddDayKey(fromExclusive, 1);
  let guard = 0;
  while (stellaLifeCompareDayKey(cursor, toInclusive) <= 0 && guard < 40) {
    out.push(cursor);
    cursor = stellaLifeAddDayKey(cursor, 1);
    guard += 1;
  }
  return out;
}

export function stellaLifeWeekKey(dayKey: string): string {
  const parts = dayKey.split('-');
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  const utc = Date.UTC(y, m - 1, d);
  const start = Date.UTC(y, 0, 1);
  const week = Math.floor((utc - start) / (7 * 24 * 60 * 60 * 1000));
  return `${y}-w${week}`;
}

export function stellaLifeHash32(...parts: string[]): number {
  let h = 2166136261;
  const joined = parts.join('|');
  for (let i = 0; i < joined.length; i += 1) {
    h ^= joined.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
