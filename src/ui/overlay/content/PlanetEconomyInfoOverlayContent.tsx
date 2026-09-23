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
import { resolvePlanetTableDescription } from '../../../game/planetHub/resolvePlanetTableDescription';
import { createEmptyPlanetCoreStatTrendSnapshot } from '../../../game/planetHub/planetEconomyInfoSnapshot';
import { PlanetInfoDescriptionBlock } from './PlanetInfoDescriptionBlock';
import { PlanetInfoGovernorCard } from './PlanetInfoGovernorCard';
import { PlanetInfoPortraitSlot } from './PlanetInfoPortraitSlot';
import { PlanetCoreStatInfoRow } from './PlanetCoreStatTrendRow';
import { PlanetStabilityInfoPanel } from './PlanetStabilityInfoPanel';
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
import { useWorldStore } from '../../../store/worldStore';
import {
  formatUnidentifiedSystemLabel,
  resolveGalaxyMapSystemCatalogOrdinal,
} from '../../../galaxyMap/galaxyMapUnidentifiedLabel';
import { resolveSystemIdForPlanetId } from '../../../world/resolvePlanetSystemId';
import { resolveSystemById } from '../../../world/resolvePlanetById';

type Props = {
  entry: ArcOverlayPlanetEconomyInfoEntry;
  onClose: () => void;
};

const UnidentifiedPlanetEconomyInfoOverlayContent = memo(
  function UnidentifiedPlanetEconomyInfoOverlayContent({
    entry,
    onClose,
  }: Props) {
    const t = useT();
    const locale = useAppSettingsStore((s) => s.locale);
    const visualTheme = resolveArcOverlayVisualTheme('planetEconomyInfo');
    const isTactical = visualTheme === 'tactical';
    const themeStyles = isTactical ? tacticalPlanetEconomyOverlayStyles : styles;
    const unknown = t('worldmap.unidentifiedValue');
    const systemId = resolveSystemIdForPlanetId(entry.planetId);
    const system = systemId ? resolveSystemById(systemId) : null;
    const fogName = formatUnidentifiedSystemLabel(
      system ? resolveGalaxyMapSystemCatalogOrdinal(system) : 0,
      locale,
    );

    const infoRow = (rowKey: string, label: string) => (
      <ArcOverlayInfoRow key={rowKey} label={label} value={unknown} visualTheme={visualTheme} />
    );
    const section = (label: string) => (
      <Text style={[themeStyles.section, !isTactical ? { color: OVERLAY_TOKENS.phosphorAccent } : null]}>
        {label}
      </Text>
    );

    return (
      <HeavyUiOverlayShell
        title={t('econInfo.title')}
        subtitle={fogName}
        layout="panel"
        phase="ready"
        error={null}
        preflightCode={null}
        onClose={onClose}
        onRetry={onClose}
        visualTheme={visualTheme}
        footer={<ArcOverlayFooterActions onCancel={onClose} onConfirm={onClose} visualTheme={visualTheme} />}
      >
        <PlanetInfoDescriptionBlock description={t('worldmap.unidentifiedDesc')} visualTheme={visualTheme} />
        {section(t('econInfo.pgpTotal'))}
        {infoRow('fog-pgp', t('econInfo.pgpTotal'))}
        {section(t('econInfo.upkeep', { pct: unknown }))}
        {infoRow('fog-upkeep-daily', t('econInfo.daily'))}
        {infoRow('fog-upkeep-monthly', t('econInfo.monthlyEst'))}
        {section(t('econInfo.tradeFee'))}
        {infoRow('fog-fee-faction', t('econInfo.factionShareToday'))}
        {infoRow('fog-fee-player', t('econInfo.playerFeeToday'))}
        {section(t('econInfo.coreMetrics'))}
        {infoRow('fog-resource', t('econInfo.resource'))}
        {infoRow('fog-population', t('econInfo.population'))}
        {infoRow('fog-defense', t('econInfo.defense'))}
        {infoRow('fog-technology', t('econInfo.technology'))}
        {infoRow('fog-environment', t('econInfo.environment'))}
        {section(t('econInfo.tradeOccupy'))}
        {infoRow('fog-occupier', t('econInfo.occupierFaction'))}
      </HeavyUiOverlayShell>
    );
  },
);

const RevealedPlanetEconomyInfoOverlayContent = memo(function RevealedPlanetEconomyInfoOverlayContent({
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
    [planetId, locale, coreSlice, tradeBucket, planetHold, fleetBalance, arcVaultBalance, blueVaultBalance],
  );

  const session = useHeavyUiDataSession(sessionConfig, revision);
  const PH = OVERLAY_TOKENS.phosphorAccent;
  const capitalSubtitle = useMemo(
    () => resolveMegaFactionCapitalHubSubtitle(planetId, t, locale),
    [planetId, t, locale],
  );

  const themeStyles = isTactical ? tacticalPlanetEconomyOverlayStyles : styles;
  const planetDescription = useMemo(
    () => session.data?.planetDescription ?? resolvePlanetTableDescription(planetId, locale),
    // session은 이미 revision(planetHold 포함)에 따라 재빌드되지만, 폴백 분기(세션 로딩 중)가
    // hold 변경을 놓치지 않도록 이 memo도 직접 hold 필드를 deps에 포함(P3 방지, 2026-07-27).
    [
      session.data?.planetDescription,
      planetId,
      locale,
      planetHold?.occupierClanId,
      planetHold?.kind,
      planetHold?.deedOwnerClanId,
    ],
  );

  const snapshot = session.data;
  const statTrends = snapshot?.statTrends ?? createEmptyPlanetCoreStatTrendSnapshot();
  const subtitleRaw = snapshot
    ? `${snapshot.planetName} · KST ${snapshot.kstDayKey}`
    : planetName;

  const infoRow = (rowKey: string, label: string, value: string) => (
    <ArcOverlayInfoRow key={rowKey} label={label} value={value} visualTheme={visualTheme} />
  );

  const section = (label: string) => (
    <Text style={[themeStyles.section, !isTactical ? { color: PH } : null]}>{label}</Text>
  );

  return (
    <HeavyUiOverlayShell
      title={t('econInfo.title')}
      subtitle={subtitleRaw}
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
      {/* 헤더 아래 모든 정보(행성 이미지·설명·총사령관 카드 포함)는 스크롤 영역 안에 둔다
          — 고정 prefix로 빼면 스크롤 가용 높이가 줄어드는 회귀(2026-07-19). */}
      <View style={styles.scrollBleedTop}>
        <PlanetInfoPortraitSlot planetId={planetId} />
      </View>
      <PlanetInfoDescriptionBlock description={planetDescription} visualTheme={visualTheme} />
      <PlanetInfoGovernorCard planetId={planetId} visualTheme={visualTheme} />
      {capitalSubtitle ? (
        <Text style={themeStyles.capitalSubtitle}>{capitalSubtitle}</Text>
      ) : null}
      {snapshot ? (
        <>
          <View style={themeStyles.pgpBanner}>
            <Text style={[themeStyles.pgpLabel, !isTactical ? { color: PH } : null]}>
              {t('econInfo.pgpTotal')}
            </Text>
            <Text style={themeStyles.pgpValue}>{formatPlanetPgpBmu(snapshot.pgpBmu)}</Text>
          </View>
          <PlanetStabilityInfoPanel
            stability={snapshot.stability}
            visualTheme={isTactical ? 'tactical' : 'default'}
          />
          {section(t('econInfo.upkeep', { pct: snapshot.populationPct }))}
          {infoRow('econ-upkeep-daily', t('econInfo.daily'), formatCredits(snapshot.upkeepDailyCredits, { suffix: true }))}
          {infoRow('econ-upkeep-monthly', t('econInfo.monthlyEst'), formatCredits(snapshot.upkeepMonthlyCredits, { suffix: true }))}
          {section(t('econInfo.tradeFee'))}
          {infoRow('econ-fee-faction', t('econInfo.factionShareToday'), formatCredits(snapshot.tradeFeeTodayCredits, { suffix: true }))}
          {infoRow('econ-fee-convoy', t('econInfo.convoyFeeToday'), formatCredits(snapshot.convoyTradeFeeTodayCredits, { suffix: true }))}
          {infoRow('econ-fee-player', t('econInfo.playerFeeToday'), formatCredits(snapshot.playerTradeFeeTodayCredits, { suffix: true }))}
          {/* 라벨 문구는 동일(월간 추정) — React key는 행 식별자로 분리 */}
          {infoRow('econ-fee-monthly', t('econInfo.monthlyEst'), formatCredits(snapshot.tradeFeeMonthlyEstCredits, { suffix: true }))}
          {section(t('econInfo.fabricEcology'))}
          {infoRow('econ-supply-vitality', t('econSnap.supplyVitality'), snapshot.supplyVitalityLabel)}
          {infoRow('econ-fabric-ops', t('econInfo.fabricOpsToday'), snapshot.fabricOpsSummary)}
          {section(t('econInfo.coreMetrics'))}
          <PlanetCoreStatInfoRow
            label={t('econInfo.resource')}
            pct={snapshot.resourcePct}
            trend={statTrends.resource}
            visualTheme={visualTheme}
          />
          <PlanetCoreStatInfoRow
            label={t('econInfo.population')}
            pct={snapshot.populationStatPct}
            trend={statTrends.population}
            visualTheme={visualTheme}
          />
          <PlanetCoreStatInfoRow
            label={t('econInfo.defense')}
            pct={snapshot.defensePct}
            trend={statTrends.defense}
            visualTheme={visualTheme}
          />
          <PlanetCoreStatInfoRow
            label={t('econInfo.technology')}
            pct={snapshot.technologyPct}
            trend={statTrends.technology}
            visualTheme={visualTheme}
          />
          <PlanetCoreStatInfoRow
            label={t('econInfo.environment')}
            pct={snapshot.environmentPct}
            trend={statTrends.environment}
            visualTheme={visualTheme}
          />
          {section(t('econInfo.tradeOccupy'))}
          {infoRow('econ-convoy-monopoly', t('econInfo.convoyMonopoly'), snapshot.convoyMonopolyLabel)}
          {infoRow('econ-occupier', t('econInfo.occupierFaction'), snapshot.occupierFactionLabel)}
          {snapshot.factionVaultLabel != null ? (
            infoRow(
              'econ-faction-vault',
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

export const PlanetEconomyInfoOverlayContent = memo(function PlanetEconomyInfoOverlayContent({
  entry,
  onClose,
}: Props) {
  const inspected = useWorldStore((s) => s.inspectedPlanetInfoIds.includes(entry.planetId));
  if (!inspected) {
    return <UnidentifiedPlanetEconomyInfoOverlayContent entry={entry} onClose={onClose} />;
  }
  return <RevealedPlanetEconomyInfoOverlayContent entry={entry} onClose={onClose} />;
});

const styles = StyleSheet.create({
  /** bodyPanel padding(lg)을 상쇄해 행성 이미지를 스크롤 안에서도 카드 전폭으로 표시 */
  scrollBleedTop: {
    marginHorizontal: -SPACING.lg,
    marginTop: -SPACING.lg,
  },
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
