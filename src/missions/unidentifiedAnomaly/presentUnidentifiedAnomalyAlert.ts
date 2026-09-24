import { t } from '../../i18n';
import { resolveStarSystemDisplayNameNow } from '../../i18n/systemText';
import { UNIDENTIFIED_ANOMALY_ALERT_ID } from '../../ui/overlay/overlayAlertContract';
import { shouldSkipUnidentifiedAnomalyAlert } from '../../arcCore/territorial/territorialAlertGate';
import type { StarSystem } from '../../types';

export function resolveUnidentifiedAnomalySystemLabel(sys: StarSystem | undefined, fallbackId: string): string {
  const id = fallbackId.trim();
  if (!sys) return id;
  const label = resolveStarSystemDisplayNameNow(sys).trim();
  return label || id;
}

export function presentUnidentifiedAnomalyAlert(
  systemLabel: string,
  onPresented?: () => void,
): void {
  if (shouldSkipUnidentifiedAnomalyAlert()) return;
  const { showArcNotificationAlert } =
    require('../../utils/showArcAlert') as typeof import('../../utils/showArcAlert');
  setTimeout(() => {
    if (shouldSkipUnidentifiedAnomalyAlert()) return;
    showArcNotificationAlert(
      t('anomaly.alert.title'),
      t('anomaly.alert.body', { system: systemLabel }),
      { id: UNIDENTIFIED_ANOMALY_ALERT_ID },
    );
    onPresented?.();
  }, 0);
}
