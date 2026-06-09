// ============================================================
// 행성 시설 공통 상단 탭 — 무역소·조선소·선술집·연구소 일관 UI
// ============================================================

import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONTS } from '../../utils/theme';

export const PLANET_FACILITY_TAB_BAR_HEIGHT = 48;

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
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onSelect(tab.id)}
            activeOpacity={0.85}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
          >
            <Text style={[styles.tabText, active && styles.tabTextActive]} numberOfLines={1}>
              [{` ${tab.label} `}]
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

export const planetFacilityTabBarStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: PLANET_FACILITY_TAB_BAR_HEIGHT,
    backgroundColor: COLORS.bg_secondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    minHeight: PLANET_FACILITY_TAB_BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 12,
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: COLORS.info,
    backgroundColor: COLORS.bg_panel,
  },
  tabText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    color: COLORS.ink_light,
    textAlign: 'center',
  },
  tabTextActive: {
    color: COLORS.ink_dark,
    fontWeight: FONTS.weight.bold,
  },
});

const styles = planetFacilityTabBarStyles;
