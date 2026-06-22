import { useCallback } from 'react';
import { useT } from '../../i18n';
import { showArcAlert } from '../../utils/showArcAlert';
import { preflightPlanetHubSession } from './preflightPlanetHub';

/**
 * 행성 허브 대용량 UI 버튼 — present 전 sync preflight.
 * 실패 시 ArcOverlayHost 진입 없이 알림만 표시.
 */
export function useHeavyUiPlanetHubAction(
  planetId: string | null | undefined,
  onOpen: () => void,
): () => void {
  const t = useT();
  return useCallback(() => {
    const pf = preflightPlanetHubSession(planetId);
    if (!pf.ok) {
      showArcAlert(t('heavyUi.errorTitle'), t(`heavyUi.preflight.${pf.code}`));
      return;
    }
    onOpen();
  }, [planetId, onOpen, t]);
}

export { preflightPlanetHubSession } from './preflightPlanetHub';
