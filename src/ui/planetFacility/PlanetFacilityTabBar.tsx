// ============================================================
// 행성 시설 공통 탭 — ArcButton tactical 과 동일 `[ ]`·테두리·mono
// (탭 전환 기능만 다름, 표기·디자인은 범용 버튼 정본)
// ============================================================

import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SPACING } from '../../utils/theme';
import { TACTICAL_FACILITY as TF } from '../tactical/tacticalFacilityScreenTokens';
import { ArcButton } from '../overlay/ArcButton';

export const PLANET_FACILITY_TAB_BAR_HEIGHT = 52;

export type PlanetFacilityTabItem = {
  id: string;
  label: string;
};

type Props = {
  tabs: readonly PlanetFacilityTabItem[];
  activeId: string;
  onSelect: (id: string) => void;
};

export const PlanetFacilityTabBar = memo(function PlanetFacilityTabBar({
  tabs,
  activeId,
  onSelect,
}: Props) {
  if (tabs.length === 0) return null;

  return (
    <View style={styles.bar}>
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <ArcButton
            key={tab.id}
            label={tab.label}
            variant={active ? 'tacticalPrimary' : 'tacticalSecondary'}
            onPress={() => onSelect(tab.id)}
            compact
            style={styles.tabBtn}
          />
        );
      })}
    </View>
  );
});

export const planetFacilityTabBarStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 4,
    minHeight: PLANET_FACILITY_TAB_BAR_HEIGHT,
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs,
    backgroundColor: TF.tabBarBg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TF.tabBarBorder,
  },
  tabBtn: {
    flex: 1,
    minWidth: 0,
    minHeight: 36,
    paddingVertical: 2,
    borderRadius: 4,
  },
});

const styles = planetFacilityTabBarStyles;
