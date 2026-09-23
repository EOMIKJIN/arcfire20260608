// inbound 방해 금지 — 기본 off. 푸시/설정 UI 없음. 켜면 허브 Alert만 막음.

export type ArcCoreInboundTalkDndPrefs = {
  enabled: boolean;
  startHour: number;
  endHour: number;
};

export const ARC_CORE_INBOUND_DND_DEFAULT: ArcCoreInboundTalkDndPrefs = {
  enabled: false,
  startHour: 0,
  endHour: 7,
};

function wrapHour(hour: number): number {
  if (!Number.isFinite(hour)) return 0;
  const n = Math.trunc(hour);
  return ((n % 24) + 24) % 24;
}

export function isHourInDndWindow(hour: number, startHour: number, endHour: number): boolean {
  const h = wrapHour(hour);
  const start = wrapHour(startHour);
  const end = wrapHour(endHour);
  if (start === end) return false;
  if (start < end) return h >= start && h < end;
  return h >= start || h < end;
}

export function isInboundTalkDndBlocked(
  now: Date,
  prefs: ArcCoreInboundTalkDndPrefs = ARC_CORE_INBOUND_DND_DEFAULT,
): boolean {
  if (!prefs.enabled) return false;
  return isHourInDndWindow(now.getHours(), prefs.startHour, prefs.endHour);
}
