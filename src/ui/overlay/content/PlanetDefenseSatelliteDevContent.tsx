import React, { memo, useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
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
import { OVERLAY_TOKENS } from '../../../utils/theme';
import { ArcButton } from '../ArcButton';
import { planetDevelopmentOverlayStyles as styles } from './planetDevelopmentOverlayStyles';

function InfoRow({ label, value }: { label: string; value: string }) {
  const PH = OVERLAY_TOKENS.phosphorAccent;
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: PH }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: PH }]}>{value}</Text>
    </View>
  );
}

export const PlanetDefenseSatelliteDevContent = memo(function PlanetDefenseSatelliteDevContent({
  planetId,
  planetName,
  isHomePlanet,
  onBack,
  onClose,
}: PlanetDevelopmentModuleContext) {
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

  return (
    <View style={styles.card}>
      <Text style={[styles.title, { color: PH }]}>방위위성 개발</Text>
      <Text style={[styles.subtitle, { color: PH }]}>{planetName}</Text>
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
        <ArcButton label="← 개발 목록" variant="secondary" onPress={onBack} />
        <ArcButton label="닫기" variant="secondary" onPress={onClose} />
      </View>
    </View>
  );
});
