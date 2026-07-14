import React, { memo, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ArcOverlayTradeQuantityEntry } from '../arcOverlayStore';
import { formatCredits } from '../../../utils/formatCredits';
import { useT } from '../../../i18n';
import { COLORS, FONTS, SPACING } from '../../../utils/theme';
import { ArcOverlayCard } from '../ArcOverlayCard';
import { ArcOverlayFooterActions } from '../ArcOverlayFooterActions';
import { ArcOverlayInfoRow } from '../ArcOverlayInfoRow';
import { ArcButton } from '../ArcButton';
import { ShipPurchasePortraitSlot } from './ShipPurchasePortraitSlot';
import { resolveOverlayVisualTokens } from '../overlayVisualTokens';
import { resolveArcOverlayVisualTheme } from '../tacticalOverlayRollout';
import {
  TACTICAL_OVERLAY,
  tacticalPlanetEconomyOverlayStyles,
} from '../tacticalOverlayStyles';

type Props = {
  entry: ArcOverlayTradeQuantityEntry;
  onConfirm: (qty: number) => void;
  onCancel: () => void;
};

export const TradeQuantityOverlayContent = memo(function TradeQuantityOverlayContent({
  entry,
  onConfirm,
  onCancel,
}: Props) {
  const t = useT();
  const visualTheme = resolveArcOverlayVisualTheme('tradeQuantity');
  const isTactical = visualTheme === 'tactical';
  const tokens = useMemo(() => resolveOverlayVisualTokens(visualTheme), [visualTheme]);
  const minQty = entry.minQty ?? 1;
  const [qty, setQty] = useState(() => Math.min(entry.maxQty, Math.max(minQty, entry.initialQty ?? 1)));

  const totalPrice = entry.unitPrice * qty;
  const playerCredits = entry.playerCredits;
  const remainingCredits =
    entry.mode === 'buy' && playerCredits != null ? playerCredits - totalPrice : null;
  const canDec = qty > minQty;
  const canInc = qty < entry.maxQty;
  const canMax = qty < entry.maxQty;

  const setMaxQty = () => {
    if (entry.maxQty >= minQty) setQty(entry.maxQty);
  };

  const topTip = useMemo(() => {
    const tips = entry.tips ?? [];
    return tips.length > 0 ? tips[0]! : null;
  }, [entry.tips]);

  const headerSubtitle = entry.mode === 'buy' ? t('tradeQty.headerBuy') : t('tradeQty.headerSell');
  const sectionBarStyle = isTactical ? tacticalPlanetEconomyOverlayStyles.section : styles.sectionPhosphor;

  /** 행성정보와 동일 — cardBg 본문 위 ArcOverlayInfoRow (inset 회색 박스 없음) */
  const metaPrefix = (
    <View style={styles.metaSection}>
      <ArcOverlayInfoRow
        label={t('tradeQty.unitLabel')}
        value={formatCredits(entry.unitPrice, { suffix: true })}
        visualTheme={visualTheme}
      />
      {entry.stock != null ? (
        <ArcOverlayInfoRow
          label={t('tradeQty.stockLabel')}
          value={t('tradeQty.stockValue', { n: entry.stock })}
          visualTheme={visualTheme}
        />
      ) : null}
      {entry.demandLabel ? (
        <ArcOverlayInfoRow
          label={t('tradeQty.demandLabelShort')}
          value={entry.demandLabel}
          visualTheme={visualTheme}
        />
      ) : null}
      {entry.ownedQty != null ? (
        <ArcOverlayInfoRow
          label={t('tradeQty.ownedLabel')}
          value={t('tradeQty.ownedValue', { n: entry.ownedQty })}
          visualTheme={visualTheme}
        />
      ) : null}
    </View>
  );

  const shipPortraitPrefix = entry.npcCapitalShipId ? (
    <ShipPurchasePortraitSlot npcCapitalShipId={entry.npcCapitalShipId} />
  ) : undefined;

  return (
    <ArcOverlayCard
      title={entry.title}
      subtitle={headerSubtitle}
      layout="panel"
      panelPrefix={metaPrefix}
      visualTheme={visualTheme}
      onClose={onCancel}
      footer={(
        <ArcOverlayFooterActions
          onCancel={onCancel}
          onConfirm={() => onConfirm(qty)}
          confirmLabel={entry.mode === 'buy' ? t('tradeQty.buy', { qty }) : t('tradeQty.sell', { qty })}
          visualTheme={visualTheme}
        />
      )}
    >
      {shipPortraitPrefix ? (
        <View style={styles.shipPortraitSection}>{shipPortraitPrefix}</View>
      ) : null}

      {entry.mode === 'buy' && entry.itemDescription ? (
        <View style={styles.descSection}>
          <Text style={sectionBarStyle}>{t('tradeQty.descSection')}</Text>
          <Text
            style={[styles.descText, { color: tokens.bodyInk }]}
            numberOfLines={3}
            ellipsizeMode="tail"
          >
            {entry.itemDescription}
          </Text>
        </View>
      ) : null}

      {entry.mode === 'buy' ? (
        <View style={styles.tipsSection}>
          <Text style={sectionBarStyle}>{t('tradeQty.tipsTitle')}</Text>
          {topTip ? (
            <Text style={[styles.tipLine, { color: tokens.bodyInk }]}>
              {t('tradeQty.tipLine', { planet: topTip.planetName, profit: formatCredits(topTip.profitPerUnit) })}
            </Text>
          ) : (
            <Text style={[styles.tipEmpty, { color: tokens.labelInk }]}>{t('tradeQty.tipEmpty')}</Text>
          )}
        </View>
      ) : null}

      <View style={styles.qtySection}>
        <Text style={sectionBarStyle}>{t('tradeQty.qtyLabel')}</Text>
        <View style={styles.qtyRow}>
          <ArcButton
            label="−"
            variant={isTactical ? 'tacticalSecondary' : 'secondary'}
            visualTheme={visualTheme}
            intent="secondary"
            disabled={!canDec}
            onPress={() => canDec && setQty((q) => Math.max(minQty, q - 1))}
            compact
            style={styles.qtyBtn}
          />
          <Text style={[styles.qtyValue, { color: tokens.valueInk }]}>{qty}</Text>
          <ArcButton
            label="+"
            variant={isTactical ? 'tacticalSecondary' : 'secondary'}
            visualTheme={visualTheme}
            intent="secondary"
            disabled={!canInc}
            onPress={() => canInc && setQty((q) => Math.min(entry.maxQty, q + 1))}
            compact
            style={styles.qtyBtn}
          />
          <ArcButton
            label="MAX"
            variant={isTactical ? 'tacticalPrimary' : 'primary'}
            visualTheme={visualTheme}
            intent="primary"
            disabled={!canMax}
            onPress={() => canMax && setMaxQty()}
            compact
            style={styles.maxBtn}
          />
        </View>
        <Text style={[styles.totalLine, { color: tokens.valueInk }]}>
          {t('tradeQty.total', { price: formatCredits(totalPrice) })}
          {remainingCredits != null ? (
            <Text
              style={[
                styles.totalCreditsSuffix,
                { color: remainingCredits < 0 ? COLORS.danger : tokens.valueInk },
              ]}
            >
              {t('tradeQty.remaining', { credits: formatCredits(remainingCredits, { suffix: false }) })}
            </Text>
          ) : null}
        </Text>
        <Text style={[styles.maxHint, { color: tokens.labelInk }]}>
          {t('tradeQty.maxHint', { n: entry.maxQty })}
        </Text>
      </View>
    </ArcOverlayCard>
  );
});

const styles = StyleSheet.create({
  shipPortraitSection: {
    alignSelf: 'stretch',
    width: '100%',
    marginBottom: SPACING.sm,
  },
  metaSection: {
    alignSelf: 'stretch',
    width: '100%',
    marginBottom: SPACING.sm,
    gap: 2,
  },
  sectionPhosphor: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    letterSpacing: 0.5,
    textAlign: 'center',
    color: TACTICAL_OVERLAY.labelInk,
  },
  descSection: {
    marginBottom: SPACING.sm,
  },
  descText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    lineHeight: 20,
    textAlign: 'left',
    paddingHorizontal: SPACING.xs,
  },
  tipsSection: {
    marginBottom: SPACING.sm,
  },
  tipLine: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    lineHeight: 18,
    paddingHorizontal: SPACING.xs,
  },
  tipEmpty: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    lineHeight: 18,
    paddingHorizontal: SPACING.xs,
  },
  qtySection: {
    alignSelf: 'stretch',
    width: '100%',
    marginTop: SPACING.xs,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },
  qtyBtn: {
    width: 44,
    minHeight: 40,
    paddingHorizontal: 4,
  },
  maxBtn: {
    minWidth: 52,
    minHeight: 40,
    paddingHorizontal: SPACING.xs,
  },
  qtyValue: {
    minWidth: 48,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    textAlign: 'center',
  },
  totalLine: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  totalCreditsSuffix: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
  },
  maxHint: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
});
