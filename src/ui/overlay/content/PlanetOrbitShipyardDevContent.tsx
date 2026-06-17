import React, { memo, useCallback } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { PlanetDevelopmentModuleContext } from '../../../game/planetDevelopment/planetDevelopmentRegistry';
import {
  PLANET_DEV_MODULE_ORBIT_SHIPYARD,
  buildOrbitShipyardDevSnapshot,
  installPlanetOrbitShipyard,
} from '../../../game/planetDevelopment/planetOrbitShipyardDevelopment';
import { usePlanetCoreRuntimeStore } from '../../../store/planetCoreRuntimeStore';
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

export const PlanetOrbitShipyardDevContent = memo(function PlanetOrbitShipyardDevContent({
  planetId,
  planetName,
  isHomePlanet,
  onBack,
  onClose,
}: PlanetDevelopmentModuleContext) {
  // 설치 직후 리렌더 — 런타임 정본 변경 구독
  const shipyardRev = usePlanetCoreRuntimeStore(
    useCallback((s) => {
      const dev = s.byPlanetId[planetId]?.detail?.development?.byModuleId?.[PLANET_DEV_MODULE_ORBIT_SHIPYARD];
      return JSON.stringify(dev ?? null);
    }, [planetId]),
  );
  void shipyardRev;

  const snapshot = buildOrbitShipyardDevSnapshot(planetId);
  const PH = OVERLAY_TOKENS.phosphorAccent;

  const handlePressInstall = useCallback(() => {
    if (!isHomePlanet) {
      showArcAlert('거점 행성 전용', '조선소 설치는 거점 행성에서만 가능합니다.');
      return;
    }
    showArcAlert(
      '궤도 조선소 설치',
      `궤도 조선소를 설치하시겠습니까?\n\n비용: ${formatCredits(snapshot.installCost, { suffix: true })}\n설치 후 이 행성 허브에서 조선소를 이용할 수 있습니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '설치',
          onPress: () => {
            const res = installPlanetOrbitShipyard(planetId);
            if (!res.ok) showArcAlert('설치 실패', res.reason);
          },
        },
      ],
    );
  }, [isHomePlanet, planetId, snapshot.installCost]);

  return (
    <View style={styles.card}>
      <Text style={[styles.title, { color: PH }]}>궤도 조선소 개발</Text>
      <Text style={[styles.subtitle, { color: PH }]}>{planetName}</Text>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.section, { color: PH }]}>현황</Text>
        <InfoRow
          label="상태"
          value={
            snapshot.baseOperational
              ? '기본 보유 · 조선소 가동'
              : snapshot.installedByDev
                ? '설치됨 · 조선소 가동'
                : '미설치'
          }
        />
        <Text style={[styles.hint, { color: PH }]}>
          {snapshot.baseOperational
            ? '이 행성은 조선소를 기본 보유 중입니다. 별도 개발이 필요 없습니다.'
            : '설치하면 이 행성 허브 메뉴에서 조선소를 이용할 수 있습니다. (레벨 업그레이드는 향후 추가)'}
        </Text>
      </ScrollView>

      <View style={styles.btnCol}>
        {!snapshot.operational ? (
          <ArcButton
            label={`설치 (${formatCredits(snapshot.installCost, { suffix: true })})`}
            variant="cta"
            disabled={!isHomePlanet || !snapshot.canInstall}
            onPress={handlePressInstall}
          />
        ) : (
          <Text style={[styles.hint, { color: PH }]}>✅ 조선소가 가동되어 허브에서 이용 가능합니다.</Text>
        )}
        <ArcButton label="← 개발 목록" variant="secondary" onPress={onBack} />
        <ArcButton label="닫기" variant="secondary" onPress={onClose} />
      </View>
    </View>
  );
});
