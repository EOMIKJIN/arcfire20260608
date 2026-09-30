/** 콘솔 벽시계 마감 — 다음 08:00 Asia/Seoul. 앱 persist 없음. */
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** `YYYY-MM-DDT08:00:00+09:00` — 지금이 08:00 이전이면 당일, 아니면 익일. */
export function nextUntilWallIsoKst(nowMs = Date.now()): string {
  const kst = new Date(nowMs + KST_OFFSET_MS);
  const y = kst.getUTCFullYear();
  const mo = kst.getUTCMonth();
  const d = kst.getUTCDate();
  const today8Utc = Date.UTC(y, mo, d, 8, 0, 0, 0) - KST_OFFSET_MS;
  const nextUtc = nowMs < today8Utc ? today8Utc : today8Utc + 86_400_000;
  const nextKst = new Date(nextUtc + KST_OFFSET_MS);
  return `${nextKst.getUTCFullYear()}-${pad2(nextKst.getUTCMonth() + 1)}-${pad2(nextKst.getUTCDate())}T08:00:00+09:00`;
}

/** 미래 시각이 명시되면 유지. 없거나 이미 지났으면 다음 08:00. */
export function resolveUntilWallMs(raw: string, nowMs = Date.now()): number {
  const parsed = Date.parse(raw);
  if (Number.isFinite(parsed) && parsed > nowMs) return parsed;
  return Date.parse(nextUntilWallIsoKst(nowMs));
}
