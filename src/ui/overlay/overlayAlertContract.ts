/**
 * compact 범용 팝업(alert · waveResult · reward · levelUp) — 기본 40초 자동 닫힘.
 * 전투 패배 결과창도 동일 계약. 예외(수동만): autoDismissMs: 0
 */

/** compact 범용 팝업 기본 자동 닫힘 — 40초 */
export const ARC_OVERLAY_DEFAULT_AUTO_DISMISS_MS = 40_000;

/** @deprecated ARC_OVERLAY_DEFAULT_AUTO_DISMISS_MS 별칭 */
export const ARC_ALERT_DEFAULT_AUTO_DISMISS_MS = ARC_OVERLAY_DEFAULT_AUTO_DISMISS_MS;

/** @deprecated ARC_OVERLAY_DEFAULT_AUTO_DISMISS_MS */
export const ARC_NOTIFICATION_ALERT_AUTO_DISMISS_MS = ARC_OVERLAY_DEFAULT_AUTO_DISMISS_MS;

export const COMPACT_AUTO_DISMISS_OVERLAY_KINDS = [
  'alert',
  'levelUp',
  'reward',
  'waveResult',
] as const;

export type CompactAutoDismissOverlayKind = (typeof COMPACT_AUTO_DISMISS_OVERLAY_KINDS)[number];

export function isCompactAutoDismissOverlayKind(
  kind: string,
): kind is CompactAutoDismissOverlayKind {
  return (
    kind === 'alert' || kind === 'levelUp' || kind === 'reward' || kind === 'waveResult'
  );
}

/** 행성 점유 변경 팝업 — 동일 id 교체로 최신 내용 갱신 */
export const TERRITORIAL_OCCUPATION_ALERT_ID = 'territorial-occupation-alert';

/** 일일 배치 요약 팝업 — 배치 완료 1회 · 허브 도착 후만 · 40초 자동 닫힘 */
export const ARC_DAILY_OPS_SUMMARY_ALERT_ID = 'arc-daily-ops-summary-alert';

/** 행성개발 설치·레벨업 완료 — 40초 자동 닫힘 · 동일 id 교체(스택 누적 방지) */
export const PLANET_DEV_LEVEL_UP_ALERT_ID_PREFIX = 'planet-dev-level-up';
export const PLANET_DEV_LEVEL_UP_ALERT_ID = `${PLANET_DEV_LEVEL_UP_ALERT_ID_PREFIX}-alert`;

/** 광물 강화 완료 — 40초 자동 닫힘 · 동일 id 교체 */
export const MINERAL_UPGRADE_COMPLETE_ALERT_ID = 'mineral-upgrade-complete-alert';

/**
 * compact autoDismissMs 해석 — undefined → 40s, 0 → 비활성, 양수 → 해당 ms
 */
export function resolveArcOverlayAutoDismissMs(explicit?: number): number | undefined {
  if (explicit === 0) return undefined;
  if (typeof explicit === 'number' && explicit > 0) return explicit;
  return ARC_OVERLAY_DEFAULT_AUTO_DISMISS_MS;
}

/** @deprecated resolveArcOverlayAutoDismissMs */
export function resolveArcAlertAutoDismissMs(explicit?: number): number | undefined {
  return resolveArcOverlayAutoDismissMs(explicit);
}

export type CompactOverlayAutoDismissAction =
  | { type: 'dismiss' }
  | { type: 'dismiss_then_press'; onPress: () => void | Promise<void> }
  | { type: 'dismiss_then_close'; onClose: () => void };

/**
 * 자동 닫힘 = 단버튼 확인과 동일.
 * 버튼 2개 이상(취소+확인)은 확인을 고르지 않고 닫기만.
 */
export function resolveCompactOverlayAutoDismissAction(entry: {
  kind: string;
  autoDismissMs?: number;
  buttons?: readonly { onPress?: () => void | Promise<void> }[];
  onClose?: () => void;
}): CompactOverlayAutoDismissAction | null {
  if (!isCompactAutoDismissOverlayKind(entry.kind)) return null;
  if (!entry.autoDismissMs || entry.autoDismissMs <= 0) return null;
  if (entry.kind === 'alert') {
    const only = entry.buttons?.length === 1 ? entry.buttons[0] : null;
    if (only?.onPress) return { type: 'dismiss_then_press', onPress: only.onPress };
    return { type: 'dismiss' };
  }
  if (entry.onClose) return { type: 'dismiss_then_close', onClose: entry.onClose };
  return { type: 'dismiss' };
}
