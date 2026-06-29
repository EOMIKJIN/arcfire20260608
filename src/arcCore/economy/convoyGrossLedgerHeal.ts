// ============================================================
// convoy gross ledger heal — store↔room 순환 import 방지용 분리 모듈
// ============================================================

import { getConvoyDemandDailyGrossCapCredits } from '../balance/balanceTableRegistry';

/** heal 대상 최소 필드 — PlanetTradeFeeBucket 호환 */
export type ConvoyGrossLedgerHealBucket = {
  grossCredits: number;
  convoyGrossCredits: number;
  convoyFeeCredits: number;
  arcFeeCredits: number;
};

/** cap 초과 누적(ledger 미 hydrate 정산 버그) — convoy gross만 당일 0으로 복구 */
export function healConvoyGrossLedgerBucketsOverDailyCap<
  T extends ConvoyGrossLedgerHealBucket,
>(byPlanetId: Record<string, T>): Record<string, T> {
  const grossCap = getConvoyDemandDailyGrossCapCredits();
  if (grossCap <= 0) return byPlanetId;

  let changed = false;
  const next = { ...byPlanetId };
  for (const [planetId, bucket] of Object.entries(next)) {
    const convoyGross = bucket.convoyGrossCredits ?? 0;
    if (convoyGross <= grossCap) continue;
    changed = true;
    const convoyFee = bucket.convoyFeeCredits ?? 0;
    next[planetId] = {
      ...bucket,
      grossCredits: Math.max(0, bucket.grossCredits - convoyGross),
      convoyGrossCredits: 0,
      convoyFeeCredits: 0,
      arcFeeCredits: Math.max(0, bucket.arcFeeCredits - convoyFee),
    };
    if (__DEV__) {
      console.warn(
        `[ArcCore/Convoy] heal convoy gross over cap planet=${planetId} was=${convoyGross} cap=${grossCap}`,
      );
    }
  }
  return changed ? next : byPlanetId;
}
