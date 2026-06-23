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
  tryCompleteDefenseSatelliteUpgrade,
} from '../../../systems/planetaryDefense/planetDefenseSatelliteDevelopment';
import { formatCredits } from '../../../utils/formatCredits';
import { showArcAlert } from '../../../utils/showArcAlert';
import { useT } from '../../../i18n';
import { OVERLAY_TOKENS } from '../../../utils/theme';
import { ArcButton } from '../ArcButton';
import { ArcOverlayInfoRow } from '../ArcOverlayInfoRow';
import { ArcOverlayCard } from '../ArcOverlayCard';
import { ArcOverlayFooterActions } from '../ArcOverlayFooterActions';
import { planetDevelopmentOverlayStyles as styles } from './planetDevelopmentOverlayStyles';

export const PlanetDefenseSatelliteDevContent = memo(function PlanetDefenseSatelliteDevContent({
  planetId,
  planetName,
  canManageDevelopment,
  onBack,
  onClose,
}: PlanetDevelopmentModuleContext) {
  const t = useT();
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
      tryCompleteDefenseSatelliteUpgrade(planetId);
      setTick((t) => t + 1);
    }, 500);
    return () => clearInterval(id);
  }, [planetId, defenseRev]);

  void tick;
  void defenseRev;

  const snapshot = buildDefenseSatelliteDevSnapshot(planetId);
  const currentRow = snapshot.level > 0 ? getDefenseSatelliteLevelStatRow(snapshot.level) : null;
  const PH = OVERLAY_TOKENS.phosphorAccent;
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
            variant="cta"
            disabled={!canManageDevelopment || !snapshot.canInstall}
            onPress={handlePressInstall}
          />
        ) : null}
        {snapshot.installed && !snapshot.isUpgrading && snapshot.nextTargetLevel != null ? (
          <>
            <ArcButton
              label={t('defenseSat.upgradeBtn', { from: snapshot.level, to: snapshot.nextTargetLevel, cost: formatCredits(snapshot.nextUpgradeCost ?? 0, { suffix: true }), duration: nextDurationLabel })}
              variant="primary"
              disabled={!canManageDevelopment || !snapshot.canStartUpgrade}
              onPress={handleStartUpgrade}
            />
            <ArcButton
              label={t('defenseSat.instantUpgradeBtn', { to: snapshot.nextTargetLevel, cost: formatCredits((snapshot.nextUpgradeCost ?? 0) + (snapshot.nextInstantCost ?? 0), { suffix: true }) })}
              variant="secondary"
              disabled={!canManageDevelopment || !snapshot.canInstantUpgradeNext}
              onPress={handleInstantNext}
            />
          </>
        ) : null}
        {snapshot.isUpgrading || snapshot.isInstalling ? (
          <ArcButton
            label={t('defenseSat.instantCompleteBtn', { cost: formatCredits(snapshot.nextInstantCost ?? 0, { suffix: true }) })}
            variant="cta"
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
      />
    </View>
  );

  return (
    <ArcOverlayCard
      title={t('defenseSat.title')}
      subtitle={planetName}
      layout="panel"
      footer={footer}
    >
        <Text style={[styles.section, { color: PH }]}>{t('defenseSat.status')}</Text>
        <ArcOverlayInfoRow
          label={t('defenseSat.stateLabel')}
          value={
            snapshot.installed
              ? t('defenseSat.stateInstalled', { level: snapshot.level, count: snapshot.activeSatelliteCount })
              : t('defenseSat.stateNotInstalled')
          }
        />
        {currentRow ? (
          <>
            <ArcOverlayInfoRow label={t('defenseSat.hp')} value={`${currentRow.hpMax}`} />
            <ArcOverlayInfoRow label={t('defenseSat.defenseZone')} value={`${currentRow.defenseZoneDiameterPx}px`} />
            <ArcOverlayInfoRow label={t('defenseSat.hitRate')} value={`${currentRow.interceptHitPct}%`} />
            <ArcOverlayInfoRow label={t('defenseSat.interceptDwell')} value={t('defenseSat.interceptDwellValue', { sec: currentRow.interceptDwellSec })} />
          </>
        ) : null}

        {snapshot.isInstalling ? (
          <View style={styles.gaugeBlock}>
            <Text style={[styles.section, { color: PH }]}>{t('planetDev.installProgress')}</Text>
            <Text style={[styles.hint, { color: OVERLAY_TOKENS.valueContentColor }]}>
              {snapshot.installDurationSec != null
                ? formatDefenseSatelliteDurationLabel(snapshot.installDurationSec)
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
            <Text style={[styles.section, { color: PH }]}>{t('defenseSat.upgradeProgress')}</Text>
            <Text style={[styles.hint, { color: OVERLAY_TOKENS.valueContentColor }]}>
              Lv.{snapshot.level} → Lv.{snapshot.upgradeJob?.targetLevel ?? '?'}
            </Text>
            <PlanetHubDigitalGauge
              progressPct={snapshot.upgradeProgressPct}
              accessibilityLabel={t('defenseSat.upgradeProgressA11y', { pct: snapshot.upgradeProgressPct })}
            />
          </View>
        ) : null}

        <Text style={[styles.section, { color: PH }]}>{t('defenseSat.levelStats')}</Text>
        {levelRows.map((row) => (
          <View
            key={row.level}
            style={[
              styles.levelRow,
              row.level === snapshot.level ? styles.levelRowActive : null,
            ]}
          >
            <Text style={[styles.levelRowTitle, { color: PH }]}>
              Lv.{row.level}
              {row.grantsSecondSatellite ? t('defenseSat.twoSats') : ''}
              {row.level === snapshot.level ? ' ◀' : ''}
            </Text>
            <Text style={styles.levelRowMeta}>
              {t('defenseSat.levelMeta', { hp: row.hpMax, zone: row.defenseZoneDiameterPx, hit: row.interceptHitPct, dwell: row.interceptDwellSec })}
            </Text>
          </View>
        ))}
    </ArcOverlayCard>
  );
});
