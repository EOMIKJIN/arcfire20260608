/**
 * 일일 배치 요약 알림 — 배치 완료 시 1회 · 40초 자동 닫힘.
 * 스토리·파일럿 등록·차원항로·허브 미도착에서는 표시하지 않음.
 */
import { InteractionManager } from 'react-native';
import { t } from '../../i18n';
import { shouldSkipWorldOpsNotificationAlert } from '../territorial/territorialAlertGate';
import { ARC_DAILY_OPS_SUMMARY_ALERT_ID } from '../../ui/overlay/overlayAlertContract';
import { showArcNotificationAlert } from '../../utils/showArcAlert';
import {
  consumeArcCoreDailyOpsSummaryPending,
  type ArcCoreDailyOpsSummaryPending,
} from './arcCoreDailyOpsSummaryPending';

let leftoverFlushStarted = false;

export function presentArcCoreDailyOpsSummaryAlert(
  summary: ArcCoreDailyOpsSummaryPending,
): void {
  const hours =
    summary.hoursSinceLastBatch >= 1
      ? Math.floor(summary.hoursSinceLastBatch)
      : 0;
  const body = t('dailyOpsSummary.body', {
    dayKey: summary.dayKey,
    hours: String(hours),
    fabric: summary.economyFabric ? t('dailyOpsSummary.on') : t('dailyOpsSummary.off'),
    ingest: summary.simOverlayIngest ? t('dailyOpsSummary.on') : t('dailyOpsSummary.off'),
  });
  if (shouldSkipWorldOpsNotificationAlert()) return;
  InteractionManager.runAfterInteractions(() => {
    if (shouldSkipWorldOpsNotificationAlert()) return;
    try {
      showArcNotificationAlert(t('dailyOpsSummary.title'), body, {
        id: ARC_DAILY_OPS_SUMMARY_ALERT_ID,
      });
    } catch {
      /* overlay 미준비 — 알림만 생략 */
    }
  });
}

/** 구버전 허브 대기 pending 잔여 — 부트 1회만 소비. 틱에서 호출 금지. */
export async function flushLeftoverArcCoreDailyOpsSummaryAlertOnce(): Promise<void> {
  if (leftoverFlushStarted) return;
  leftoverFlushStarted = true;
  const summary = await consumeArcCoreDailyOpsSummaryPending();
  if (!summary) return;
  presentArcCoreDailyOpsSummaryAlert(summary);
}
