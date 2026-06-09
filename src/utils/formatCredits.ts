// ============================================================
// CR(크레딧) UI 표시 — 내부 정수는 유지, 1_000+ 는 K 단위
// ============================================================

function trimTrailingZeros(s: string): string {
  return s.replace(/\.0+$/, '').replace(/(\.\d)0+$/, '$1');
}

/**
 * 크레딧 표시 문자열.
 * - 999 이하: locale 그룹 (예: 420 cr)
 * - 1_000~999_999: K (예: 1.2K cr, 42K cr)
 * - 1_000_000+: M (예: 1.5M cr)
 */
export function formatCredits(
  amount: number,
  opts?: { suffix?: boolean },
): string {
  const raw = Number(amount);
  const n = Number.isFinite(raw) ? Math.floor(raw) : 0;
  const withSuffix = opts?.suffix !== false;
  const suffix = withSuffix ? ' cr' : '';

  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    const body = v >= 10 ? `${Math.round(v)}` : trimTrailingZeros(v.toFixed(1));
    return `${body}M${suffix}`;
  }
  if (n >= 1_000) {
    const v = n / 1_000;
    let body: string;
    if (v >= 100) body = `${Math.round(v)}`;
    else if (v >= 10) body = trimTrailingZeros(v.toFixed(1));
    else body = trimTrailingZeros(v.toFixed(2));
    return `${body}K${suffix}`;
  }
  return `${n.toLocaleString()}${suffix}`;
}
