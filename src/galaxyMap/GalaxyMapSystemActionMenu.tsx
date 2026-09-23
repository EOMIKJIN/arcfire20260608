// ============================================================
// 은하계 지도 — 선택 성계 옆 액션 드롭다운 (이동·착륙 / 행성정보 / 전투)
// 지도의 팬 가능한 콘텐츠 좌표 레이어 안에서 성계 노드 옆에 앵커링된다.
// `side`는 부모(worldmap.tsx)가 다른 성계 노드의 탭 히트서클과 겹치지 않는
// direction(right/left/below/above)을 미리 계산해서 넘긴다.
// ============================================================

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { FONTS, SPACING } from '../utils/theme';
import { TACTICAL_HUB as TH } from '../ui/tactical/tacticalHubTokens';
import {
  resolveGalaxyMapActionMenuLabelColor,
  type GalaxyMapSystemActionMenuInk,
} from './galaxyMapActionMenuInk';
import {
  MENU_FIRST_ROW_HALF,
  MENU_FIRST_ROW_HIT_GAP,
  MENU_ITEM_HEIGHT,
  MENU_WIDTH,
} from './galaxyMapSystemActionMenuHit';

export type { GalaxyMapSystemActionMenuInk };
export { resolveGalaxyMapActionMenuLabelColor };
export {
  MENU_FIRST_ROW_HALF,
  MENU_FIRST_ROW_HIT_GAP,
  MENU_ITEM_HEIGHT,
  MENU_WIDTH,
  isGalaxyMapMenuCloseHit,
  isGalaxyMapMenuNavHit,
  resolveGalaxyMapMenuTap,
} from './galaxyMapSystemActionMenuHit';
export type { GalaxyMapMenuTapResult } from './galaxyMapSystemActionMenuHit';

export type GalaxyMapSystemActionMenuItem = {
  key: 'nav' | 'planetInfo' | 'combat';
  label: string;
  disabled?: boolean;
  /** land=착륙 가능할 때만 녹색 · combat=전투 가능할 때만 적색 */
  ink?: GalaxyMapSystemActionMenuInk;
  onPress: () => void;
};

export type GalaxyMapSystemActionMenuSide = 'right' | 'left' | 'below' | 'above';

type Props = {
  /** 맵 콘텐츠 좌표 (toScreen · 성계 노드 중심) */
  anchorX: number;
  anchorY: number;
  side: GalaxyMapSystemActionMenuSide;
  items: GalaxyMapSystemActionMenuItem[];
  onClose: () => void;
  closeA11yLabel: string;
};

const MENU_CLOSE_GLYPH_SIZE = 22;

/** 성계 노드 중심 기준 여백 — right/left는 가로, above/below는 세로 */
export const MENU_ANCHOR_OFFSET_X = 34;
export const MENU_ANCHOR_OFFSET_Y = 30;

/** side + 성계 노드 중심 좌표 → 메뉴 카드 좌상단(left/top) — worldmap.tsx의 겹침 판정과 반드시 동일 공식 유지 */
export function resolveMenuTopLeft(
  side: GalaxyMapSystemActionMenuSide,
  anchorX: number,
  anchorY: number,
  itemCount: number,
): { left: number; top: number } {
  const menuHeight = itemCount * MENU_ITEM_HEIGHT;
  switch (side) {
    case 'left':
      return { left: anchorX - MENU_ANCHOR_OFFSET_X - MENU_WIDTH, top: anchorY - MENU_ITEM_HEIGHT / 2 };
    case 'below':
      return { left: anchorX - MENU_WIDTH / 2, top: anchorY + MENU_ANCHOR_OFFSET_Y };
    case 'above':
      return { left: anchorX - MENU_WIDTH / 2, top: anchorY - MENU_ANCHOR_OFFSET_Y - menuHeight };
    case 'right':
    default:
      return { left: anchorX + MENU_ANCHOR_OFFSET_X, top: anchorY - MENU_ITEM_HEIGHT / 2 };
  }
}

export const GalaxyMapSystemActionMenu = memo(function GalaxyMapSystemActionMenu({
  anchorX,
  anchorY,
  side,
  items,
  onClose,
  closeA11yLabel,
}: Props) {
  const menuHeight = items.length * MENU_ITEM_HEIGHT;
  const { left, top } = resolveMenuTopLeft(side, anchorX, anchorY, items.length);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.anchorWrap, { left, top, width: MENU_WIDTH, height: menuHeight }]}
    >
      <View style={[styles.menuCard, { width: MENU_WIDTH, height: menuHeight }]} pointerEvents="auto">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isFirst = index === 0;
          const label = (
            <Text
              style={[
                styles.menuItemLabel,
                { color: resolveGalaxyMapActionMenuLabelColor(item.ink, !!item.disabled) },
              ]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          );
          if (isFirst) {
            return (
              <View key={item.key} style={[styles.firstRow, !isLast && styles.menuItemBorder]}>
                <TouchableOpacity
                  style={[styles.navHit, item.disabled && styles.menuItemDisabled]}
                  onPress={item.onPress}
                  disabled={item.disabled}
                  activeOpacity={0.72}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !!item.disabled }}
                >
                  {label}
                </TouchableOpacity>
                <View style={styles.firstRowGap} pointerEvents="none" />
                <TouchableOpacity
                  style={styles.closeHit}
                  onPress={onClose}
                  activeOpacity={0.72}
                  accessibilityRole="button"
                  accessibilityLabel={closeA11yLabel}
                >
                  <View style={styles.closeBtn}>
                    <Text style={styles.closeGlyph}>✕</Text>
                  </View>
                </TouchableOpacity>
              </View>
            );
          }
          return (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.menuItem,
                !isLast && styles.menuItemBorder,
                item.disabled && styles.menuItemDisabled,
              ]}
              onPress={item.onPress}
              disabled={item.disabled}
              activeOpacity={0.72}
              accessibilityRole="button"
              accessibilityState={{ disabled: !!item.disabled }}
            >
              {label}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  anchorWrap: {
    position: 'absolute',
    zIndex: 12,
  },
  menuCard: {
    borderWidth: 1,
    borderColor: TH.controlBtnBorder,
    backgroundColor: TH.controlBtnBg,
    borderRadius: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 4,
    elevation: 4,
  },
  firstRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    height: MENU_ITEM_HEIGHT,
    minHeight: MENU_ITEM_HEIGHT,
    backgroundColor: 'rgba(32, 36, 44, 0.88)',
  },
  navHit: {
    width: MENU_FIRST_ROW_HALF,
    height: MENU_ITEM_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  firstRowGap: {
    width: MENU_FIRST_ROW_HIT_GAP,
  },
  closeHit: {
    width: MENU_FIRST_ROW_HALF,
    height: MENU_ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: MENU_CLOSE_GLYPH_SIZE,
    height: MENU_CLOSE_GLYPH_SIZE,
    borderRadius: MENU_CLOSE_GLYPH_SIZE / 2,
    borderWidth: 1,
    borderColor: TH.controlBtnBorder,
    backgroundColor: 'rgba(20, 24, 32, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeGlyph: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: TH.miningSummaryInk,
    lineHeight: 16,
  },
  menuItem: {
    height: MENU_ITEM_HEIGHT,
    minHeight: MENU_ITEM_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    backgroundColor: 'rgba(32, 36, 44, 0.88)',
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TH.panelBorder,
  },
  menuItemDisabled: {
    opacity: 0.38,
  },
  menuItemLabel: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    color: TH.tileLabelPrimaryInk,
    letterSpacing: 0.4,
  },
});
