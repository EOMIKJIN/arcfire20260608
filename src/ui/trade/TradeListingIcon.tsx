import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getItemDef } from '../../data/goods';
import type { TradeGoodCategory } from '../../types';
import type { TradeBuySubTabId } from '../../game/tradeBuySubTab';
import { FONTS } from '../../utils/theme';
import { TACTICAL_FACILITY as TF } from '../tactical/tacticalFacilityScreenTokens';

export const TRADE_LISTING_ICON_SIZE_PX = 44;

const CATEGORY_ICONS: Record<TradeGoodCategory | string, string> = {
  food: '🌾',
  mineral: '⛏',
  tech: '⚙',
  weapon: '⚔',
  luxury: '💎',
  contraband: '🚫',
};

const EQUIPMENT_CATEGORY_ICONS: Record<string, string> = {
  propulsion: '⚡',
  defense: '🛡',
  sensor: '📡',
  ew: '📶',
  support: '🔧',
  navigation: '🧭',
  mining: '⛏',
};

function resolveEquipmentCategoryIcon(attrs: Record<string, unknown> | undefined): string | null {
  const raw = attrs?.equipmentCategory;
  if (typeof raw !== 'string') return null;
  return EQUIPMENT_CATEGORY_ICONS[raw.trim().toLowerCase()] ?? null;
}

export function resolveTradeListingIconGlyph(
  goodId: string,
  category: string,
  buySubTab?: TradeBuySubTabId,
): string {
  const def = getItemDef(goodId);
  if (def?.type === 'capital_ship') return '🚀';
  if (def?.type === 'weapon_module' || buySubTab === 'weapon') return '⚔';
  if (def?.kind === 'equipment' && def.type !== 'weapon_module') {
    const eqIcon = resolveEquipmentCategoryIcon(def.attrs as Record<string, unknown> | undefined);
    if (eqIcon) return eqIcon;
    return '⚙';
  }
  if (def?.type === 'galactic_pool' || def?.type === 'orbital_mining') return '⛏';
  if (def?.type === 'planet_ownership') return '🪪';
  if (def?.type === 'clan_disband') return '📜';
  return CATEGORY_ICONS[category] ?? '📦';
}

type Props = {
  goodId: string;
  category: string;
  buySubTab?: TradeBuySubTabId;
};

export const TradeListingIcon = memo(function TradeListingIcon({
  goodId,
  category,
  buySubTab,
}: Props) {
  const glyph = resolveTradeListingIconGlyph(goodId, category, buySubTab);
  return (
    <View style={styles.slot} accessibilityRole="image" accessibilityLabel="아이템 아이콘">
      <Text style={styles.glyph}>{glyph}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  slot: {
    width: TRADE_LISTING_ICON_SIZE_PX,
    height: TRADE_LISTING_ICON_SIZE_PX,
    borderWidth: 1,
    borderColor: TF.insetBorder,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TF.insetBg,
    flexShrink: 0,
  },
  glyph: {
    fontSize: 22,
    lineHeight: 26,
    textAlign: 'center',
    fontFamily: FONTS.mono,
  },
});
