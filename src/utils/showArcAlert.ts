import type { ArcAlertButton } from '../ui/overlay/arcOverlayStore';
import { presentArcOverlayAlert } from '../ui/overlay/arcOverlayStore';

/** 시스템 `Alert.alert` 대체 — ArcOverlayHost alert kind */
export function showArcAlert(title: string, message?: string, buttons?: ArcAlertButton[]) {
  presentArcOverlayAlert(title, message ?? '', buttons);
}

export type { ArcAlertButton } from '../ui/overlay/arcOverlayStore';
