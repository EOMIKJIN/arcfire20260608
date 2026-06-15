import React, { memo, useCallback } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { listPlanetDevelopmentCatalogRows } from '../../../game/planetDevelopment/planetDevelopmentCatalog';
import { buildDefenseSatelliteDevSnapshot } from '../../../systems/planetaryDefense/planetDefenseSatelliteDevelopment';
import { formatCredits } from '../../../utils/formatCredits';
import { showArcAlert } from '../../../utils/showArcAlert';
import { OVERLAY_TOKENS } from '../../../utils/theme';
import { ArcButton } from '../ArcButton';
import { planetDevelopmentOverlayStyles as styles } from './planetDevelopmentOverlayStyles';

type Props = {
  planetId: string;
  planetName: string;
  credits: number;
  isHomePlanet: boolean;
  onSelectModule: (moduleId: string) => void;
  onClose: () => void;
};

export const PlanetDevelopmentListContent = memo(function PlanetDevelopmentListContent({
  planetId,
  planetName,
  credits,
  isHomePlanet,
  onSelectModule,
  onClose,
}: Props) {
  const PH = OVERLAY_TOKENS.phosphorAccent;
  const catalogRows = listPlanetDevelopmentCatalogRows();
  const defenseSnapshot = buildDefenseSatelliteDevSnapshot(planetId);

  const handlePressRow = useCallback((id: string, enabled: boolean, labelKo: string) => {
    if (enabled) {
      onSelectModule(id);
      return;
    }
    showArcAlert('준비 중', `${labelKo} 개발은 향후 업데이트에서 추가됩니다.`);
  }, [onSelectModule]);

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
        {catalogRows.map((row) => {
          const isDefense = row.id === 'defense_satellite';
          const meta = isDefense
            ? (defenseSnapshot.installed
              ? `Lv.${defenseSnapshot.level} · 가동 ${defenseSnapshot.activeSatelliteCount}기`
              : '미설치 · 탭하여 설치')
              + (defenseSnapshot.isUpgrading ? ' · 업그레이드 중' : '')
            : `${row.summaryKo} · 준비 중`;
          return (
            <Pressable
              key={row.id}
              style={({ pressed }) => [
                styles.listItem,
                !row.enabled && styles.listItemDisabled,
                pressed && styles.listItemPressed,
              ]}
              onPress={() => handlePressRow(row.id, row.enabled, row.labelKo)}
            >
              <Text
                style={[
                  styles.listItemTitle,
                  !row.enabled && styles.listItemTitleDisabled,
                  { color: PH },
                ]}
              >
                {isDefense && defenseSnapshot.installed ? '🛰 ' : ''}
                {row.labelKo}
              </Text>
              <Text style={[styles.listItemMeta, { color: PH }]}>{meta}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.btnRow}>
        <ArcButton label="닫기" variant="primary" onPress={onClose} />
      </View>
    </View>
  );
});
