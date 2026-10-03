/** 날짜가 바뀌고 선지출분이 남아 있으면 금고 환급액. 예산 풀 이월 없음. */
export function resolvePlanetDevBudgetRefundCredits(
  cur: { kstDayKey: string; budgetRemainingCr: number; prepaidFromVault: boolean },
  nextKstDayKey: string,
): number {
  if (!nextKstDayKey || cur.kstDayKey === nextKstDayKey) return 0;
  if (!cur.prepaidFromVault) return 0;
  return Math.max(0, Math.floor(cur.budgetRemainingCr));
}
