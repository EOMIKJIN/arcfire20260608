// ============================================================
// 아크코어 메시지 공격 스케줄 — 로컬 일자 키·자정 시각 (provider 공통)
// ============================================================

/** 로컬 달력 1일(초) */
export const ARC_CORE_MESSAGE_DAY_SEC = 86_400;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function resolveArcCoreMessageLocalDayKey(nowMs: number): string {
  const d = new Date(nowMs);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function resolveArcCoreMessageLocalDayStartMs(dayKey: string): number {
  const [y, m, d] = dayKey.split('-').map((v) => Number(v));
  return new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
}
