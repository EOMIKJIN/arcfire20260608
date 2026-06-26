/**
 * STAGE 전환 LOADING gate 가 코드상 판별 가능한 시간 초과 시 최후 안내.
 * (worldmap galaxyMapStageReady 고착 · planet departure isTransiting 고착)
 */

import { useEffect, useRef } from 'react';
import { t } from '../i18n';
import { showArcAlert } from '../utils/showArcAlert';
import { useArcOverlayStore } from '../ui/overlay/arcOverlayStore';

/** 520ms min hold + 900ms scroll recovery + InteractionManager deadline 여유 */
export const STAGE_TRANSITION_STUCK_RECOVER_MS = 8000;
export const STAGE_TRANSITION_STUCK_ALERT_MS = 12000;

const STAGE_LOADING_OVERLAY_PREFIX = 'stage-loading';
const STUCK_ALERT_ID = 'stage-transition-stuck-restart';

let stuckAlertShownThisProcess = false;

function dismissStageLoadingOverlays(): void {
  useArcOverlayStore.getState().dismissWhere(
    (e) => e.kind === 'blocking' && e.id.startsWith(STAGE_LOADING_OVERLAY_PREFIX),
  );
}

export function showStageTransitionRestartAlert(): void {
  if (stuckAlertShownThisProcess) return;
  stuckAlertShownThisProcess = true;
  dismissStageLoadingOverlays();
  showArcAlert(
    t('stageTransition.stuck.title'),
    t('stageTransition.stuck.body'),
    [{ text: t('common.confirm') }],
    { id: STUCK_ALERT_ID },
  );
}

/** stuck=true 가 STAGE_TRANSITION_STUCK_ALERT_MS 이상 지속되면 재시작 안내 1회 */
export function useStageTransitionStuckWatchdog(
  stuck: boolean,
  onRecover?: () => void,
): void {
  const recoverRef = useRef(onRecover);
  recoverRef.current = onRecover;

  useEffect(() => {
    if (!stuck) return;
    const recoverTimer = setTimeout(() => {
      recoverRef.current?.();
    }, STAGE_TRANSITION_STUCK_RECOVER_MS);
    const alertTimer = setTimeout(() => {
      showStageTransitionRestartAlert();
    }, STAGE_TRANSITION_STUCK_ALERT_MS);
    return () => {
      clearTimeout(recoverTimer);
      clearTimeout(alertTimer);
    };
  }, [stuck]);
}
