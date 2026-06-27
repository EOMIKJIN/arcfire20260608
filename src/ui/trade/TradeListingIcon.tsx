import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { TradeGoodCategory } from '../../types';
import type { TradeBuySubTabId } from '../../game/tradeBuySubTab';
import { TACTICAL_FACILITY as TF } from '../tactical/tacticalFacilityScreenTokens';
import { PlanetHubActionIcon } from '../tactical/PlanetHubActionIcon';
import { resolveTradeListingIconSpec } from '../tactical/listingIconSpecs';

export const TRADE_LISTING_ICON_SIZE_PX = 44;

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
  const spec = useMemo(
    () => resolveTradeListingIconSpec(goodId, category as TradeGoodCategory | string, buySubTab),
    [buySubTab, category, goodId],
  );

  return (
    <View style={styles.slot} accessibilityRole="image" accessibilityLabel="아이템 아이콘">
      <PlanetHubActionIcon spec={spec} size={22} color={TF.labelInk} />
    </View>
  );
});

type EmptySlotProps = {
  label?: string;
};

/** 인벤토리 빈 슬롯 — 중립 dot */
export const TradeListingEmptySlot = memo(function TradeListingEmptySlot({ label = '·' }: EmptySlotProps) {
  return (
    <View style={styles.slot} accessibilityRole="image" accessibilityLabel="빈 슬롯">
      <Text style={styles.emptyDot}>{label}</Text>
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
  emptyDot: {
    fontSize: 18,
    color: TF.mutedInk,
    opacity: 0.65,
  },
});
