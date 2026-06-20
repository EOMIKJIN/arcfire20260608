import React, { memo, useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import type { PlanetDevelopmentModuleContext } from '../../../game/planetDevelopment/planetDevelopmentRegistry';
import type { GenericFacilityDevSnapshot } from '../../../game/planetDevelopment/planetGenericFacilityDevelopment';
import { PlanetHubDigitalGauge } from '../../../components/planet/PlanetHubActionGaugeSlot';
import { formatCredits } from '../../../utils/formatCredits';
import { showArcAlert } from '../../../utils/showArcAlert';
import { useT } from '../../../i18n';
import { OVERLAY_TOKENS } from '../../../utils/theme';
import { ArcButton } from '../ArcButton';
import { ArcOverlayCard } from '../ArcOverlayCard';
import { ArcOverlayFooterActions } from '../ArcOverlayFooterActions';
import { planetDevelopmentOverlayStyles as styles } from './planetDevelopmentOverlayStyles';

type LevelRow = { level: number; displayNameKr: string };

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
  renderExtraStats?: (snapshot: GenericFacilityDevSnapshot, currentRow: LevelRow | null) => React.ReactNode;
  renderLevelMeta?: (row: LevelRow) => string;
};

function InfoRow({ label, value }: { label: string; value: string }) {
  const PH = OVERLAY_TOKENS.phosphorAccent;
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: PH }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: PH }]}>{value}</Text>
    </View>
  );
}

export const PlanetGenericFacilityDevContent = memo(function PlanetGenericFacilityDevContent({
  planetId,
  planetName,
  canManageDevelopment,
  onBack,
  onClose,
  moduleId,
  i18nPrefix,
  api,
  renderExtraStats,
  renderLevelMeta,
}: Props) {
  const t = useT();
  const [tick, setTick] = useState(0);
  const PH = OVERLAY_TOKENS.phosphorAccent;

  useEffect(() => {
    const id = setInterval(() => {
      api.tryCompleteUpgrade(planetId);
      setTick((v) => v + 1);
    }, 500);
    return () => clearInterval(id);
  }, [api, planetId, moduleId]);

  void tick;

  const snapshot = api.buildSnapshot(planetId);
  const currentRow = snapshot.level > 0 ? api.getLevelRow(snapshot.level) : null;
  const levelRows = api.listLevelRows();
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
            variant="cta"
            disabled={!canManageDevelopment || !snapshot.canInstall}
            onPress={handlePressInstall}
          />
        ) : null}
        {snapshot.installed && !snapshot.isUpgrading && snapshot.nextTargetLevel != null ? (
          <>
            <ArcButton
              label={t(`${i18nPrefix}.upgradeBtn`, {
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
              label={t(`${i18nPrefix}.instantUpgradeBtn`, {
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
            label={t(`${i18nPrefix}.instantCompleteBtn`, {
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
        cancelLabel={t(`${i18nPrefix}.backToList`)}
        confirmLabel={t(`${i18nPrefix}.close`)}
      />
    </View>
  );

  return (
    <ArcOverlayCard
      title={t(`${i18nPrefix}.title`)}
      subtitle={planetName}
      layout="panel"
      footer={footer}
    >
        <Text style={[styles.section, { color: PH }]}>{t(`${i18nPrefix}.status`)}</Text>
        <InfoRow
          label={t(`${i18nPrefix}.stateLabel`)}
          value={
            snapshot.installed
              ? (snapshot.isCsvWorldBaseline
                ? t('planetDev.worldBuiltState', { level: snapshot.level })
                : t(`${i18nPrefix}.stateInstalled`, { level: snapshot.level }))
              : t(`${i18nPrefix}.stateNotInstalled`)
          }
        />
        {snapshot.isCsvWorldBaseline ? (
          <Text style={[styles.hint, { color: PH }]}>{t('planetDev.worldBuiltHint')}</Text>
        ) : null}
        {!snapshot.installed && snapshot.requiresInstallVictory && !snapshot.hasInstallVictory ? (
          <InfoRow
            label={t('planetDev.victoryPrereqLabel')}
            value={t('planetDev.installCombatVictoryRequired')}
          />
        ) : null}
        {renderExtraStats?.(snapshot, currentRow)}

        {snapshot.isInstalling ? (
          <View style={styles.gaugeBlock}>
            <Text style={[styles.section, { color: PH }]}>{t('planetDev.installProgress')}</Text>
            <Text style={[styles.hint, { color: PH }]}>
              {snapshot.installDurationSec != null
                ? api.formatDurationLabel(snapshot.installDurationSec)
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
            <Text style={[styles.section, { color: PH }]}>{t(`${i18nPrefix}.upgradeProgress`)}</Text>
            <Text style={[styles.hint, { color: PH }]}>
              Lv.{snapshot.level} → Lv.{snapshot.upgradeJob?.targetLevel ?? '?'}
            </Text>
            <PlanetHubDigitalGauge
              progressPct={snapshot.upgradeProgressPct}
              accessibilityLabel={t(`${i18nPrefix}.upgradeProgressA11y`, { pct: snapshot.upgradeProgressPct })}
            />
          </View>
        ) : null}

        <Text style={[styles.section, { color: PH }]}>{t(`${i18nPrefix}.levelStats`)}</Text>
        {levelRows.map((row) => (
          <View
            key={row.level}
            style={[styles.levelRow, row.level === snapshot.level ? styles.levelRowActive : null]}
          >
            <Text style={[styles.levelRowTitle, { color: PH }]}>
              Lv.{row.level} {row.displayNameKr}
              {row.level === snapshot.level ? ' ◀' : ''}
            </Text>
            {renderLevelMeta ? (
              <Text style={[styles.levelRowMeta, { color: PH }]}>{renderLevelMeta(row)}</Text>
            ) : null}
          </View>
        ))}
    </ArcOverlayCard>
  );
});
