/**
 * 광물 강화 job 완료 — 조선소 탭과 무관하게 범용 알림.
 */
import { t } from '../../i18n';
import { showArcNotificationAlert } from '../../utils/showArcAlert';
import {
  ARC_ALERT_DEFAULT_AUTO_DISMISS_MS,
  MINERAL_UPGRADE_COMPLETE_ALERT_ID,
} from '../../ui/overlay/overlayAlertContract';

export type MineralUpgradeCompleteRow = {
  statId: string;
  targetLevel: number;
};

function resolveStatLabel(statId: string): string {
  const key = `mineralStat.label.${statId}`;
  const translated = t(key);
  return translated !== key ? translated : statId;
}

export function showMineralUpgradeCompleteNotification(
  rows: readonly MineralUpgradeCompleteRow[],
): void {
  if (rows.length === 0) return;
  const title = t('shipyard.up.completeTitle');
  const message =
    rows.length === 1
      ? t('shipyard.up.completeBody', {
          stat: resolveStatLabel(rows[0]!.statId),
          level: rows[0]!.targetLevel,
        })
      : t('shipyard.up.completeBodyMulti', { count: rows.length });
  setTimeout(() => {
    showArcNotificationAlert(title, message, {
      id: MINERAL_UPGRADE_COMPLETE_ALERT_ID,
      autoDismissMs: ARC_ALERT_DEFAULT_AUTO_DISMISS_MS,
    });
  }, 0);
}
