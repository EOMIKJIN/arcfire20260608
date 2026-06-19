import React, { memo, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ArcOverlayPlanetEconomyInfoEntry } from '../arcOverlayStore';
import { buildPlanetEconomyInfoSnapshot } from '../../../game/planetHub/planetEconomyInfoSnapshot';
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
import { ArcButton } from '../ArcButton';
import { phosphorOverlay } from './phosphorOverlayStyles';
import { PlanetInfoPortraitSlot } from './PlanetInfoPortraitSlot';

type Props = {
  entry: ArcOverlayPlanetEconomyInfoEntry;
  onClose: () => void;
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

export const PlanetEconomyInfoOverlayContent = memo(function PlanetEconomyInfoOverlayContent({
  entry,
  onClose,
}: Props) {
  const t = useT();
  const { planetId, planetName } = entry;
  usePlanetCoreRuntimeStore((s) => s.byPlanetId[planetId]);
  const feeBucket = usePlanetTradeFeeLedgerStore((s) => s.byPlanetId[planetId]);
  const fleetBalance = useArcCoreTransportFleetBankStore((s) => s.balanceCredits);
  const arcVaultBalance = useArcCoreVaultStore((s) => s.balanceCredits);
  const blueVaultBalance = useBlueTeamSharedVaultStore((s) => s.balanceCredits);
  const hold = useClanWarFoundationStore((s) => s.planetHolds[planetId]);

  useEffect(() => {
    void usePlanetCoreRuntimeStore.getState().bootstrapFromWorldAsync();
    void useClanWarFoundationStore.getState().loadLocalClanWarFoundation();
    void usePlanetTradeFeeLedgerStore.getState().hydrate();
    void useArcCoreTransportFleetBankStore.getState().hydrate();
    void useArcCoreVaultStore.getState().hydrate();
    void useBlueTeamSharedVaultStore.getState().hydrate();
  }, [planetId]);

  const snapshot = buildPlanetEconomyInfoSnapshot(planetId, planetName);

  const PH = OVERLAY_TOKENS.phosphorAccent;

  return (
    <View style={styles.card}>
      <Text style={[styles.title, { color: PH }]}>{t('econInfo.title')}</Text>
      <Text style={[styles.subtitle, { color: PH }]}>
        {snapshot.planetName} · KST {snapshot.kstDayKey}
      </Text>
      <PlanetInfoPortraitSlot planetId={planetId} />
      <View style={styles.pgpBanner}>
        <Text style={[styles.pgpLabel, { color: PH }]}>{t('econInfo.pgpTotal')}</Text>
        <Text style={[styles.pgpValue, { color: PH }]}>{formatPlanetPgpBmu(snapshot.pgpBmu)}</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.section, { color: PH }]}>{t('econInfo.upkeep', { pct: snapshot.populationPct })}</Text>
        <InfoRow
          label={t('econInfo.daily')}
          value={formatCredits(snapshot.upkeepDailyCredits, { suffix: true })}
        />
        <InfoRow
          label={t('econInfo.monthlyEst')}
          value={formatCredits(snapshot.upkeepMonthlyCredits, { suffix: true })}
        />

        <Text style={[styles.section, { color: PH }]}>{t('econInfo.tradeFee')}</Text>
        <InfoRow
          label={t('econInfo.factionShareToday')}
          value={formatCredits(snapshot.tradeFeeTodayCredits, { suffix: true })}
        />
        <InfoRow
          label={t('econInfo.convoyFeeToday')}
          value={formatCredits(snapshot.convoyTradeFeeTodayCredits, { suffix: true })}
        />
        <InfoRow
          label={t('econInfo.playerFeeToday')}
          value={formatCredits(snapshot.playerTradeFeeTodayCredits, { suffix: true })}
        />
        <InfoRow
          label={t('econInfo.monthlyEst')}
          value={formatCredits(snapshot.tradeFeeMonthlyEstCredits, { suffix: true })}
        />

        <Text style={[styles.section, { color: PH }]}>{t('econInfo.coreMetrics')}</Text>
        <InfoRow label={t('econInfo.resource')} value={`${snapshot.resourcePct}%`} />
        <InfoRow label={t('econInfo.population')} value={`${snapshot.populationStatPct}%`} />
        <InfoRow label={t('econInfo.defense')} value={`${snapshot.defensePct}%`} />
        <InfoRow label={t('econInfo.technology')} value={`${snapshot.technologyPct}%`} />
        <InfoRow label={t('econInfo.environment')} value={`${snapshot.environmentPct}%`} />

        <Text style={[styles.section, { color: PH }]}>{t('econInfo.tradeOccupy')}</Text>
        <InfoRow label={t('econInfo.convoyMonopoly')} value={snapshot.convoyMonopolyLabel} />
        <InfoRow label={t('econInfo.occupierFaction')} value={snapshot.occupierFactionLabel} />
        {snapshot.factionVaultLabel != null ? (
          <InfoRow
            label={snapshot.factionVaultLabel}
            value={
              snapshot.factionVaultBalanceCredits != null
                ? formatCredits(snapshot.factionVaultBalanceCredits, { suffix: true })
                : '—'
            }
          />
        ) : null}

        <Text style={[styles.section, { color: PH }]}>{t('econInfo.others')}</Text>
        {snapshot.extras.map((row) => (
          <InfoRow key={row.label} label={row.label} value={row.value} />
        ))}
      </ScrollView>
      <View style={phosphorOverlay.btnRowAckOnly}>
        <ArcButton label={t('econInfo.close')} variant="primary" onPress={onClose} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: OVERLAY_TOKENS.cardMaxWidth,
    maxHeight: '82%',
    borderWidth: 1.5,
    borderColor: OVERLAY_TOKENS.phosphorBorder,
    borderRadius: 6,
    padding: SPACING.lg,
    backgroundColor: OVERLAY_TOKENS.phosphorCardBg,
  },
  title: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    letterSpacing: 1,
    textAlign: 'center',
    textShadowColor: 'rgba(107, 212, 255, 0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  subtitle: {
    marginTop: SPACING.xs,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    textAlign: 'center',
    opacity: 0.85,
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
  },
  scroll: {
    marginTop: SPACING.md,
    maxHeight: 360,
  },
  scrollContent: {
    paddingBottom: SPACING.sm,
  },
  section: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    paddingVertical: 3,
  },
  rowLabel: {
    flex: 1,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    lineHeight: 18,
  },
  rowValue: {
    flex: 1,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    textAlign: 'right',
    lineHeight: 18,
  },
});
