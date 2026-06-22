import type { ArcAlertButton } from '../ui/overlay/arcOverlayStore';
import type { ArcAlertPresentOptions } from '../ui/overlay/arcOverlayStore';
import {
  ARC_NOTIFICATION_ALERT_AUTO_DISMISS_MS,
} from '../ui/overlay/overlayAlertContract';

export type { ArcAlertPresentOptions };

/** 시스템 `Alert.alert` 대체 — ArcOverlayHost alert kind */
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

/** 접전·아크코어 정보 알림 — 30초 후 자동 닫힘 */
export function showArcNotificationAlert(
  title: string,
  message?: string,
  options?: Omit<ArcAlertPresentOptions, 'autoDismissMs'>,
) {
  showArcAlert(title, message, undefined, {
    ...options,
    autoDismissMs: ARC_NOTIFICATION_ALERT_AUTO_DISMISS_MS,
  });
}

export type { ArcAlertButton } from '../ui/overlay/arcOverlayStore';
