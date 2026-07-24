/**
 * 전쟁 스폴일 소유권 단가 — 순수 계산 (store/RN 비의존 · 단위 테스트 가능)
 */

export function computeWarSpoilsOwnershipDeedPriceCredits(input: {
  neutralizedAt: number | null | undefined;
  isIndependentNation: boolean;
  isContestedEligible: boolean;
  warSpoilsTestPriceCredits: number;
  warSpoilsRequireContested: boolean;
}): number | null {
  if (input.isIndependentNation) return null;
  if (!input.neutralizedAt) return null;
  if (input.warSpoilsRequireContested && !input.isContestedEligible) return null;
  return Math.max(1, Math.floor(input.warSpoilsTestPriceCredits));
}
