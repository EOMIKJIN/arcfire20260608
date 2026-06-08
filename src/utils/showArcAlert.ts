import type { ArcAlertButton } from '../store/arcMessageModalStore';
import { useArcMessageModalStore } from '../store/arcMessageModalStore';

/** 시스템 `Alert.alert` 대체 — 타이틀 스타일 모달 */
export function showArcAlert(title: string, message?: string, buttons?: ArcAlertButton[]) {
  useArcMessageModalStore.getState().show(title, message ?? '', buttons);
}
