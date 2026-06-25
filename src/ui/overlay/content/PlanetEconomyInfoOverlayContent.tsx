import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ArcOverlayPlanetEconomyInfoEntry } from '../arcOverlayStore';
import { resolveMegaFactionCapitalHubSubtitle } from '../../../world/megaFactionCapitalDisplay';
import { formatPlanetPgpBmu } from '../../../world/planetPgpModel';
import { useArcCoreTransportFleetBankStore } from '../../../store/factionVault/arcCoreTransportFleetBankStore';
import { useArcCoreVaultStore } from '../../../store/factionVault/arcCoreVaultStore';
import { useBlueTeamSharedVaultStore } from '../../../store/factionVault/blueTeamSharedVaultStore';
import { useClanWarFoundationStore } from '../../../store/clanWarFoundationStore';
import { usePlanetCoreRuntimeStore } from '../../../store/planetCoreRuntimeStore';
import { usePlanetTradeFeeLedgerStore } from '../../../store/planetTradeFeeLedgerStore';
import { formatCredits } from '../../../utils/formatCredits';
import { useT } from '../../../i18n';
import { FONTS, OVERLAY_TOKENS, SPACING } from '../../../utils/theme';
import { ArcOverlayFooterActions } from '../ArcOverlayFooterActions';
import { ArcOverlayInfoRow } from '../ArcOverlayInfoRow';
import { useAppSettingsStore } from '../../../store/appSettingsStore';
import { resolvePlanetInfoPanelDescription } from '../../../game/planetHub/resolvePlanetTableDescription';
import { PlanetInfoDescriptionBlock } from './PlanetInfoDescriptionBlock';
import { PlanetInfoPortraitSlot } from './PlanetInfoPortraitSlot';
import {
  HeavyUiOverlayShell,
  createPlanetEconomyInfoSession,
  readPlanetEconomyInfoRevision,
  useHeavyUiDataSession,
} from '../../heavyUiDataSession';
import { resolveArcOverlayVisualTheme } from '../tacticalOverlayRollout';
import {
  tacticalPlanetEconomyOverlayStyles,
} from '../tacticalOverlayStyles';

type Props = {
  entry: ArcOverlayPlanetEconomyInfoEntry;
  onClose: () => void;
};

export const PlanetEconomyInfoOverlayContent = memo(function PlanetEconomyInfoOverlayContent({
  entry,
  onClose,
}: Props) {
  const t = useT();
  const locale = useAppSettingsStore((s) => s.locale);
  const { planetId, planetName } = entry;
  const visualTheme = resolveArcOverlayVisualTheme('planetEconomyInfo');
  const isTactical = visualTheme === 'tactical';

  const coreSlice = usePlanetCoreRuntimeStore((s) => s.byPlanetId[planetId]);
  const tradeBucket = usePlanetTradeFeeLedgerStore((s) => s.byPlanetId[planetId]);
  const fleetBalance = useArcCoreTransportFleetBankStore((s) => s.balanceCredits);
  const arcVaultBalance = useArcCoreVaultStore((s) => s.balanceCredits);
  const blueVaultBalance = useBlueTeamSharedVaultStore((s) => s.balanceCredits);
  const planetHold = useClanWarFoundationStore((s) => s.planetHolds[planetId]);

  const sessionConfig = useMemo(
    () => createPlanetEconomyInfoSession(planetId, planetName),
    [planetId, planetName],
  );
  const revision = useMemo(
    () => readPlanetEconomyInfoRevision(planetId),
    [planetId, coreSlice, tradeBucket, planetHold, fleetBalance, arcVaultBalance, blueVaultBalance],
  );

  const session = useHeavyUiDataSession(sessionConfig, revision);
  const PH = OVERLAY_TOKENS.phosphorAccent;
  const capitalSubtitle = useMemo(
    () => resolveMegaFactionCapitalHubSubtitle(planetId, t, locale),
    [planetId, t, locale],
  );

  const themeStyles = isTactical ? tacticalPlanetEconomyOverlayStyles : styles;
  const planetDescription = useMemo(
    () => session.data?.planetDescription ?? resolvePlanetInfoPanelDescription(planetId, locale),
    [session.data?.planetDescription, planetId, locale],
  );

  const panelBleedPrefix = <PlanetInfoPortraitSlot planetId={planetId} />;

  const panelPrefix = (
    <>
      <PlanetInfoDescriptionBlock description={planetDescription} visualTheme={visualTheme} />
      {capitalSubtitle ? (
        <Text style={themeStyles.capitalSubtitle}>{capitalSubtitle}</Text>
      ) : null}
    </>
  );

  const snapshot = session.data;
  const subtitleRaw = snapshot
    ? `${snapshot.planetName} · KST ${snapshot.kstDayKey}`
    : planetName;

  const infoRow = (label: string, value: string) => (
    <ArcOverlayInfoRow label={label} value={value} visualTheme={visualTheme} />
  );

  const section = (label: string) => (
    <Text style={[themeStyles.section, !isTactical ? { color: PH } : null]}>{label}</Text>
  );

  return (
    <HeavyUiOverlayShell
      title={t('econInfo.title')}
      subtitle={subtitleRaw}
      layout="panel"
      panelPrefix={panelPrefix}
      panelBleedPrefix={panelBleedPrefix}
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
      {snapshot ? (
        <>
          <View style={themeStyles.pgpBanner}>
            <Text style={[themeStyles.pgpLabel, !isTactical ? { color: PH } : null]}>
              {t('econInfo.pgpTotal')}
            </Text>
            <Text style={themeStyles.pgpValue}>{formatPlanetPgpBmu(snapshot.pgpBmu)}</Text>
          </View>
          {section(t('econInfo.upkeep', { pct: snapshot.populationPct }))}
          {infoRow(t('econInfo.daily'), formatCredits(snapshot.upkeepDailyCredits, { suffix: true }))}
          {infoRow(t('econInfo.monthlyEst'), formatCredits(snapshot.upkeepMonthlyCredits, { suffix: true }))}
          {section(t('econInfo.tradeFee'))}
          {infoRow(t('econInfo.factionShareToday'), formatCredits(snapshot.tradeFeeTodayCredits, { suffix: true }))}
          {infoRow(t('econInfo.convoyFeeToday'), formatCredits(snapshot.convoyTradeFeeTodayCredits, { suffix: true }))}
          {infoRow(t('econInfo.playerFeeToday'), formatCredits(snapshot.playerTradeFeeTodayCredits, { suffix: true }))}
          {infoRow(t('econInfo.monthlyEst'), formatCredits(snapshot.tradeFeeMonthlyEstCredits, { suffix: true }))}
          {section(t('econInfo.coreMetrics'))}
          {infoRow(t('econInfo.resource'), `${snapshot.resourcePct}%`)}
          {infoRow(t('econInfo.population'), `${snapshot.populationStatPct}%`)}
          {infoRow(t('econInfo.defense'), `${snapshot.defensePct}%`)}
          {infoRow(t('econInfo.technology'), `${snapshot.technologyPct}%`)}
          {infoRow(t('econInfo.environment'), `${snapshot.environmentPct}%`)}
          {section(t('econInfo.tradeOccupy'))}
          {infoRow(t('econInfo.convoyMonopoly'), snapshot.convoyMonopolyLabel)}
          {infoRow(t('econInfo.occupierFaction'), snapshot.occupierFactionLabel)}
          {snapshot.factionVaultLabel != null ? (
            infoRow(
              snapshot.factionVaultLabel,
              snapshot.factionVaultBalanceCredits != null
                ? formatCredits(snapshot.factionVaultBalanceCredits, { suffix: true })
                : '—',
            )
          ) : null}
          {section(t('econInfo.others'))}
          {snapshot.extras.map((row, index) => (
            <ArcOverlayInfoRow
              key={`econ-extra-${index}`}
              label={row.label}
              value={row.value}
              visualTheme={visualTheme}
            />
          ))}
        </>
      ) : null}
    </HeavyUiOverlayShell>
  );
});

const styles = StyleSheet.create({
  capitalSubtitle: {
    marginTop: SPACING.sm,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    textAlign: 'center',
    letterSpacing: 0.3,
    color: OVERLAY_TOKENS.valueContentColor,
  },
  pgpBanner: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: OVERLAY_TOKENS.phosphorBorder,
    borderRadius: 4,
    backgroundColor: 'rgba(53, 208, 255, 0.08)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  pgpLabel: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    letterSpacing: 0.5,
  },
  pgpValue: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    textAlign: 'right',
    flexShrink: 1,
    color: OVERLAY_TOKENS.valueContentColor,
  },
  section: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    letterSpacing: 0.5,
  },
});
