import React, { type ReactNode } from 'react';
import { useT } from '../../i18n';
import { useSafeRouterBack } from '../../navigation/useSafeRouterBack';
import { useStageFirstFrameReady } from '../../navigation/useStageFirstFrameReady';
import { StageLoadingOverlay } from '../../components/StageLoadingOverlay';
import { HeavyUiStageErrorPanel } from './HeavyUiStageErrorPanel';
import type { HeavyUiSessionConfig } from './types';
import { useHeavyUiDataSession } from './useHeavyUiDataSession';
import type { PlanetHubFacilityGateKind } from '../../hooks/usePlanetHubFacilityAccessGate';

type Props<TData> = {
  sessionConfig: HeavyUiSessionConfig<TData> | null;
  revision?: unknown;
  overlayId: string;
  facilityKind?: PlanetHubFacilityGateKind;
  children: (data: TData) => ReactNode;
};

export function HeavyUiStageGate<TData>({
  sessionConfig,
  revision,
  overlayId,
  facilityKind,
  children,
}: Props<TData>) {
  const t = useT();
  const safeBack = useSafeRouterBack();
  const session = useHeavyUiDataSession(sessionConfig, revision);
  const stageFrameReady = useStageFirstFrameReady();
  const loading =
    session.phase === 'idle'
    || session.phase === 'loading'
    || !stageFrameReady;
  const ready = session.phase === 'ready' && session.data != null && stageFrameReady;

  return (
    <>
      <StageLoadingOverlay
        visible={loading && session.phase !== 'error'}
        overlayId={overlayId}
        label={t('heavyUi.loading')}
      />
      {session.phase === 'error' ? (
        <HeavyUiStageErrorPanel
          preflightCode={session.preflightCode}
          error={session.error}
          facilityKind={facilityKind}
          onRetry={session.retry}
          onBack={safeBack}
        />
      ) : null}
      {ready ? children(session.data as TData) : null}
    </>
  );
}
