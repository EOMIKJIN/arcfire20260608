import React, { memo, useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import type { PlanetDevelopmentModuleContext } from '../../../game/planetDevelopment/planetDevelopmentRegistry';
import {
  buildOrbitShipyardDevSnapshot,
  formatOrbitShipyardDurationLabel,
  getOrbitShipyardLevelStatRow,
  installPlanetOrbitShipyard,
  instantCompleteOrbitShipyardUpgrade,
  instantUpgradeOrbitShipyardNext,
  listFacilityShipyardLevelRows,
  PLANET_DEV_MODULE_ORBIT_SHIPYARD,
  startPlanetOrbitShipyardUpgrade,
  tryCompleteOrbitShipyardUpgrade,
} from '../../../game/planetDevelopment/planetOrbitShipyardDevelopment';
import { PlanetHubDigitalGauge } from '../../../components/planet/PlanetHubActionGaugeSlot';
import { usePlanetCoreRuntimeStore } from '../../../store/planetCoreRuntimeStore';
import { formatCredits } from '../../../utils/formatCredits';
import { showArcAlert } from '../../../utils/showArcAlert';
import { useT } from '../../../i18n';
import { OVERLAY_TOKENS } from '../../../utils/theme';
import { ArcButton } from '../ArcButton';
import { ArcOverlayInfoRow } from '../ArcOverlayInfoRow';
import { ArcOverlayCard } from '../ArcOverlayCard';
import { ArcOverlayFooterActions } from '../ArcOverlayFooterActions';
import { planetDevelopmentOverlayStyles as styles } from './planetDevelopmentOverlayStyles';

export const PlanetOrbitShipyardDevContent = memo(function PlanetOrbitShipyardDevContent({
  planetId,
  planetName,
  canManageDevelopment,
  onBack,
  onClose,
}: PlanetDevelopmentModuleContext) {
  const t = useT();
  const [tick, setTick] = useState(0);

  const shipyardRev = usePlanetCoreRuntimeStore(
    useCallback((s) => {
      const dev = s.byPlanetId[planetId]?.detail?.development?.byModuleId?.[PLANET_DEV_MODULE_ORBIT_SHIPYARD];
      return JSON.stringify(dev ?? null);
    }, [planetId]),
  );

  useEffect(() => {
    const id = setInterval(() => {
      tryCompleteOrbitShipyardUpgrade(planetId);
      setTick((v) => v + 1);
    }, 500);
    return () => clearInterval(id);
  }, [planetId, shipyardRev]);

  void tick;
  void shipyardRev;

  const snapshot = buildOrbitShipyardDevSnapshot(planetId);
  const currentRow = snapshot.level > 0 ? getOrbitShipyardLevelStatRow(snapshot.level) : null;
  const PH = OVERLAY_TOKENS.phosphorAccent;
  const levelRows = listFacilityShipyardLevelRows();
  const nextDurationLabel = snapshot.nextUpgradeDurationSec != null
    ? formatOrbitShipyardDurationLabel(snapshot.nextUpgradeDurationSec)
    : '—';

  const handlePressInstall = useCallback(() => {
    if (!canManageDevelopment) {
      showArcAlert(t('planetDev.manageDeniedTitle'), t('orbitShipyard.homeOnlyBody'));
      return;
    }
    if (snapshot.installBlockReason) {
      showArcAlert(t('orbitShipyard.installFailTitle'), snapshot.installBlockReason);
      return;
    }
    showArcAlert(
      t('orbitShipyard.installTitle'),
      t('orbitShipyard.installBody', { cost: formatCredits(snapshot.installCost, { suffix: true }) }),
      [
        { text: t('orbitShipyard.cancel'), style: 'cancel' },
        {
          text: t('orbitShipyard.install'),
          onPress: () => {
            const res = installPlanetOrbitShipyard(planetId);
            if (!res.ok) showArcAlert(t('orbitShipyard.installFailTitle'), res.reason);
          },
        },
      ],
    );
  }, [canManageDevelopment, planetId, snapshot.installBlockReason, snapshot.installCost, t]);

  const handleStartUpgrade = useCallback(() => {
    if (!canManageDevelopment) {
      showArcAlert(t('planetDev.manageDeniedTitle'), t('orbitShipyard.upgradeHomeOnly'));
      return;
    }
    const res = startPlanetOrbitShipyardUpgrade(planetId);
    if (!res.ok) showArcAlert(t('orbitShipyard.upgradeTitle'), res.reason);
  }, [canManageDevelopment, planetId, t]);

  const handleInstantComplete = useCallback(() => {
    const res = instantCompleteOrbitShipyardUpgrade(planetId);
    if (!res.ok) showArcAlert(t('orbitShipyard.instantCompleteTitle'), res.reason);
  }, [planetId, t]);

  const handleInstantNext = useCallback(() => {
    if (!canManageDevelopment) {
      showArcAlert(t('planetDev.manageDeniedTitle'), t('orbitShipyard.upgradeHomeOnly'));
      return;
    }
    const total = (snapshot.nextUpgradeCost ?? 0) + (snapshot.nextInstantCost ?? 0);
    showArcAlert(
      t('orbitShipyard.instantUpgradeTitle'),
      t('orbitShipyard.instantUpgradeBody', { cost: formatCredits(total, { suffix: true }) }),
      [
        { text: t('orbitShipyard.cancel'), style: 'cancel' },
        {
          text: t('orbitShipyard.instantUpgradeTitle'),
          onPress: () => {
            const res = instantUpgradeOrbitShipyardNext(planetId);
            if (!res.ok) showArcAlert(t('orbitShipyard.instantUpgradeTitle'), res.reason);
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
            label={t('orbitShipyard.installBtn', { cost: formatCredits(snapshot.installCost, { suffix: true }) })}
            variant="cta"
            disabled={!canManageDevelopment || !snapshot.canInstall}
            onPress={handlePressInstall}
          />
        ) : null}
        {snapshot.installed && !snapshot.isUpgrading && snapshot.nextTargetLevel != null ? (
          <>
            <ArcButton
              label={t('orbitShipyard.upgradeBtn', {
                from: snapshot.level,
                to: snapshot.nextTargetLevel,
                cost: formatCredits(snapshot.nextUpgradeCost ?? 0, { suffix: true }),
                duration: nextDurationLabel,
              })}
              variant="primary"
              disabled={!canManageDevelopment || !snapshot.canStartUpgrade}
              onPress={handleStartUpgrade}
            />
            <ArcButton
              label={t('orbitShipyard.instantUpgradeBtn', {
                to: snapshot.nextTargetLevel,
                cost: formatCredits((snapshot.nextUpgradeCost ?? 0) + (snapshot.nextInstantCost ?? 0), { suffix: true }),
              })}
              variant="secondary"
              disabled={!canManageDevelopment || !snapshot.canInstantUpgradeNext}
              onPress={handleInstantNext}
            />
          </>
        ) : null}
        {snapshot.isUpgrading || snapshot.isInstalling ? (
          <ArcButton
            label={t('orbitShipyard.instantCompleteBtn', {
              cost: formatCredits(snapshot.nextInstantCost ?? 0, { suffix: true }),
            })}
            variant="cta"
            disabled={!snapshot.canInstantComplete}
            onPress={handleInstantComplete}
          />
        ) : null}
      </View>
      <ArcOverlayFooterActions
        onCancel={onBack}
        onConfirm={onClose}
        cancelLabel={t('orbitShipyard.backToList')}
        confirmLabel={t('orbitShipyard.close')}
      />
    </View>
  );

  return (
    <ArcOverlayCard
      title={t('orbitShipyard.title')}
      subtitle={planetName}
      layout="panel"
      footer={footer}
    >
        <Text style={[styles.section, { color: PH }]}>{t('orbitShipyard.status')}</Text>
        <ArcOverlayInfoRow
          label={t('orbitShipyard.stateLabel')}
          value={
            snapshot.installed
              ? (snapshot.isCsvWorldBaseline
                ? t('orbitShipyard.stateBase', { level: snapshot.level })
                : t('orbitShipyard.stateInstalled', { level: snapshot.level }))
              : t('orbitShipyard.stateNotInstalled')
          }
        />
        {snapshot.isCsvWorldBaseline ? (
          <Text style={[styles.hint, { color: PH }]}>{t('planetDev.worldBuiltHint')}</Text>
        ) : null}
        {snapshot.installed ? (
          <>
            <ArcOverlayInfoRow
              label={t('orbitShipyard.builtTiersLabel')}
              value={snapshot.builtHullTierKeys.length > 0
                ? snapshot.builtHullTierKeys.join(', ')
                : '—'}
            />
            <ArcOverlayInfoRow
              label={t('orbitShipyard.mineralCapLabel')}
              value={t('orbitShipyard.mineralCapValue', { cap: snapshot.mineralUpgradeCap })}
            />
          </>
        ) : null}
        {currentRow ? (
          <>
            <ArcOverlayInfoRow label={t('orbitShipyard.buildSpeedLabel')} value={`${currentRow.buildSpeedBonusPct}%`} />
          </>
        ) : null}

        {snapshot.isInstalling ? (
          <View style={styles.gaugeBlock}>
            <Text style={[styles.section, { color: PH }]}>{t('planetDev.installProgress')}</Text>
            <Text style={[styles.hint, { color: OVERLAY_TOKENS.valueContentColor }]}>
              {snapshot.installDurationSec != null
                ? formatOrbitShipyardDurationLabel(snapshot.installDurationSec)
                : '—'}
            </Text>
            <PlanetHubDigitalGauge
              progressPct={snapshot.upgradeProgressPct}
              accessibilityLabel={t('planetDev.installProgressA11y', { pct: snapshot.upgradeProgressPct })}
            />
          </View>
        ) : null}

        {snapshot.isUpgrading ? (
          <View style={styles.gaugeBlock}>
            <Text style={[styles.section, { color: PH }]}>{t('orbitShipyard.upgradeProgress')}</Text>
            <Text style={[styles.hint, { color: OVERLAY_TOKENS.valueContentColor }]}>
              Lv.{snapshot.level} → Lv.{snapshot.upgradeJob?.targetLevel ?? '?'}
            </Text>
            <PlanetHubDigitalGauge
              progressPct={snapshot.upgradeProgressPct}
              accessibilityLabel={t('orbitShipyard.upgradeProgressA11y', { pct: snapshot.upgradeProgressPct })}
            />
          </View>
        ) : null}

        <Text style={[styles.section, { color: PH }]}>{t('orbitShipyard.levelStats')}</Text>
        {levelRows.map((row) => (
          <View
            key={row.level}
            style={[
              styles.levelRow,
              row.level === snapshot.level ? styles.levelRowActive : null,
            ]}
          >
            <Text style={[styles.levelRowTitle, { color: PH }]}>
              Lv.{row.level} {row.displayNameKr}
              {row.level === snapshot.level ? ' ◀' : ''}
            </Text>
            <Text style={styles.levelRowMeta}>
              {t('orbitShipyard.levelMeta', {
                tiers: row.cumulativeHullTierKeys.length,
                mineral: row.mineralUpgradeCap,
              })}
            </Text>
          </View>
        ))}
    </ArcOverlayCard>
  );
});
