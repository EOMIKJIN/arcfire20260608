import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Text } from 'react-native';
import {
  buildPlanetDevListRowView,
  hasAnyPlanetDevJobInProgress,
  tryCompleteAllPlanetDevJobs,
} from '../../../game/planetDevelopment/planetDevelopmentListRowModel';
import { formatCredits } from '../../../utils/formatCredits';
import { showArcAlert } from '../../../utils/showArcAlert';
import { useT } from '../../../i18n';
import { ArcOverlayFooterActions } from '../ArcOverlayFooterActions';
import { overlayInkColor } from '../overlayVisualTokens';
import { resolveArcOverlayVisualTheme } from '../tacticalOverlayRollout';
import { planetDevelopmentOverlayStyles as styles } from './planetDevelopmentOverlayStyles';
import { PlanetDevelopmentListRow } from './PlanetDevelopmentListRow';
import {
  HeavyUiOverlayShell,
  createPlanetDevelopmentListSession,
  useHeavyUiDataSession,
} from '../../heavyUiDataSession';

type Props = {
  planetId: string;
  planetName: string;
  credits: number;
  canManageDevelopment: boolean;
  onSelectModule: (moduleId: string) => void;
  onClose: () => void;
};

export const PlanetDevelopmentListContent = memo(function PlanetDevelopmentListContent({
  planetId,
  planetName,
  credits,
  canManageDevelopment,
  onSelectModule,
  onClose,
}: Props) {
  const t = useT();
  const visualTheme = resolveArcOverlayVisualTheme('planetDevelopment');
  const hintInk = overlayInkColor(visualTheme, 'label');
  const [tick, setTick] = useState(0);

  const sessionConfig = useMemo(
    () => createPlanetDevelopmentListSession(planetId),
    [planetId],
  );
  const session = useHeavyUiDataSession(sessionConfig, tick);

  const listData = session.data;
  const hasActiveJob = listData
    ? hasAnyPlanetDevJobInProgress(listData.activeSnapshots)
    : false;

  useEffect(() => {
    if (!hasActiveJob) return undefined;
    const id = setInterval(() => {
      tryCompleteAllPlanetDevJobs(planetId);
      setTick((v) => v + 1);
    }, 500);
    return () => clearInterval(id);
  }, [hasActiveJob, planetId]);

  const resolveLabel = useCallback((row: { id: string; labelKo: string }) => {
    const key = `planetDev.label.${row.id}`;
    const val = t(key);
    return val === key ? row.labelKo : val;
  }, [t]);

  const handlePressRow = useCallback((id: string, enabled: boolean, label: string) => {
    if (enabled) {
      onSelectModule(id);
      return;
    }
    showArcAlert(t('planetDev.comingSoonTitle'), t('planetDev.comingSoonBody', { label }));
  }, [onSelectModule, t]);

  return (
    <HeavyUiOverlayShell
      title={t('planetDev.title')}
      subtitle={t('planetDev.subtitle', { name: planetName, credits: formatCredits(credits, { suffix: true }) })}
      layout="panel"
      phase={session.phase}
      error={session.error}
      preflightCode={session.preflightCode}
      onClose={onClose}
      onRetry={session.retry}
      visualTheme={visualTheme}
      footer={
        session.phase === 'ready' ? (
          <ArcOverlayFooterActions onCancel={onClose} onConfirm={onClose} visualTheme={visualTheme} />
        ) : undefined
      }
    >
      {listData ? (
        <>
          {!canManageDevelopment ? (
            <Text style={[styles.hint, styles.hintListLead, { color: hintInk }]}>
              {t('planetDev.manageDeniedHint')}
            </Text>
          ) : null}
          {listData.catalogRows.map((row) => {
            const snapshot = listData.snapshotByCatalogId[row.id] ?? null;
            const rowView = buildPlanetDevListRowView(row, snapshot);
            return (
              <PlanetDevelopmentListRow
                key={row.id}
                row={rowView}
                visualTheme={visualTheme}
                onPress={() => handlePressRow(row.id, row.enabled, resolveLabel(row))}
              />
            );
          })}
        </>
      ) : null}
    </HeavyUiOverlayShell>
  );
});
