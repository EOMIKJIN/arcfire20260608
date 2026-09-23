import type { StelliumColonizePolicy } from './stelliumColonizeTypes';

export function resolveStelliumColonizeAttemptCredits(
  travelDays: number,
  policy: Pick<StelliumColonizePolicy, 'attemptCreditsPerHopDay'>,
): number {
  const days = Math.max(1, Math.floor(travelDays));
  return Math.max(0, Math.floor(policy.attemptCreditsPerHopDay)) * days;
}

export function resolveStelliumColonizeDepartReserveCredits(
  travelDays: number,
  policy: Pick<StelliumColonizePolicy, 'opexCreditsPerShipDay' | 'attemptCreditsPerHopDay'>,
): number {
  const days = Math.max(1, Math.floor(travelDays));
  const opex = Math.max(0, Math.floor(policy.opexCreditsPerShipDay)) * days;
  return opex + resolveStelliumColonizeAttemptCredits(days, policy);
}

/** 같은 틱 다수 출항 — 이미 승인한 항해 선지급을 잔고에서 빼 두고 본다 */
export function canAffordColonizeDepartReserve(
  balanceCredits: number,
  hullNeedCredits: number,
  voyageNeedCredits: number,
  alreadyReservedCredits: number,
): boolean {
  const need = Math.max(0, Math.floor(hullNeedCredits))
    + Math.max(0, Math.floor(voyageNeedCredits))
    + Math.max(0, Math.floor(alreadyReservedCredits));
  return Math.max(0, Math.floor(balanceCredits)) >= need;
}

export function resolveStelliumColonizeHqReserveCredits(
  policy: Pick<StelliumColonizePolicy, 'attemptCreditsPerHopDay' | 'successBondCredits'>,
  travelDays: number,
): number {
  return resolveStelliumColonizeAttemptCredits(travelDays, policy)
    + Math.max(0, Math.floor(policy.successBondCredits));
}
