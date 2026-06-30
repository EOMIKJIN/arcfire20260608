import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import type { PlanetDevelopmentModuleContext } from '../../../game/planetDevelopment/planetDevelopmentRegistry';
import type { GenericFacilityDevSnapshot } from '../../../game/planetDevelopment/planetGenericFacilityDevelopment';
import { PlanetHubDigitalGauge } from '../../../components/planet/PlanetHubActionGaugeSlot';
import { formatCredits } from '../../../utils/formatCredits';
import { showArcAlert } from '../../../utils/showArcAlert';
import { useT } from '../../../i18n';
import { ArcButton } from '../ArcButton';
import { ArcOverlayCard } from '../ArcOverlayCard';
import { ArcOverlayFooterActions } from '../ArcOverlayFooterActions';
import { ArcOverlayInfoRow } from '../ArcOverlayInfoRow';
import { overlayInkColor } from '../overlayVisualTokens';
import { resolveArcOverlayVisualTheme, type ArcOverlayVisualTheme } from '../tacticalOverlayRollout';
import { PlanetDevHintText, PlanetDevSectionBar, PlanetDevSummaryInset } from './PlanetDevOverlayChrome';
import { planetDevelopmentOverlayStyles as styles } from './planetDevelopmentOverlayStyles';
import {
  formatPlanetDevLevelLabel,
  formatPlanetDevLevelUpgradeArrow,
  planetDevLevelI18nParams,
  planetDevUpgradeI18nParams,
} from '../../../game/planetDevelopment/planetFacilityDevLevelDisplay';
import {
  HeavyUiOverlayShell,
  createPlanetDevDetailSession,
  useHeavyUiDataSession,
} from '../../heavyUiDataSession';

type LevelRow = { level: number; displayNameKr: string };

type FacilityDevSessionData = {
  snapshot: GenericFacilityDevSnapshot;
  currentRow: LevelRow | null;
  levelRows: LevelRow[];
};

type FacilityDevApi = {
  buildSnapshot: (planetId: string) => GenericFacilityDevSnapshot;
  tryCompleteUpgrade: (planetId: string) => boolean;
  install: (planetId: string) => { ok: true } | { ok: false; reason: string };
  startUpgrade: (planetId: string) => { ok: true } | { ok: false; reason: string };
  instantCompleteUpgrade: (planetId: string) => { ok: true } | { ok: false; reason: string };
  instantUpgradeNext: (planetId: string) => { ok: true } | { ok: false; reason: string };
  formatDurationLabel: (sec: number) => string;
  getLevelRow: (level: number) => LevelRow | null;
  listLevelRows: () => LevelRow[];
};

type Props = PlanetDevelopmentModuleContext & {
  moduleId: string;
  i18nPrefix: string;
  api: FacilityDevApi;
  renderExtraStats?: (
    snapshot: GenericFacilityDevSnapshot,
    currentRow: LevelRow | null,
    visualTheme: ArcOverlayVisualTheme,
  ) => React.ReactNode;
  renderLevelMeta?: (row: LevelRow) => string;
};

type ReadyProps = Props & { data: FacilityDevSessionData };

const PlanetGenericFacilityDevReady = memo(function PlanetGenericFacilityDevReady({
  planetId,
  planetName,
  moduleId,
  canManageDevelopment,
  onBack,
  onClose,
  i18nPrefix,
  api,
  renderExtraStats,
  renderLevelMeta,
  data,
}: ReadyProps) {
  const t = useT();
  const visualTheme = resolveArcOverlayVisualTheme('planetDevelopment');
  const isTactical = visualTheme === 'tactical';
  const moduleSummaryKey = `planetDev.summary.${moduleId}`;
  const moduleSummaryRaw = t(moduleSummaryKey);
  const moduleSummary = moduleSummaryRaw === moduleSummaryKey ? '' : moduleSummaryRaw;
  const { snapshot, currentRow, levelRows } = data;
  const nextDurationLabel = snapshot.nextUpgradeDurationSec != null
    ? api.formatDurationLabel(snapshot.nextUpgradeDurationSec)
    : '—';

  const handlePressInstall = useCallback(() => {
    if (!canManageDevelopment) {
      showArcAlert(t('planetDev.manageDeniedTitle'), t(`${i18nPrefix}.homeOnlyBody`));
      return;
    }
    if (snapshot.installBlockReason) {
      showArcAlert(t(`${i18nPrefix}.installFailTitle`), snapshot.installBlockReason);
      return;
    }
    showArcAlert(
      t(`${i18nPrefix}.installTitle`),
      t(`${i18nPrefix}.installBody`, { cost: formatCredits(snapshot.installCost, { suffix: true }) }),
      [
        { text: t(`${i18nPrefix}.cancel`), style: 'cancel' },
        {
          text: t(`${i18nPrefix}.install`),
          onPress: () => {
            const res = api.install(planetId);
            if (!res.ok) showArcAlert(t(`${i18nPrefix}.installFailTitle`), res.reason);
          },
        },
      ],
    );
  }, [api, i18nPrefix, canManageDevelopment, planetId, snapshot.installBlockReason, snapshot.installCost, t]);

  const handleStartUpgrade = useCallback(() => {
    if (!canManageDevelopment) {
      showArcAlert(t('planetDev.manageDeniedTitle'), t('planetDev.upgradeDenied'));
      return;
    }
    const res = api.startUpgrade(planetId);
    if (!res.ok) showArcAlert(t(`${i18nPrefix}.upgradeTitle`), res.reason);
  }, [api, i18nPrefix, canManageDevelopment, planetId, t]);

  const handleInstantComplete = useCallback(() => {
    const res = api.instantCompleteUpgrade(planetId);
    if (!res.ok) showArcAlert(t(`${i18nPrefix}.instantCompleteTitle`), res.reason);
  }, [api, i18nPrefix, planetId, t]);

  const handleInstantNext = useCallback(() => {
    if (!canManageDevelopment) {
      showArcAlert(t('planetDev.manageDeniedTitle'), t('planetDev.upgradeDenied'));
      return;
    }
    const total = (snapshot.nextUpgradeCost ?? 0) + (snapshot.nextInstantCost ?? 0);
    showArcAlert(
      t(`${i18nPrefix}.instantUpgradeTitle`),
      t(`${i18nPrefix}.instantUpgradeBody`, { cost: formatCredits(total, { suffix: true }) }),
      [
        { text: t(`${i18nPrefix}.cancel`), style: 'cancel' },
        {
          text: t(`${i18nPrefix}.instantUpgradeTitle`),
          onPress: () => {
            const res = api.instantUpgradeNext(planetId);
            if (!res.ok) showArcAlert(t(`${i18nPrefix}.instantUpgradeTitle`), res.reason);
          },
        },
      ],
    );
  }, [api, i18nPrefix, canManageDevelopment, planetId, snapshot.nextInstantCost, snapshot.nextUpgradeCost, t]);

  const footer = (
    <View style={styles.footerStack}>
      <View style={styles.btnCol}>
        {!snapshot.installed && !snapshot.isInstalling ? (
          <ArcButton
            label={t(`${i18nPrefix}.installBtn`, { cost: formatCredits(snapshot.installCost, { suffix: true }) })}
            visualTheme={visualTheme}
            intent="cta"
            disabled={!canManageDevelopment || !snapshot.canInstall}
            onPress={handlePressInstall}
          />
        ) : null}
        {snapshot.installed && !snapshot.isUpgrading && snapshot.nextTargetLevel != null ? (
          <>
            <ArcButton
              label={t(`${i18nPrefix}.upgradeBtn`, {
                ...planetDevUpgradeI18nParams(snapshot.level, snapshot.nextTargetLevel, t),
                cost: formatCredits(snapshot.nextUpgradeCost ?? 0, { suffix: true }),
                duration: nextDurationLabel,
              })}
              visualTheme={visualTheme}
              intent="primary"
              disabled={!canManageDevelopment || !snapshot.canStartUpgrade}
              onPress={handleStartUpgrade}
            />
            <ArcButton
              label={t(`${i18nPrefix}.instantUpgradeBtn`, {
                to: snapshot.nextTargetLevel,
                toEpic: planetDevLevelI18nParams(snapshot.nextTargetLevel, t).epicBadge,
                cost: formatCredits((snapshot.nextUpgradeCost ?? 0) + (snapshot.nextInstantCost ?? 0), { suffix: true }),
              })}
              visualTheme={visualTheme}
              intent="secondary"
              disabled={!canManageDevelopment || !snapshot.canInstantUpgradeNext}
              onPress={handleInstantNext}
            />
          </>
        ) : null}
        {snapshot.isUpgrading || snapshot.isInstalling ? (
          <ArcButton
            label={t(`${i18nPrefix}.instantCompleteBtn`, {
              cost: formatCredits(snapshot.nextInstantCost ?? 0, { suffix: true }),
            })}
            visualTheme={visualTheme}
            intent="cta"
            disabled={!snapshot.canInstantComplete}
            onPress={handleInstantComplete}
          />
        ) : null}
      </View>
      <ArcOverlayFooterActions
        onCancel={onBack}
        onConfirm={onClose}
        cancelLabel={t(`${i18nPrefix}.backToList`)}
        confirmLabel={t(`${i18nPrefix}.close`)}
        visualTheme={visualTheme}
      />
    </View>
  );

  return (
    <ArcOverlayCard
      title={t(`${i18nPrefix}.title`)}
      subtitle={planetName}
      layout="panel"
      panelPrefix={moduleSummary ? <PlanetDevSummaryInset text={moduleSummary} visualTheme={visualTheme} /> : undefined}
      footer={footer}
      visualTheme={visualTheme}
      onClose={onClose}
    >
      <PlanetDevSectionBar
        label={t(`${i18nPrefix}.status`)}
        visualTheme={visualTheme}
        leadSection={!moduleSummary}
      />
      <ArcOverlayInfoRow
        label={t(`${i18nPrefix}.stateLabel`)}
        value={
          snapshot.installed
            ? (snapshot.isCsvWorldBaseline
              ? t('planetDev.worldBuiltState', planetDevLevelI18nParams(snapshot.level, t))
              : t(`${i18nPrefix}.stateInstalled`, planetDevLevelI18nParams(snapshot.level, t)))
            : t(`${i18nPrefix}.stateNotInstalled`)
        }
        visualTheme={visualTheme}
      />
      {snapshot.isCsvWorldBaseline ? (
        <PlanetDevHintText visualTheme={visualTheme}>{t('planetDev.worldBuiltHint')}</PlanetDevHintText>
      ) : null}
      {!snapshot.installed && snapshot.requiresInstallVictory && !snapshot.hasInstallVictory ? (
        <ArcOverlayInfoRow
          label={t('planetDev.victoryPrereqLabel')}
          value={t('planetDev.installCombatVictoryRequired')}
          visualTheme={visualTheme}
        />
      ) : null}
      {!canManageDevelopment ? (
        <PlanetDevHintText visualTheme={visualTheme}>{t('planetDev.manageDeniedHint')}</PlanetDevHintText>
      ) : null}
      {!snapshot.installed && snapshot.installBlockReason ? (
        <ArcOverlayInfoRow
          label={t('planetDev.installBlockLabel')}
          value={snapshot.installBlockReason}
          visualTheme={visualTheme}
        />
      ) : null}
      {renderExtraStats?.(snapshot, currentRow, visualTheme)}
      {snapshot.isInstalling ? (
        <View style={styles.gaugeBlock}>
          <PlanetDevSectionBar label={t('planetDev.installProgress')} visualTheme={visualTheme} />
          <PlanetDevHintText visualTheme={visualTheme} variant="body">
            {snapshot.installDurationSec != null
              ? api.formatDurationLabel(snapshot.installDurationSec)
              : '—'}
          </PlanetDevHintText>
          <PlanetHubDigitalGauge
            progressPct={snapshot.upgradeProgressPct}
            accessibilityLabel={t('planetDev.installProgressA11y', { pct: snapshot.upgradeProgressPct })}
          />
        </View>
      ) : null}
      {snapshot.isUpgrading ? (
        <View style={styles.gaugeBlock}>
          <PlanetDevSectionBar label={t(`${i18nPrefix}.upgradeProgress`)} visualTheme={visualTheme} />
          <PlanetDevHintText visualTheme={visualTheme} variant="body">
            {snapshot.upgradeJob?.targetLevel != null
              ? formatPlanetDevLevelUpgradeArrow(snapshot.level, snapshot.upgradeJob.targetLevel, t)
              : `${formatPlanetDevLevelLabel(snapshot.level, t)} → ?`}
          </PlanetDevHintText>
          <PlanetHubDigitalGauge
            progressPct={snapshot.upgradeProgressPct}
            accessibilityLabel={t(`${i18nPrefix}.upgradeProgressA11y`, { pct: snapshot.upgradeProgressPct })}
          />
        </View>
      ) : null}
      <PlanetDevSectionBar label={t(`${i18nPrefix}.levelStats`)} visualTheme={visualTheme} />
      {levelRows.map((row) => (
        <View
          key={row.level}
          style={[
            styles.levelRow,
            isTactical && styles.levelRowTactical,
            row.level === snapshot.level
              ? (isTactical ? styles.levelRowActiveTactical : styles.levelRowActive)
              : null,
          ]}
        >
          <Text
            style={[
              styles.levelRowTitle,
              { color: overlayInkColor(visualTheme, isTactical ? 'value' : 'accent') },
            ]}
          >
            {formatPlanetDevLevelLabel(row.level, t)} {row.displayNameKr}
            {row.level === snapshot.level ? ' ◀' : ''}
          </Text>
          {renderLevelMeta ? (
            <Text style={[styles.levelRowMeta, { color: overlayInkColor(visualTheme, isTactical ? 'label' : 'value') }]}>
              {renderLevelMeta(row)}
            </Text>
          ) : null}
        </View>
      ))}
    </ArcOverlayCard>
  );
});

export const PlanetGenericFacilityDevContent = memo(function PlanetGenericFacilityDevContent(props: Props) {
  const { planetId, planetName, moduleId, api, i18nPrefix, onBack, onClose } = props;
  const t = useT();
  const visualTheme = resolveArcOverlayVisualTheme('planetDevelopment');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      api.tryCompleteUpgrade(planetId);
      setTick((v) => v + 1);
    }, 500);
    return () => clearInterval(id);
  }, [api, planetId, moduleId]);

  const sessionConfig = useMemo(
    () =>
      createPlanetDevDetailSession(planetId, moduleId, (): FacilityDevSessionData => {
        const snap = api.buildSnapshot(planetId);
        return {
          snapshot: snap,
          currentRow: snap.level > 0 ? api.getLevelRow(snap.level) : null,
          levelRows: api.listLevelRows(),
        };
      }),
    [api, moduleId, planetId],
  );
  const session = useHeavyUiDataSession(sessionConfig, tick);

  if (session.phase !== 'ready' || !session.data) {
    return (
      <HeavyUiOverlayShell
        title={t(`${i18nPrefix}.title`)}
        subtitle={planetName}
        layout="panel"
        phase={session.phase}
        error={session.error}
        preflightCode={session.preflightCode}
        onClose={onClose}
        onRetry={session.retry}
        visualTheme={visualTheme}
        footer={
          <ArcOverlayFooterActions
            onCancel={onBack}
            onConfirm={onClose}
            cancelLabel={t(`${i18nPrefix}.backToList`)}
            confirmLabel={t(`${i18nPrefix}.close`)}
            visualTheme={visualTheme}
          />
        }
      >
        {null}
      </HeavyUiOverlayShell>
    );
  }

  return <PlanetGenericFacilityDevReady {...props} data={session.data} />;
});
