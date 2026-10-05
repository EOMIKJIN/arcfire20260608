import React, { memo, useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { getNpcCapitalShip } from '../../../npc/npcFleetRegistry';
import { resolveNpcCapitalShipPortraitSource } from '../../../game/npcCapitalShipPortraitAssets';
import { useT } from '../../../i18n';
import { FONTS, OVERLAY_TOKENS } from '../../../utils/theme';

type Props = {
  npcCapitalShipId: string;
};

/**
 * 무역소 전함 구매창 — 헤더 바로 아래 카드 전폭 정사각형 슬롯.
 * 조선소·격납고와 동일하게 `npc_ai_ships.portraitImageAssetKey` 한 장만 쓴다.
 */
export const ShipPurchasePortraitSlot = memo(function ShipPurchasePortraitSlot({
  npcCapitalShipId,
}: Props) {
  const t = useT();
  const imageSource = useMemo(() => {
    const row = getNpcCapitalShip(npcCapitalShipId);
    return resolveNpcCapitalShipPortraitSource(row?.portraitImageAssetKey);
  }, [npcCapitalShipId]);

  if (imageSource) {
    return (
      <View style={[styles.frame, styles.frameFilled]}>
        <Image
          source={imageSource}
          style={styles.image}
          resizeMode="cover"
          resizeMethod="resize"
          accessibilityRole="image"
          accessibilityLabel={t('tradeQty.shipImageA11y')}
        />
      </View>
    );
  }

  return (
    <View
      style={[styles.frame, styles.frameEmpty]}
      accessible
      accessibilityLabel={t('tradeQty.shipImageA11y')}
    >
      <Text style={styles.pendingText}>{t('tradeQty.shipImagePending')}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  frame: {
    alignSelf: 'stretch',
    width: '100%',
    aspectRatio: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameEmpty: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(107, 212, 255, 0.22)',
    backgroundColor: 'rgba(8, 18, 28, 0.55)',
  },
  frameFilled: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: OVERLAY_TOKENS.phosphorBorder,
    backgroundColor: 'rgba(8, 18, 28, 0.72)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  pendingText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    letterSpacing: 0.5,
    color: 'rgba(150, 190, 210, 0.75)',
  },
});
