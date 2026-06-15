import React, { memo, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ArcOverlayPlanetEconomyInfoEntry } from '../arcOverlayStore';
import { buildPlanetEconomyInfoSnapshot } from '../../../game/planetHub/planetEconomyInfoSnapshot';
import { useArcCoreTransportFleetBankStore } from '../../../store/factionVault/arcCoreTransportFleetBankStore';
import { useArcCoreVaultStore } from '../../../store/factionVault/arcCoreVaultStore';
import { useBlueTeamSharedVaultStore } from '../../../store/factionVault/blueTeamSharedVaultStore';
import { useClanWarFoundationStore } from '../../../store/clanWarFoundationStore';
import { usePlanetCoreRuntimeStore } from '../../../store/planetCoreRuntimeStore';
import { usePlanetTradeFeeLedgerStore } from '../../../store/planetTradeFeeLedgerStore';
import { formatCredits } from '../../../utils/formatCredits';
import { FONTS, OVERLAY_TOKENS, SPACING } from '../../../utils/theme';
import { ArcButton } from '../ArcButton';

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
  const { planetId, planetName } = entry;
  const coreRuntime = usePlanetCoreRuntimeStore((s) => s.byPlanetId[planetId]);
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
      <Text style={[styles.title, { color: PH }]}>행성 경제 정보</Text>
      <Text style={[styles.subtitle, { color: PH }]}>
        {snapshot.planetName} · KST {snapshot.kstDayKey}
      </Text>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.section, { color: PH }]}>유지비 (인구 {snapshot.populationPct}%)</Text>
        <InfoRow
          label="일간"
          value={formatCredits(snapshot.upkeepDailyCredits, { suffix: true })}
        />
        <InfoRow
          label="월간 추정"
          value={formatCredits(snapshot.upkeepMonthlyCredits, { suffix: true })}
        />

        <Text style={[styles.section, { color: PH }]}>무역소 수수료 수익</Text>
        <InfoRow
          label="금일 팩션 몫"
          value={formatCredits(snapshot.tradeFeeTodayCredits, { suffix: true })}
        />
        <InfoRow
          label="수송선단 거래수익(금일)"
          value={formatCredits(snapshot.convoyTradeFeeTodayCredits, { suffix: true })}
        />
        <InfoRow
          label="플레이어 거래수익(금일)"
          value={formatCredits(snapshot.playerTradeFeeTodayCredits, { suffix: true })}
        />
        <InfoRow
          label="월간 추정"
          value={formatCredits(snapshot.tradeFeeMonthlyEstCredits, { suffix: true })}
        />

        <Text style={[styles.section, { color: PH }]}>5대 핵심 지표 (%)</Text>
        <InfoRow label="R 자원" value={`${snapshot.resourcePct}%`} />
        <InfoRow label="P 인구" value={`${snapshot.populationStatPct}%`} />
        <InfoRow label="D 방어" value={`${snapshot.defensePct}%`} />
        <InfoRow label="T 기술" value={`${snapshot.technologyPct}%`} />
        <InfoRow label="E 환경" value={`${snapshot.environmentPct}%`} />

        <Text style={[styles.section, { color: PH }]}>교역·점유</Text>
        <InfoRow label="거래 독점 선단" value={snapshot.convoyMonopolyLabel} />
        <InfoRow label="점유 팩션" value={snapshot.occupierFactionLabel} />
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

        <Text style={[styles.section, { color: PH }]}>기타</Text>
        {snapshot.extras.map((row) => (
          <InfoRow key={row.label} label={row.label} value={row.value} />
        ))}
      </ScrollView>
      <View style={styles.btnRow}>
        <ArcButton label="닫기" variant="primary" onPress={onClose} />
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
  btnRow: {
    marginTop: SPACING.md,
  },
});
