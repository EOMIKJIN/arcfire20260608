// ============================================================
// 일일 배치 요약 — 행성 허브 진입 1회 알림 (B-UX-3)
// ============================================================

import { useEffect, useRef } from 'react';
import { consumeArcCoreDailyOpsSummaryPending } from '../../arcCore/schedule/arcCoreDailyOpsSummaryPending';
import { showArcNotificationAlert } from '../../utils/showArcAlert';
import { ARC_DAILY_OPS_SUMMARY_ALERT_ID } from '../../ui/overlay/overlayAlertContract';
import { useT } from '../../i18n';

/** planet hub mount — pending summary 있으면 Modal 1회 */
export function useArcCoreDailyOpsSummaryOnce(enabled: boolean): void {
  const t = useT();
  const shownRef = useRef(false);

  useEffect(() => {
    if (!enabled || shownRef.current) return;
    shownRef.current = true;

    void (async () => {
      const summary = await consumeArcCoreDailyOpsSummaryPending();
      if (!summary) return;

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

      showArcNotificationAlert(t('dailyOpsSummary.title'), body, {
        id: ARC_DAILY_OPS_SUMMARY_ALERT_ID,
      });
    })();
  }, [enabled, t]);
}
