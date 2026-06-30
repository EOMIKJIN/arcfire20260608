import type { ArcAlertButton } from '../ui/overlay/arcOverlayStore';
import type { ArcAlertPresentOptions } from '../ui/overlay/arcOverlayStore';

export type { ArcAlertPresentOptions };

/**
 * 시스템 `Alert.alert` 대체 — ArcOverlayHost alert kind.
 * 기본 **30초 자동 닫힘** (`overlayAlertContract`). 수동만: `{ autoDismissMs: 0 }`.
 */
export function showArcAlert(
  title: string,
  message?: string,
  buttons?: ArcAlertButton[],
  options?: ArcAlertPresentOptions,
) {
  // arcOverlayStore ↔ showArcAlert 순환참조 방지 — 호출 시점에만 로드
  const { presentArcOverlayAlert } = require('../ui/overlay/arcOverlayStore') as typeof import('../ui/overlay/arcOverlayStore');
  presentArcOverlayAlert(title, message ?? '', buttons, options);
}

/** 접전·ArcCore 정보 알림 — showArcAlert 동일(30s 자동 닫힘). 의미적 별칭. */
export function showArcNotificationAlert(
  title: string,
  message?: string,
  options?: ArcAlertPresentOptions,
) {
  showArcAlert(title, message, undefined, options);
}

export type { ArcAlertButton } from '../ui/overlay/arcOverlayStore';
