import React, { memo, useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { listPlanetDefenseSatelliteLevelRows } from '../../../arcCore/balance/planetDefenseSatelliteLevelPolicy';
import { PlanetHubDigitalGauge } from '../../../components/planet/PlanetHubActionGaugeSlot';
import type { PlanetDevelopmentModuleContext } from '../../../game/planetDevelopment/planetDevelopmentRegistry';
import { usePlanetCoreRuntimeStore } from '../../../store/planetCoreRuntimeStore';
import {
  buildDefenseSatelliteDevSnapshot,
  formatDefenseSatelliteDurationLabel,
  getDefenseSatelliteLevelStatRow,
  installPlanetDefenseSatellite,
  instantCompleteDefenseSatelliteUpgrade,
  instantUpgradeDefenseSatelliteNext,
  startPlanetDefenseSatelliteUpgrade,
} from '../../../systems/planetaryDefense/planetDefenseSatelliteDevelopment';
import { formatCredits } from '../../../utils/formatCredits';
import { showArcAlert } from '../../../utils/showArcAlert';
import { useT } from '../../../i18n';
import { ArcButton } from '../ArcButton';
import { ArcOverlayInfoRow } from '../ArcOverlayInfoRow';
import { ArcOverlayCard } from '../ArcOverlayCard';
import { ArcOverlayFooterActions } from '../ArcOverlayFooterActions';
import { overlayInkColor } from '../overlayVisualTokens';
import { resolveArcOverlayVisualTheme } from '../tacticalOverlayRollout';
import { PlanetDevHintText, PlanetDevSectionBar, PlanetDevSummaryInset } from './PlanetDevOverlayChrome';
import { planetDevelopmentOverlayStyles as styles } from './planetDevelopmentOverlayStyles';
import {
  formatPlanetDevLevelLabel,
  formatPlanetDevLevelUpgradeArrow,
  planetDevLevelI18nParams,
  planetDevUpgradeI18nParams,
} from '../../../game/planetDevelopment/planetFacilityDevLevelDisplay';

export const PlanetDefenseSatelliteDevContent = memo(function PlanetDefenseSatelliteDevContent({
  planetId,
  planetName,
  canManageDevelopment,
  onBack,
  onClose,
}: PlanetDevelopmentModuleContext) {
  const t = useT();
  const visualTheme = resolveArcOverlayVisualTheme('planetDevelopment');
  const isTactical = visualTheme === 'tactical';
  const [tick, setTick] = useState(0);

  const defenseRev = usePlanetCoreRuntimeStore(
    useCallback((s) => {
      const detail = s.byPlanetId[planetId]?.detail;
      const dev = detail?.development?.byModuleId?.defense_satellite ?? detail?.defenseSatellite;
      return JSON.stringify(dev ?? null);
    }, [planetId]),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setTick((t) => t + 1);
    }, 500);
    return () => clearInterval(id);
  }, [planetId, defenseRev]);

  void tick;
  void defenseRev;

  const snapshot = buildDefenseSatelliteDevSnapshot(planetId);
  const currentRow = snapshot.level > 0 ? getDefenseSatelliteLevelStatRow(snapshot.level) : null;
  const moduleSummaryKey = 'planetDev.summary.defense_satellite';
  const moduleSummaryRaw = t(moduleSummaryKey);
  const moduleSummary = moduleSummaryRaw === moduleSummaryKey ? '' : moduleSummaryRaw;
  const levelRows = listPlanetDefenseSatelliteLevelRows();
  const nextDurationLabel = snapshot.nextUpgradeDurationSec != null
    ? formatDefenseSatelliteDurationLabel(snapshot.nextUpgradeDurationSec)
    : '—';

  const handlePressInstall = useCallback(() => {
    if (!canManageDevelopment) {
      showArcAlert(t('planetDev.manageDeniedTitle'), t('defenseSat.installHomeOnly'));
      return;
    }
    showArcAlert(
      t('defenseSat.installTitle'),
      t('defenseSat.installBody', { cost: formatCredits(snapshot.installCost, { suffix: true }) }),
      [
        { text: t('defenseSat.cancel'), style: 'cancel' },
        {
          text: t('defenseSat.install'),
          onPress: () => {
            const res = installPlanetDefenseSatellite(planetId);
            if (!res.ok) showArcAlert(t('defenseSat.installFailTitle'), res.reason);
          },
        },
      ],
    );
  }, [canManageDevelopment, planetId, snapshot.installCost, t]);

  const handleStartUpgrade = useCallback(() => {
    if (!canManageDevelopment) {
      showArcAlert(t('planetDev.manageDeniedTitle'), t('defenseSat.upgradeHomeOnly'));
      return;
    }
    const res = startPlanetDefenseSatelliteUpgrade(planetId);
    if (!res.ok) showArcAlert(t('defenseSat.upgradeTitle'), res.reason);
  }, [canManageDevelopment, planetId, t]);

  const handleInstantComplete = useCallback(() => {
    const res = instantCompleteDefenseSatelliteUpgrade(planetId);
    if (!res.ok) showArcAlert(t('defenseSat.instantCompleteTitle'), res.reason);
  }, [planetId, t]);

  const handleInstantNext = useCallback(() => {
    if (!canManageDevelopment) {
      showArcAlert(t('planetDev.manageDeniedTitle'), t('defenseSat.upgradeHomeOnly'));
      return;
    }
    const total = (snapshot.nextUpgradeCost ?? 0) + (snapshot.nextInstantCost ?? 0);
    showArcAlert(
      t('defenseSat.instantUpgradeTitle'),
      t('defenseSat.instantUpgradeBody', { cost: formatCredits(total, { suffix: true }) }),
      [
        { text: t('defenseSat.cancel'), style: 'cancel' },
        {
          text: t('defenseSat.instantUpgradeTitle'),
          onPress: () => {
            const res = instantUpgradeDefenseSatelliteNext(planetId);
            if (!res.ok) showArcAlert(t('defenseSat.instantUpgradeTitle'), res.reason);
          },
        },
      ],
    );
  }, [canManageDevelopment, planetId, snapshot.nextInstantCost, snapshot.nextUpgradeCost, t]);

  const footer = (
    <View style={styles.footerStack}>
      <View style={styles.btnCol}>
        {!snapshot.installed && !snapshot.isInstalling ? (
          <ArcButton
            label={t('defenseSat.installBtn', { cost: formatCredits(snapshot.installCost, { suffix: true }) })}
            visualTheme={visualTheme}
            intent="cta"
            disabled={!canManageDevelopment || !snapshot.canInstall}
            onPress={handlePressInstall}
          />
        ) : null}
        {snapshot.installed && !snapshot.isUpgrading && snapshot.nextTargetLevel != null ? (
          <>
            <ArcButton
              label={t('defenseSat.upgradeBtn', {
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
              label={t('defenseSat.instantUpgradeBtn', {
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
            label={t('defenseSat.instantCompleteBtn', { cost: formatCredits(snapshot.nextInstantCost ?? 0, { suffix: true }) })}
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
        cancelLabel={t('defenseSat.backToList')}
        confirmLabel={t('defenseSat.close')}
        visualTheme={visualTheme}
      />
    </View>
  );

  const levelRowTitleColor = overlayInkColor(visualTheme, isTactical ? 'value' : 'accent');
  const levelRowMetaColor = overlayInkColor(visualTheme, isTactical ? 'label' : 'value');

  return (
    <ArcOverlayCard
      title={t('defenseSat.title')}
      subtitle={planetName}
      layout="panel"
      panelPrefix={moduleSummary ? <PlanetDevSummaryInset text={moduleSummary} visualTheme={visualTheme} /> : undefined}
      footer={footer}
      visualTheme={visualTheme}
    >
        <PlanetDevSectionBar
          label={t('defenseSat.status')}
          visualTheme={visualTheme}
          leadSection={!moduleSummary}
        />
        <ArcOverlayInfoRow
          label={t('defenseSat.stateLabel')}
          value={
            snapshot.installed
              ? t('defenseSat.stateInstalled', {
                  ...planetDevLevelI18nParams(snapshot.level, t),
                  count: snapshot.activeSatelliteCount,
                })
              : t('defenseSat.stateNotInstalled')
          }
          visualTheme={visualTheme}
        />
        {currentRow ? (
          <>
            <ArcOverlayInfoRow label={t('defenseSat.hp')} value={`${currentRow.hpMax}`} visualTheme={visualTheme} />
            <ArcOverlayInfoRow label={t('defenseSat.defenseZone')} value={`${currentRow.defenseZoneDiameterPx}px`} visualTheme={visualTheme} />
            <ArcOverlayInfoRow label={t('defenseSat.hitRate')} value={`${currentRow.interceptHitPct}%`} visualTheme={visualTheme} />
            <ArcOverlayInfoRow label={t('defenseSat.interceptDwell')} value={t('defenseSat.interceptDwellValue', { sec: currentRow.interceptDwellSec })} visualTheme={visualTheme} />
          </>
        ) : null}

        {snapshot.isInstalling ? (
          <View style={styles.gaugeBlock}>
            <PlanetDevSectionBar label={t('planetDev.installProgress')} visualTheme={visualTheme} />
            <PlanetDevHintText visualTheme={visualTheme} variant="body">
              {snapshot.installDurationSec != null
                ? formatDefenseSatelliteDurationLabel(snapshot.installDurationSec)
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
            <PlanetDevSectionBar label={t('defenseSat.upgradeProgress')} visualTheme={visualTheme} />
            <PlanetDevHintText visualTheme={visualTheme} variant="body">
              {snapshot.upgradeJob?.targetLevel != null
                ? formatPlanetDevLevelUpgradeArrow(snapshot.level, snapshot.upgradeJob.targetLevel, t)
                : `${formatPlanetDevLevelLabel(snapshot.level, t)} → ?`}
            </PlanetDevHintText>
            <PlanetHubDigitalGauge
              progressPct={snapshot.upgradeProgressPct}
              accessibilityLabel={t('defenseSat.upgradeProgressA11y', { pct: snapshot.upgradeProgressPct })}
            />
          </View>
        ) : null}

        <PlanetDevSectionBar label={t('defenseSat.levelStats')} visualTheme={visualTheme} />
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
            <Text style={[styles.levelRowTitle, { color: levelRowTitleColor }]}>
              {formatPlanetDevLevelLabel(row.level, t)}
              {row.grantsSecondSatellite ? t('defenseSat.twoSats') : ''}
              {row.level === snapshot.level ? ' ◀' : ''}
            </Text>
            <Text style={[styles.levelRowMeta, { color: levelRowMetaColor }]}>
              {t('defenseSat.levelMeta', {
                hp: row.hpMax,
                zone: row.defenseZoneDiameterPx,
                hit: row.interceptHitPct,
                dwell: row.interceptDwellSec,
              })}
            </Text>
          </View>
        ))}
    </ArcOverlayCard>
  );
});
