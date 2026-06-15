import React, { memo, useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { resolvePlayerHomePlanetId } from '../../../game/playerSurvivalPod';
import { listPlanetDevelopmentPlaceholderItems } from '../../../game/planetDevelopmentCatalog';
import { registerPlanetSessionResource } from '../../../game/planetSessionRegistry';
import { listPlanetDefenseSatelliteLevelRows } from '../../../arcCore/balance/planetDefenseSatelliteLevelPolicy';
import { usePlayerStore } from '../../../store/playerStore';
import { usePlanetCoreRuntimeStore } from '../../../store/planetCoreRuntimeStore';
import { formatCredits } from '../../../utils/formatCredits';
import { showArcAlert } from '../../../utils/showArcAlert';
import { FONTS, OVERLAY_TOKENS, SPACING } from '../../../utils/theme';
import { PlanetHubDigitalGauge } from '../../../components/planet/PlanetHubActionGaugeSlot';
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
import type { ArcOverlayPlanetDevelopmentEntry } from '../arcOverlayStore';
import { ArcButton } from '../ArcButton';

type DevView = 'list' | 'defense_satellite';

type Props = {
  entry: ArcOverlayPlanetDevelopmentEntry;
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

export const PlanetDevelopmentOverlayContent = memo(function PlanetDevelopmentOverlayContent({
  entry,
  onClose,
}: Props) {
  const { planetId, planetName, initialView = 'list' } = entry;
  const [view, setView] = useState<DevView>(initialView);
  const [tick, setTick] = useState(0);
  const player = usePlayerStore((s) => s.player);
  const credits = player?.credits ?? 0;
  const homePlanetId = player ? resolvePlayerHomePlanetId(player) : null;
  const isHomePlanet = homePlanetId === planetId;

  const defenseRev = usePlanetCoreRuntimeStore(
    useCallback((s) => JSON.stringify(s.byPlanetId[planetId]?.detail?.defenseSatellite ?? null), [planetId]),
  );

  useEffect(() => {
    setView(initialView);
  }, [entry.id, initialView]);

  useEffect(() => {
    void usePlanetCoreRuntimeStore.getState().bootstrapFromWorldAsync();
  }, [planetId]);

  const placeholderItems = listPlanetDevelopmentPlaceholderItems();

  const handlePressPlaceholder = useCallback((labelKo: string) => {
    showArcAlert('준비 중', `${labelKo} 개발은 향후 업데이트에서 추가됩니다.`);
  }, []);

  useEffect(() => {
    if (!planetId) return undefined;
    const token = registerPlanetSessionResource({
      ownerId: 'planet_development_overlay',
      planetId,
      dispose: () => {},
    });
    return () => token.release();
  }, [planetId]);

  useEffect(() => {
    if (view !== 'defense_satellite') return undefined;
    const id = setInterval(() => {
      tryCompleteDefenseSatelliteUpgrade(planetId);
      setTick((t) => t + 1);
    }, 500);
    return () => clearInterval(id);
  }, [view, planetId, defenseRev]);

  void tick;
  void defenseRev;

  const snapshot = buildDefenseSatelliteDevSnapshot(planetId);
  const currentRow = snapshot.level > 0 ? getDefenseSatelliteLevelStatRow(snapshot.level) : null;
  const PH = OVERLAY_TOKENS.phosphorAccent;

  const handlePressInstall = useCallback(() => {
    if (!isHomePlanet) {
      showArcAlert('거점 행성 전용', '방위위성 설치는 거점 행성에서만 가능합니다.');
      return;
    }
    showArcAlert(
      '방위위성 설치',
      `방위위성을 설치하시겠습니까?\n\n비용: ${formatCredits(snapshot.installCost, { suffix: true })}\n설치 후 Lv.1 · 위성 1기 가동`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '설치',
          onPress: () => {
            const res = installPlanetDefenseSatellite(planetId);
            if (!res.ok) showArcAlert('설치 실패', res.reason);
          },
        },
      ],
    );
  }, [isHomePlanet, planetId, snapshot.installCost]);

  const handleStartUpgrade = useCallback(() => {
    if (!isHomePlanet) {
      showArcAlert('거점 행성 전용', '업그레이드는 거점 행성에서만 가능합니다.');
      return;
    }
    const res = startPlanetDefenseSatelliteUpgrade(planetId);
    if (!res.ok) showArcAlert('업그레이드', res.reason);
  }, [isHomePlanet, planetId]);

  const handleInstantComplete = useCallback(() => {
    const res = instantCompleteDefenseSatelliteUpgrade(planetId);
    if (!res.ok) showArcAlert('즉시 완료', res.reason);
  }, [planetId]);

  const handleInstantNext = useCallback(() => {
    if (!isHomePlanet) {
      showArcAlert('거점 행성 전용', '업그레이드는 거점 행성에서만 가능합니다.');
      return;
    }
    const total = (snapshot.nextUpgradeCost ?? 0) + (snapshot.nextInstantCost ?? 0);
    showArcAlert(
      '즉시 업그레이드',
      `다음 레벨로 즉시 업그레이드하시겠습니까?\n\n비용: ${formatCredits(total, { suffix: true })}`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '즉시 업그레이드',
          onPress: () => {
            const res = instantUpgradeDefenseSatelliteNext(planetId);
            if (!res.ok) showArcAlert('즉시 업그레이드', res.reason);
          },
        },
      ],
    );
  }, [isHomePlanet, planetId, snapshot.nextInstantCost, snapshot.nextUpgradeCost]);

  if (view === 'list') {
    return (
      <View style={styles.card}>
        <Text style={[styles.title, { color: PH }]}>행성 개발</Text>
        <Text style={[styles.subtitle, { color: PH }]}>
          {planetName} · 보유 {formatCredits(credits, { suffix: true })}
        </Text>
        {!isHomePlanet ? (
          <Text style={[styles.hint, { color: PH }]}>
            거점 행성이 아닙니다. 설치·업그레이드는 거점에서만 가능합니다.
          </Text>
        ) : null}
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Pressable
            style={({ pressed }) => [styles.listItem, pressed && styles.listItemPressed]}
            onPress={() => setView('defense_satellite')}
          >
            <Text style={[styles.listItemTitle, { color: PH }]}>
              {snapshot.installed ? '🛰 ' : ''}방위위성
            </Text>
            <Text style={[styles.listItemMeta, { color: PH }]}>
              {snapshot.installed
                ? `Lv.${snapshot.level} · 가동 ${snapshot.activeSatelliteCount}기`
                : '미설치 · 탭하여 설치'}
              {snapshot.isUpgrading ? ' · 업그레이드 중' : ''}
            </Text>
          </Pressable>
          {placeholderItems.map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [
                styles.listItem,
                styles.listItemDisabled,
                pressed && styles.listItemPressed,
              ]}
              onPress={() => handlePressPlaceholder(item.labelKo)}
            >
              <Text style={[styles.listItemTitle, styles.listItemTitleDisabled, { color: PH }]}>
                {item.labelKo}
              </Text>
              <Text style={[styles.listItemMeta, { color: PH }]}>
                {item.summaryKo} · 준비 중
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.btnRow}>
          <ArcButton label="닫기" variant="primary" onPress={onClose} />
        </View>
      </View>
    );
  }

  const levelRows = listPlanetDefenseSatelliteLevelRows();
  const nextDurationLabel = snapshot.nextUpgradeDurationSec != null
    ? formatDefenseSatelliteDurationLabel(snapshot.nextUpgradeDurationSec)
    : '—';

  return (
    <View style={styles.card}>
      <Text style={[styles.title, { color: PH }]}>방위위성 개발</Text>
      <Text style={[styles.subtitle, { color: PH }]}>
        {planetName} · 보유 {formatCredits(credits, { suffix: true })}
      </Text>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.section, { color: PH }]}>현황</Text>
        <InfoRow
          label="상태"
          value={
            snapshot.installed
              ? `Lv.${snapshot.level} · 위성 ${snapshot.activeSatelliteCount}기`
              : '미설치'
          }
        />
        {currentRow ? (
          <>
            <InfoRow label="체력" value={`${currentRow.hpMax}`} />
            <InfoRow label="방어범위" value={`${currentRow.defenseZoneDiameterPx}px`} />
            <InfoRow label="명중률" value={`${currentRow.interceptHitPct}%`} />
            <InfoRow label="요격(체류)" value={`${currentRow.interceptDwellSec}초`} />
          </>
        ) : null}

        {snapshot.isUpgrading ? (
          <View style={styles.gaugeBlock}>
            <Text style={[styles.section, { color: PH }]}>업그레이드 진행</Text>
            <Text style={[styles.hint, { color: PH }]}>
              Lv.{snapshot.level} → Lv.{snapshot.upgradeJob?.targetLevel ?? '?'}
            </Text>
            <PlanetHubDigitalGauge
              progressPct={snapshot.upgradeProgressPct}
              accessibilityLabel={`업그레이드 ${snapshot.upgradeProgressPct}%`}
            />
          </View>
        ) : null}

        <Text style={[styles.section, { color: PH }]}>레벨별 스탯 (L1~L10)</Text>
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
              {row.grantsSecondSatellite ? ' · 2기' : ''}
              {row.level === snapshot.level ? ' ◀' : ''}
            </Text>
            <Text style={[styles.levelRowMeta, { color: PH }]}>
              HP {row.hpMax} · {row.defenseZoneDiameterPx}px · 명중 {row.interceptHitPct}% · {row.interceptDwellSec}s
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.btnCol}>
        {!snapshot.installed ? (
          <ArcButton
            label={`설치 (${formatCredits(snapshot.installCost, { suffix: true })})`}
            variant="cta"
            disabled={!isHomePlanet || !snapshot.canInstall}
            onPress={handlePressInstall}
          />
        ) : null}
        {snapshot.installed && !snapshot.isUpgrading && snapshot.nextTargetLevel != null ? (
          <>
            <ArcButton
              label={`Lv.${snapshot.level}→${snapshot.nextTargetLevel} 업그레이드 (${formatCredits(snapshot.nextUpgradeCost ?? 0, { suffix: true })} · ${nextDurationLabel})`}
              variant="primary"
              disabled={!isHomePlanet || !snapshot.canStartUpgrade}
              onPress={handleStartUpgrade}
            />
            <ArcButton
              label={`즉시 Lv.${snapshot.nextTargetLevel} (${formatCredits((snapshot.nextUpgradeCost ?? 0) + (snapshot.nextInstantCost ?? 0), { suffix: true })})`}
              variant="secondary"
              disabled={!isHomePlanet || !snapshot.canInstantUpgradeNext}
              onPress={handleInstantNext}
            />
          </>
        ) : null}
        {snapshot.isUpgrading ? (
          <ArcButton
            label={`즉시 완료 (${formatCredits(snapshot.nextInstantCost ?? 0, { suffix: true })})`}
            variant="cta"
            disabled={!snapshot.canInstantComplete}
            onPress={handleInstantComplete}
          />
        ) : null}
        <ArcButton label="← 개발 목록" variant="secondary" onPress={() => setView('list')} />
        <ArcButton label="닫기" variant="secondary" onPress={onClose} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: OVERLAY_TOKENS.cardMaxWidth,
    maxHeight: '86%',
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
  },
  subtitle: {
    marginTop: SPACING.xs,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    textAlign: 'center',
    opacity: 0.85,
  },
  hint: {
    marginTop: SPACING.sm,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    textAlign: 'center',
    opacity: 0.8,
  },
  scroll: {
    marginTop: SPACING.md,
    maxHeight: 340,
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
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    paddingVertical: 3,
  },
  rowLabel: {
    flex: 1,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
  },
  rowValue: {
    flex: 1,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    textAlign: 'right',
  },
  listItem: {
    borderWidth: 1,
    borderColor: OVERLAY_TOKENS.phosphorBorder,
    borderRadius: 4,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  listItemPressed: {
    opacity: 0.85,
  },
  listItemDisabled: {
    opacity: 0.72,
  },
  listItemTitle: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
  },
  listItemTitleDisabled: {
    opacity: 0.85,
  },
  listItemMeta: {
    marginTop: 4,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    opacity: 0.9,
  },
  levelRow: {
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(110,128,160,0.35)',
  },
  levelRowActive: {
    backgroundColor: 'rgba(53,208,255,0.08)',
  },
  levelRowTitle: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.bold,
  },
  levelRowMeta: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    opacity: 0.85,
  },
  gaugeBlock: {
    marginVertical: SPACING.sm,
  },
  btnRow: {
    marginTop: SPACING.md,
  },
  btnCol: {
    marginTop: SPACING.md,
    rowGap: SPACING.sm,
  },
});
