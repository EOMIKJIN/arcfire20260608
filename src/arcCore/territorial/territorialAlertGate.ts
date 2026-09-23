import { isAccountResetInProgress } from '../../account/accountResetPresence';
import { isTitleStartScreenActive } from '../../navigation/titleStartScreenPresence';
import {
  hasPlanetHubWorldOpsNotifyUnlocked,
  isPreHubWorldOpsAlertSuppressed,
} from '../../navigation/worldOpsNotifyPresence';
import { useAppBootStore } from '../../store/appBootStore';

/**
 * 시작화면·스토리·파일럿 등록·차원항로·허브 미도착·부트 미완료·계정 초기화
 * — 접전 판정/점유 팝업·일일운영 요약 스킵. 월드 판정·hold 변경은 그대로 두고 UI만 생략.
 */
export function shouldSkipWorldOpsNotificationAlert(): boolean {
  if (isTitleStartScreenActive()) return true;
  if (isPreHubWorldOpsAlertSuppressed()) return true;
  if (!hasPlanetHubWorldOpsNotifyUnlocked()) return true;
  if (isAccountResetInProgress()) return true;
  if (!useAppBootStore.getState().bootReady) return true;
  return false;
}

export const shouldSkipTerritorialOccupationAlert = shouldSkipWorldOpsNotificationAlert;
