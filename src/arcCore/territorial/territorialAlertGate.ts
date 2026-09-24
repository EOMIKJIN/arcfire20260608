import { isAccountResetInProgress } from '../../account/accountResetPresence';
import { isTitleStartScreenActive } from '../../navigation/titleStartScreenPresence';
import {
  hasPlanetHubWorldOpsNotifyUnlocked,
  isPreHubWorldOpsAlertSuppressed,
} from '../../navigation/worldOpsNotifyPresence';
import { useAppBootStore } from '../../store/appBootStore';

/**
 * 시작화면·스토리·파일럿 등록·차원항로·허브 미도착·부트 미완료·계정 초기화
 * — 일일운영 요약만 스킵. 월드 판정·hold 변경은 그대로 두고 UI만 생략.
 * 접전·이상현상 팝업은 `shouldSkipUnidentifiedAnomalyAlert` (허브 잠금 없음).
 */
export function shouldSkipWorldOpsNotificationAlert(): boolean {
  if (isTitleStartScreenActive()) return true;
  if (isPreHubWorldOpsAlertSuppressed()) return true;
  if (!hasPlanetHubWorldOpsNotifyUnlocked()) return true;
  if (isAccountResetInProgress()) return true;
  if (!useAppBootStore.getState().bootReady) return true;
  return false;
}

/**
 * 접전·이상현상 팝업 — 타이틀·스토리·항로·부트·초기화만 스킵.
 * 허브 도착 잠금은 쓰지 않는다. 허브·은하 지도에서 발생 즉시 표시.
 */
export function shouldSkipUnidentifiedAnomalyAlert(): boolean {
  if (isTitleStartScreenActive()) return true;
  if (isPreHubWorldOpsAlertSuppressed()) return true;
  if (isAccountResetInProgress()) return true;
  if (!useAppBootStore.getState().bootReady) return true;
  return false;
}

export const shouldSkipTerritorialOccupationAlert = shouldSkipUnidentifiedAnomalyAlert;
