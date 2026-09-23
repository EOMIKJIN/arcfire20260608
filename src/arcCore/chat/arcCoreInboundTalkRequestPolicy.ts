export const ARC_CORE_INBOUND_TALK_ALERT_ID = 'arc-core-inbound-talk-request';
export const ARC_CORE_INBOUND_TALK_FIRST_DELAY_MIN_MS = 45_000;
export const ARC_CORE_INBOUND_TALK_FIRST_DELAY_MAX_MS = 90_000;
export const ARC_CORE_INBOUND_TALK_COOLDOWN_MIN_MS = 8 * 60_000;
export const ARC_CORE_INBOUND_TALK_COOLDOWN_MAX_MS = 15 * 60_000;
export const ARC_CORE_INBOUND_TALK_UNSAFE_RETRY_MS = 15_000;

export function rollBoundedDelayMs(minMs: number, maxMs: number, random = Math.random): number {
  const lo = Math.min(minMs, maxMs);
  const hi = Math.max(minMs, maxMs);
  return lo + Math.floor(random() * (hi - lo + 1));
}

export function computeInboundTalkWaitMs(eligibleAt: number, nowMs: number): number {
  return Math.max(0, eligibleAt - nowMs);
}

export function isInboundTalkSafeSlot(input: {
  hubArmed: boolean;
  appActive: boolean;
  overlayBusy: boolean;
  dialogBusy: boolean;
  waveActive: boolean;
}): boolean {
  return input.hubArmed
    && input.appActive
    && !input.overlayBusy
    && !input.dialogBusy
    && !input.waveActive;
}
